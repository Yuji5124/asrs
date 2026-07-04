import { FORMAT_VERSION, type AsrsProject, type GameMap, type TileType } from '../types';

export const MAP_WIDTH = 16;
export const MAP_HEIGHT = 12;

export function createDefaultMap(): GameMap {
  return {
    id: 'map-1',
    name: 'はじまりのマップ',
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tiles: new Array<TileType>(MAP_WIDTH * MAP_HEIGHT).fill('floor'),
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
