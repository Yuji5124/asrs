import { describe, expect, it } from 'vitest';
import { createDefaultProject, MAP_WIDTH } from './project';
import { projectFromJson } from './serialize';
import { validateProject } from './validate';

/* eslint-disable @typescript-eslint/no-explicit-any */
function clone(): any {
  return JSON.parse(JSON.stringify(createDefaultProject()));
}

describe('validateProject', () => {
  it('デフォルトプロジェクトはエラーなし', () => {
    const r = validateProject(createDefaultProject());
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('オブジェクトでない入力はエラー', () => {
    expect(validateProject(null).ok).toBe(false);
    expect(validateProject('text').ok).toBe(false);
    expect(validateProject([]).ok).toBe(false);
  });

  it('formatVersion の不一致はエラー', () => {
    const p = clone();
    p.formatVersion = 999;
    expect(validateProject(p).ok).toBe(false);
  });

  it('maps が空だとエラー', () => {
    const p = clone();
    p.maps = [];
    expect(validateProject(p).ok).toBe(false);
  });

  it('tiles の長さ不一致はエラー', () => {
    const p = clone();
    p.maps[0].tiles.pop();
    expect(validateProject(p).ok).toBe(false);
  });

  it('不明なタイルはエラー', () => {
    const p = clone();
    p.maps[0].tiles[0] = 'lava';
    expect(validateProject(p).ok).toBe(false);
  });

  it('マップ外の配置物はエラー', () => {
    const p = clone();
    p.maps[0].events.push({ id: 'npc-1', name: 'x', x: 99, y: 0, appearance: 'npc' });
    expect(validateProject(p).ok).toBe(false);
  });

  it('配置物IDの重複はエラー', () => {
    const p = clone();
    p.maps[0].events.push(
      { id: 'npc-1', name: 'a', x: 3, y: 3, appearance: 'npc' },
      { id: 'npc-1', name: 'b', x: 4, y: 4, appearance: 'npc' },
    );
    expect(validateProject(p).ok).toBe(false);
  });

  it('不正な appearance はエラー', () => {
    const p = clone();
    p.maps[0].events.push({ id: 'x-1', name: 'x', x: 3, y: 3, appearance: 'dragon' });
    expect(validateProject(p).ok).toBe(false);
  });

  it('存在しないマップを指す startPoint はエラー', () => {
    const p = clone();
    p.startPoint.mapId = 'map-none';
    expect(validateProject(p).ok).toBe(false);
  });

  it('マップ外の startPoint はエラー', () => {
    const p = clone();
    p.startPoint.x = 99;
    expect(validateProject(p).ok).toBe(false);
  });

  it('通行不可タイル上の startPoint は警告になる（エラーではない）', () => {
    const p = clone();
    p.maps[0].tiles[p.startPoint.y * MAP_WIDTH + p.startPoint.x] = 'wall';
    const r = validateProject(p);
    expect(r.ok).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('同じマスに重なった配置物は警告になる（エラーではない）', () => {
    const p = clone();
    p.maps[0].events.push(
      { id: 'npc-1', name: 'a', x: 3, y: 3, appearance: 'npc' },
      { id: 'npc-2', name: 'b', x: 3, y: 3, appearance: 'npc' },
    );
    const r = validateProject(p);
    expect(r.ok).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('projectFromJson', () => {
  it('壊れたJSONはエラーを返しクラッシュしない', () => {
    const r = projectFromJson('{oops');
    expect(r.project).toBeNull();
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('正しいJSONはプロジェクトを返す', () => {
    const r = projectFromJson(JSON.stringify(createDefaultProject()));
    expect(r.project).not.toBeNull();
    expect(r.errors).toEqual([]);
  });
});
