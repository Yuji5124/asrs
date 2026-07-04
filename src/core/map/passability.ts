import type { GameMap, MapEvent, TileType } from '../types';
import { TILE_DEFS } from './tiles';

export const INTERACTION_DIRECTIONS: readonly [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export function inBounds(map: GameMap, x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < map.width && y < map.height;
}

export function tileAt(map: GameMap, x: number, y: number): TileType | null {
  if (!inBounds(map, x, y)) return null;
  return map.tiles[y * map.width + x];
}

export function eventAt(map: GameMap, x: number, y: number): MapEvent | null {
  return map.events.find((e) => e.x === x && e.y === y) ?? null;
}

export function adjacentEventAt(map: GameMap, x: number, y: number): MapEvent | null {
  for (const [dx, dy] of INTERACTION_DIRECTIONS) {
    const event = eventAt(map, x + dx, y + dy);
    if (event !== null) return event;
  }
  return null;
}

/** 通行判定: マップ外・通行不可タイル・配置物のあるマスは通れない */
export function isWalkable(map: GameMap, x: number, y: number): boolean {
  const tile = tileAt(map, x, y);
  if (tile === null) return false;
  if (!TILE_DEFS[tile].walkable) return false;
  if (eventAt(map, x, y) !== null) return false;
  return true;
}
