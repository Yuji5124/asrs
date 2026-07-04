import { describe, expect, it } from 'vitest';
import type { GameMap } from '../types';
import { fillRectTiles, floodFillTiles } from './paint';

function makeMap(): GameMap {
  // 4×3。中央列(x=2)が壁で左右の床が分断されている
  return {
    id: 'map-test',
    name: 'テストマップ',
    width: 4,
    height: 3,
    tiles: [
      'floor', 'floor', 'wall', 'floor',
      'floor', 'floor', 'wall', 'floor',
      'floor', 'floor', 'wall', 'floor',
    ],
    events: [],
  };
}

describe('floodFillTiles', () => {
  it('連結した領域だけを塗りつぶす（壁の向こうは塗らない）', () => {
    const tiles = floodFillTiles(makeMap(), 0, 0, 'grass');
    expect(tiles).not.toBeNull();
    // 左側6マスがgrass、壁はそのまま、右側の床もそのまま
    expect(tiles![0]).toBe('grass');
    expect(tiles![1 * 4 + 1]).toBe('grass');
    expect(tiles![2 * 4 + 0]).toBe('grass');
    expect(tiles![0 * 4 + 2]).toBe('wall');
    expect(tiles![0 * 4 + 3]).toBe('floor');
    expect(tiles![2 * 4 + 3]).toBe('floor');
  });

  it('起点と同じタイルを指定した場合は null（変化なし）', () => {
    expect(floodFillTiles(makeMap(), 0, 0, 'floor')).toBeNull();
  });

  it('マップ外の起点は null', () => {
    expect(floodFillTiles(makeMap(), -1, 0, 'grass')).toBeNull();
    expect(floodFillTiles(makeMap(), 0, 9, 'grass')).toBeNull();
  });

  it('元のマップは変更しない', () => {
    const map = makeMap();
    floodFillTiles(map, 0, 0, 'water');
    expect(map.tiles[0]).toBe('floor');
  });
});

describe('fillRectTiles', () => {
  it('2点間の矩形を塗る（座標の順序は問わない）', () => {
    const tiles = fillRectTiles(makeMap(), 3, 2, 1, 0, 'water');
    expect(tiles).not.toBeNull();
    for (let y = 0; y <= 2; y++) {
      for (let x = 1; x <= 3; x++) {
        expect(tiles![y * 4 + x]).toBe('water');
      }
    }
    expect(tiles![0]).toBe('floor'); // 矩形外
  });

  it('マップ外にはみ出す矩形はクランプされる', () => {
    const tiles = fillRectTiles(makeMap(), -5, -5, 0, 0, 'grass');
    expect(tiles).not.toBeNull();
    expect(tiles![0]).toBe('grass');
    expect(tiles![1]).toBe('floor');
  });

  it('全マスが既に同じタイルなら null（変化なし）', () => {
    expect(fillRectTiles(makeMap(), 0, 0, 1, 2, 'floor')).toBeNull();
  });

  it('完全にマップ外の矩形は null', () => {
    expect(fillRectTiles(makeMap(), 10, 10, 20, 20, 'grass')).toBeNull();
  });
});
