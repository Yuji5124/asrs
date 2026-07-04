import { describe, expect, it } from 'vitest';
import type { GameMap } from '../types';
import { eventAt, inBounds, isWalkable, tileAt } from './passability';

function makeMap(): GameMap {
  return {
    id: 'map-test',
    name: 'テストマップ',
    width: 4,
    height: 3,
    // 上段: floor, wall, water, grass / 残りはfloor
    tiles: [
      'floor', 'wall', 'water', 'grass',
      'floor', 'floor', 'floor', 'floor',
      'floor', 'floor', 'floor', 'floor',
    ],
    events: [{ id: 'chest-1', name: 'たからばこ1', x: 0, y: 1, appearance: 'chest' }],
  };
}

describe('inBounds', () => {
  it('マップ内の座標は true', () => {
    expect(inBounds(makeMap(), 0, 0)).toBe(true);
    expect(inBounds(makeMap(), 3, 2)).toBe(true);
  });

  it('マップ外の座標は false', () => {
    expect(inBounds(makeMap(), -1, 0)).toBe(false);
    expect(inBounds(makeMap(), 4, 0)).toBe(false);
    expect(inBounds(makeMap(), 0, 3)).toBe(false);
  });

  it('整数でない座標は false', () => {
    expect(inBounds(makeMap(), 0.5, 0)).toBe(false);
  });
});

describe('tileAt / eventAt', () => {
  it('tileAt はタイル種別を返し、マップ外は null', () => {
    expect(tileAt(makeMap(), 1, 0)).toBe('wall');
    expect(tileAt(makeMap(), 0, 2)).toBe('floor');
    expect(tileAt(makeMap(), 9, 9)).toBeNull();
  });

  it('eventAt は配置物を返し、なければ null', () => {
    expect(eventAt(makeMap(), 0, 1)?.id).toBe('chest-1');
    expect(eventAt(makeMap(), 1, 1)).toBeNull();
  });
});

describe('isWalkable', () => {
  it('床と草は通行できる', () => {
    expect(isWalkable(makeMap(), 0, 0)).toBe(true);
    expect(isWalkable(makeMap(), 3, 0)).toBe(true);
  });

  it('壁と水は通行できない', () => {
    expect(isWalkable(makeMap(), 1, 0)).toBe(false);
    expect(isWalkable(makeMap(), 2, 0)).toBe(false);
  });

  it('配置物のあるマスは通行できない', () => {
    expect(isWalkable(makeMap(), 0, 1)).toBe(false);
  });

  it('マップ外は通行できない', () => {
    expect(isWalkable(makeMap(), -1, 0)).toBe(false);
    expect(isWalkable(makeMap(), 0, 3)).toBe(false);
    expect(isWalkable(makeMap(), 4, 2)).toBe(false);
  });
});
