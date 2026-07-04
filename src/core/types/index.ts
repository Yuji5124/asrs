export const FORMAT_VERSION = 1;

export type TileType = 'floor' | 'wall' | 'grass' | 'water';

export type EventAppearance = 'chest' | 'npc' | 'orb';

export interface MapEvent {
  id: string;
  name: string;
  x: number;
  y: number;
  appearance: EventAppearance;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  /** width * height 個の1次元配列。index = y * width + x */
  tiles: TileType[];
  events: MapEvent[];
}

export interface StartPoint {
  mapId: string;
  x: number;
  y: number;
}

export interface ProjectMeta {
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

/** プロジェクトJSONとして保存される定義データのルート */
export interface AsrsProject {
  formatVersion: number;
  meta: ProjectMeta;
  maps: GameMap[];
  startPoint: StartPoint;
}

/** テストプレイ中の実行時状態。プロジェクトJSONには保存しない */
export interface PlaySession {
  mapId: string;
  playerX: number;
  playerY: number;
}
