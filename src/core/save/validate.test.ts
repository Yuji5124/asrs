import { describe, expect, it } from 'vitest';
import { createDefaultProject, DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH } from './project';
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
    p.maps[0].events.push({ id: 'npc-1', name: 'x', x: 99, y: 0, appearance: 'npc', commands: [] });
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
    p.maps[0].events.push({ id: 'x-1', name: 'x', x: 3, y: 3, appearance: 'dragon', commands: [] });
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

  it('デフォルトプロジェクトの初期マップは 32×24', () => {
    const p = createDefaultProject();
    expect(p.maps[0].width).toBe(DEFAULT_MAP_WIDTH);
    expect(p.maps[0].height).toBe(DEFAULT_MAP_HEIGHT);
    expect(p.maps[0].tiles.length).toBe(DEFAULT_MAP_WIDTH * DEFAULT_MAP_HEIGHT);
  });

  it('旧サイズ（16×12）のプロジェクトも読み込める', () => {
    const p = clone();
    p.maps[0].width = 16;
    p.maps[0].height = 12;
    p.maps[0].tiles = new Array(16 * 12).fill('floor');
    p.maps[0].events = [{ id: 'npc-1', name: 'a', x: 15, y: 11, appearance: 'npc' }];
    p.startPoint = { mapId: 'map-1', x: 1, y: 1 };
    const r = validateProject(p);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('通行不可タイル上の startPoint は警告になる（エラーではない）', () => {
    const p = clone();
    p.maps[0].tiles[p.startPoint.y * DEFAULT_MAP_WIDTH + p.startPoint.x] = 'wall';
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

  it('commands付きMapEventを受け入れる', () => {
    const p = clone();
    p.maps[0].events.push({
      id: 'npc-1',
      name: 'a',
      x: 3,
      y: 3,
      appearance: 'npc',
      commands: [{ type: 'showMessage', text: 'ようこそ。' }],
    });
    expect(validateProject(p).ok).toBe(true);
  });

  it('commandsがない旧データも読み込める', () => {
    const p = clone();
    p.maps[0].events.push({ id: 'npc-1', name: 'a', x: 3, y: 3, appearance: 'npc' });
    const r = projectFromJson(JSON.stringify(p));
    expect(r.project?.maps[0].events[0].commands).toEqual([]);
    expect(r.errors).toEqual([]);
  });

  it('showMessageの不正データはエラー', () => {
    const p = clone();
    p.maps[0].events.push({
      id: 'npc-1',
      name: 'a',
      x: 3,
      y: 3,
      appearance: 'npc',
      commands: [{ type: 'showMessage', text: 42 }],
    });
    expect(validateProject(p).ok).toBe(false);
  });

  it('Phase 2AではshowMessage以外のコマンドはエラー', () => {
    const p = clone();
    p.maps[0].events.push({
      id: 'npc-1',
      name: 'a',
      x: 3,
      y: 3,
      appearance: 'npc',
      commands: [{ type: 'giveItem', itemId: 'item-1', amount: 1 }],
    });
    expect(validateProject(p).ok).toBe(false);
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
