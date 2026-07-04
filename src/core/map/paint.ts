import type { GameMap, TileType } from '../types';
import { inBounds } from './passability';

/**
 * (x, y) と同じタイルで連結している領域を tile で塗りつぶした新しい tiles 配列を返す。
 * 変化がない場合（起点が同じタイル・マップ外）は null。
 */
export function floodFillTiles(map: GameMap, x: number, y: number, tile: TileType): TileType[] | null {
  if (!inBounds(map, x, y)) return null;
  const from = map.tiles[y * map.width + x];
  if (from === tile) return null;
  const tiles = map.tiles.slice();
  const stack: number[] = [y * map.width + x];
  while (stack.length > 0) {
    const index = stack.pop()!;
    if (tiles[index] !== from) continue;
    tiles[index] = tile;
    const cx = index % map.width;
    const cy = (index - cx) / map.width;
    if (cx > 0) stack.push(index - 1);
    if (cx < map.width - 1) stack.push(index + 1);
    if (cy > 0) stack.push(index - map.width);
    if (cy < map.height - 1) stack.push(index + map.width);
  }
  return tiles;
}

/**
 * 2点で指定した矩形（マップ内にクランプ）を tile で塗った新しい tiles 配列を返す。
 * 変化がない場合は null。
 */
export function fillRectTiles(
  map: GameMap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  tile: TileType,
): TileType[] | null {
  const left = Math.max(0, Math.min(x0, x1));
  const right = Math.min(map.width - 1, Math.max(x0, x1));
  const top = Math.max(0, Math.min(y0, y1));
  const bottom = Math.min(map.height - 1, Math.max(y0, y1));
  if (left > right || top > bottom) return null;
  let changed = false;
  const tiles = map.tiles.slice();
  for (let cy = top; cy <= bottom; cy++) {
    for (let cx = left; cx <= right; cx++) {
      const index = cy * map.width + cx;
      if (tiles[index] !== tile) {
        tiles[index] = tile;
        changed = true;
      }
    }
  }
  return changed ? tiles : null;
}
