import { create } from 'zustand';
import { EVENT_DEFS } from '../../core/map/events';
import { eventAt } from '../../core/map/passability';
import { TILE_DEFS } from '../../core/map/tiles';
import { createDefaultProject } from '../../core/save/project';
import { projectFromJson, projectToJson, type LoadResult } from '../../core/save/serialize';
import { loadProjectFromStorage, saveProjectToStorage } from '../../core/save/storage';
import type { AsrsProject, EventAppearance, MapEvent, TileType } from '../../core/types';

export type PaletteSelection =
  | { kind: 'tile'; tile: TileType }
  | { kind: 'event'; appearance: EventAppearance }
  | { kind: 'start' };

export type AppMode = 'edit' | 'play';

interface EditorState {
  project: AsrsProject;
  mode: AppMode;
  palette: PaletteSelection;
  selectedEventId: string | null;
  status: string;
  setMode: (mode: AppMode) => void;
  setPalette: (palette: PaletteSelection) => void;
  /** マップ上のマスにパレットで選択中のツールを適用する */
  applyToolAt: (x: number, y: number, isDrag: boolean) => void;
  renameEvent: (id: string, name: string) => void;
  deleteEvent: (id: string) => void;
  renameMap: (name: string) => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
  exportJson: () => string;
  importJson: (text: string) => void;
}

function initialProject(): AsrsProject {
  try {
    const loaded = loadProjectFromStorage();
    if (loaded?.project) return loaded.project;
  } catch {
    // localStorageが使えない環境では新規プロジェクトで開始する
  }
  return createDefaultProject();
}

function touch(project: AsrsProject): AsrsProject {
  return { ...project, meta: { ...project.meta, updatedAt: new Date().toISOString() } };
}

function nextEventId(events: MapEvent[], appearance: EventAppearance): string {
  let max = 0;
  for (const e of events) {
    const m = e.id.match(new RegExp(`^${appearance}-(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${appearance}-${max + 1}`;
}

function describeLoad(loaded: LoadResult): string {
  if (!loaded.project) return `読み込めません: ${loaded.errors.join(' / ')}`;
  if (loaded.warnings.length > 0) return `読み込みました（注意: ${loaded.warnings.join(' / ')}）`;
  return '読み込みました';
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: initialProject(),
  mode: 'edit',
  palette: { kind: 'tile', tile: 'floor' },
  selectedEventId: null,
  status: '',

  setMode: (mode) => set({ mode, status: '' }),
  setPalette: (palette) => set({ palette }),

  applyToolAt: (x, y, isDrag) => {
    const { project, palette } = get();
    const map = project.maps[0];
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return;

    // クリックした先に配置物があれば選択する（ドラッグ中の塗りは通す）
    const existing = eventAt(map, x, y);
    if (!isDrag && existing) {
      set({ selectedEventId: existing.id });
      return;
    }

    if (palette.kind === 'tile') {
      const index = y * map.width + x;
      if (map.tiles[index] === palette.tile) return;
      const tiles = map.tiles.slice();
      tiles[index] = palette.tile;
      set({ project: touch({ ...project, maps: [{ ...map, tiles }, ...project.maps.slice(1)] }) });
      return;
    }

    if (isDrag || existing) return;

    if (palette.kind === 'event') {
      const id = nextEventId(map.events, palette.appearance);
      const n = id.slice(palette.appearance.length + 1);
      const event: MapEvent = {
        id,
        name: `${EVENT_DEFS[palette.appearance].label}${n}`,
        x,
        y,
        appearance: palette.appearance,
      };
      set({
        project: touch({ ...project, maps: [{ ...map, events: [...map.events, event] }, ...project.maps.slice(1)] }),
        selectedEventId: id,
      });
      return;
    }

    // palette.kind === 'start'
    const tile = map.tiles[y * map.width + x];
    set({
      project: touch({ ...project, startPoint: { mapId: map.id, x, y } }),
      status: TILE_DEFS[tile].walkable
        ? `スタート地点を (${x}, ${y}) に設定しました`
        : '注意: スタート地点が通行できないタイルの上にあります',
    });
  },

  renameEvent: (id, name) => {
    const { project } = get();
    const map = project.maps[0];
    const events = map.events.map((e) => (e.id === id ? { ...e, name } : e));
    set({ project: touch({ ...project, maps: [{ ...map, events }, ...project.maps.slice(1)] }) });
  },

  deleteEvent: (id) => {
    const { project } = get();
    const map = project.maps[0];
    const events = map.events.filter((e) => e.id !== id);
    set({
      project: touch({ ...project, maps: [{ ...map, events }, ...project.maps.slice(1)] }),
      selectedEventId: null,
      status: '配置物を削除しました',
    });
  },

  renameMap: (name) => {
    const { project } = get();
    const map = project.maps[0];
    set({ project: touch({ ...project, maps: [{ ...map, name }, ...project.maps.slice(1)] }) });
  },

  saveToStorage: () => {
    const project = touch(get().project);
    try {
      saveProjectToStorage(project);
      set({ project, status: 'localStorageに保存しました' });
    } catch {
      set({ status: '保存に失敗しました' });
    }
  },

  loadFromStorage: () => {
    let loaded: LoadResult | null;
    try {
      loaded = loadProjectFromStorage();
    } catch {
      set({ status: '読み込みに失敗しました' });
      return;
    }
    if (loaded === null) {
      set({ status: '保存データがありません' });
      return;
    }
    if (!loaded.project) {
      set({ status: describeLoad(loaded) });
      return;
    }
    set({ project: loaded.project, selectedEventId: null, status: describeLoad(loaded) });
  },

  exportJson: () => projectToJson(get().project),

  importJson: (text) => {
    const loaded = projectFromJson(text);
    if (!loaded.project) {
      set({ status: describeLoad(loaded) });
      return;
    }
    set({ project: loaded.project, selectedEventId: null, status: describeLoad(loaded) });
  },
}));
