import { create } from 'zustand';
import { EVENT_DEFS } from '../../core/map/events';
import { fillRectTiles, floodFillTiles } from '../../core/map/paint';
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

export type TileTool = 'pen' | 'fill' | 'rect';

export type AppMode = 'edit' | 'play';

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2] as const;

const HISTORY_LIMIT = 50;

interface EditorState {
  project: AsrsProject;
  mode: AppMode;
  palette: PaletteSelection;
  tileTool: TileTool;
  zoom: number;
  selectedEventId: string | null;
  status: string;
  /** undo用スナップショット（古い順）。メモリ内のみで保存はしない */
  past: AsrsProject[];
  future: AsrsProject[];
  /** ドラッグ1回（ストローク）をundo1回にまとめるための状態 */
  stroke: { snapshot: AsrsProject; pushed: boolean } | null;
  setMode: (mode: AppMode) => void;
  setPalette: (palette: PaletteSelection) => void;
  setTileTool: (tool: TileTool) => void;
  setZoom: (zoom: number) => void;
  beginStroke: () => void;
  endStroke: () => void;
  /** マップ上のマスにパレットで選択中のツールを適用する */
  applyToolAt: (x: number, y: number, isDrag: boolean) => void;
  /** 矩形ツールの確定（2点間を選択中タイルで塗る） */
  applyRectFill: (x0: number, y0: number, x1: number, y1: number) => void;
  undo: () => void;
  redo: () => void;
  renameEvent: (id: string, name: string) => void;
  updateEventMessage: (id: string, text: string) => void;
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

export const useEditorStore = create<EditorState>((set, get) => {
  /** 変更をproject履歴に積んで反映する。ストローク中は開始時スナップショットを1回だけ積む */
  function commitChange(newProject: AsrsProject, extra: Partial<EditorState> = {}) {
    const { past, stroke, project } = get();
    if (stroke && stroke.pushed) {
      // 同じストローク内の2回目以降の変更: 履歴は積まない
      set({ project: touch(newProject), future: [], ...extra });
      return;
    }
    const snapshot = stroke ? stroke.snapshot : project;
    set({
      project: touch(newProject),
      past: [...past, snapshot].slice(-HISTORY_LIMIT),
      future: [],
      stroke: stroke ? { ...stroke, pushed: true } : null,
      ...extra,
    });
  }

  return {
    project: initialProject(),
    mode: 'edit',
    palette: { kind: 'tile', tile: 'floor' },
    tileTool: 'pen',
    zoom: 1,
    selectedEventId: null,
    status: '',
    past: [],
    future: [],
    stroke: null,

    setMode: (mode) => set({ mode, status: '' }),
    setPalette: (palette) => set({ palette }),
    setTileTool: (tileTool) => set({ tileTool }),
    setZoom: (zoom) => set({ zoom }),

    beginStroke: () => set({ stroke: { snapshot: get().project, pushed: false } }),
    endStroke: () => set({ stroke: null }),

    applyToolAt: (x, y, isDrag) => {
      const { project, palette, tileTool } = get();
      const map = project.maps[0];
      if (x < 0 || y < 0 || x >= map.width || y >= map.height) return;

      // クリックした先に配置物があれば選択する（ドラッグ中の塗りは通す）
      const existing = eventAt(map, x, y);
      if (!isDrag && existing) {
        set({ selectedEventId: existing.id });
        return;
      }

      if (palette.kind === 'tile') {
        if (tileTool === 'rect') return; // 矩形はMapCanvas側のドラッグ確定で塗る

        if (tileTool === 'fill') {
          if (isDrag) return;
          const tiles = floodFillTiles(map, x, y, palette.tile);
          if (!tiles) return;
          commitChange({ ...project, maps: [{ ...map, tiles }, ...project.maps.slice(1)] }, {
            status: `${TILE_DEFS[palette.tile].label}で塗りつぶしました`,
          });
          return;
        }

        const index = y * map.width + x;
        if (map.tiles[index] === palette.tile) return;
        const tiles = map.tiles.slice();
        tiles[index] = palette.tile;
        commitChange({ ...project, maps: [{ ...map, tiles }, ...project.maps.slice(1)] });
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
          commands: [{ type: 'showMessage', text: EVENT_DEFS[palette.appearance].defaultMessage }],
        };
        commitChange(
          { ...project, maps: [{ ...map, events: [...map.events, event] }, ...project.maps.slice(1)] },
          { selectedEventId: id },
        );
        return;
      }

      // palette.kind === 'start'
      const tile = map.tiles[y * map.width + x];
      commitChange(
        { ...project, startPoint: { mapId: map.id, x, y } },
        {
          status: TILE_DEFS[tile].walkable
            ? `スタート地点を (${x}, ${y}) に設定しました`
            : '注意: スタート地点が通行できないタイルの上にあります',
        },
      );
    },

    applyRectFill: (x0, y0, x1, y1) => {
      const { project, palette } = get();
      if (palette.kind !== 'tile') return;
      const map = project.maps[0];
      const tiles = fillRectTiles(map, x0, y0, x1, y1, palette.tile);
      if (!tiles) return;
      commitChange({ ...project, maps: [{ ...map, tiles }, ...project.maps.slice(1)] }, {
        status: `${TILE_DEFS[palette.tile].label}で矩形に塗りました`,
      });
    },

    undo: () => {
      const { past, future, project } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        project: previous,
        past: past.slice(0, -1),
        future: [project, ...future].slice(0, HISTORY_LIMIT),
        selectedEventId: null,
        stroke: null,
        status: '元に戻しました',
      });
    },

    redo: () => {
      const { past, future, project } = get();
      if (future.length === 0) return;
      const next = future[0];
      set({
        project: next,
        past: [...past, project].slice(-HISTORY_LIMIT),
        future: future.slice(1),
        selectedEventId: null,
        stroke: null,
        status: 'やり直しました',
      });
    },

    renameEvent: (id, name) => {
      const { project } = get();
      const map = project.maps[0];
      const events = map.events.map((e) => (e.id === id ? { ...e, name } : e));
      set({ project: touch({ ...project, maps: [{ ...map, events }, ...project.maps.slice(1)] }) });
    },

    updateEventMessage: (id, text) => {
      const { project } = get();
      const map = project.maps[0];
      const events = map.events.map((e) =>
        e.id === id ? { ...e, commands: [{ type: 'showMessage' as const, text }] } : e,
      );
      set({ project: touch({ ...project, maps: [{ ...map, events }, ...project.maps.slice(1)] }) });
    },

    deleteEvent: (id) => {
      const { project } = get();
      const map = project.maps[0];
      const events = map.events.filter((e) => e.id !== id);
      commitChange(
        { ...project, maps: [{ ...map, events }, ...project.maps.slice(1)] },
        { selectedEventId: null, status: '配置物を削除しました' },
      );
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
      set({
        project: loaded.project,
        selectedEventId: null,
        past: [],
        future: [],
        stroke: null,
        status: describeLoad(loaded),
      });
    },

    exportJson: () => projectToJson(get().project),

    importJson: (text) => {
      const loaded = projectFromJson(text);
      if (!loaded.project) {
        set({ status: describeLoad(loaded) });
        return;
      }
      set({
        project: loaded.project,
        selectedEventId: null,
        past: [],
        future: [],
        stroke: null,
        status: describeLoad(loaded),
      });
    },
  };
});
