import { FORMAT_VERSION, type AsrsProject, type GameMap, type TileType } from '../types';

/** 新規マップの初期サイズ。データ上は GameMap.width / height が正で、可変 */
export const DEFAULT_MAP_WIDTH = 32;
export const DEFAULT_MAP_HEIGHT = 24;

export function createDefaultMap(): GameMap {
  return {
    id: 'map-1',
    name: 'はじまりのマップ',
    width: DEFAULT_MAP_WIDTH,
    height: DEFAULT_MAP_HEIGHT,
    tiles: new Array<TileType>(DEFAULT_MAP_WIDTH * DEFAULT_MAP_HEIGHT).fill('floor'),
    events: [],
  };
}

export function createDefaultProject(): AsrsProject {
  const now = new Date().toISOString();
  return {
    formatVersion: FORMAT_VERSION,
    meta: { title: '新しいプロジェクト', author: '', createdAt: now, updatedAt: now },
    maps: [createDefaultMap()],
    startPoint: { mapId: 'map-1', x: 1, y: 1 },
  };
}
