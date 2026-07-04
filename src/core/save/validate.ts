import { FORMAT_VERSION, type TileType } from '../types';
import { EVENT_APPEARANCES } from '../map/events';
import { TILE_DEFS } from '../map/tiles';

export interface ValidationResult {
  /** errors が0件なら true。warnings があっても読み込みは可能 */
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function validateEventCommands(value: unknown, where: string, errors: string[]): void {
  if (value === undefined) return; // Phase 1の旧データは読み込み時に [] を補う
  if (!Array.isArray(value)) {
    errors.push(`${where}.commands が配列ではありません`);
    return;
  }
  for (const [i, command] of value.entries()) {
    const commandWhere = `${where}.commands[${i}]`;
    if (!isRecord(command)) {
      errors.push(`${commandWhere} がオブジェクトではありません`);
      continue;
    }
    if (command.type !== 'showMessage') {
      errors.push(`${commandWhere}.type は showMessage のみ有効です`);
      continue;
    }
    if (typeof command.text !== 'string') {
      errors.push(`${commandWhere}.text が文字列ではありません`);
    }
  }
}

/**
 * プロジェクトJSONの検査。手入力・ファイル・localStorage・AI出力の
 * すべての外部入力がこの関数を通る（docs/data-schema.md 参照）。
 */
export function validateProject(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result = () => ({ ok: errors.length === 0, errors, warnings });

  if (!isRecord(data)) {
    errors.push('プロジェクトデータがオブジェクトではありません');
    return result();
  }
  if (data.formatVersion !== FORMAT_VERSION) {
    errors.push(`formatVersion が ${FORMAT_VERSION} ではありません（値: ${String(data.formatVersion)}）`);
  }
  if (!isRecord(data.meta) || typeof data.meta.title !== 'string') {
    errors.push('meta.title がありません');
  }
  if (!Array.isArray(data.maps) || data.maps.length === 0) {
    errors.push('maps が空です');
    return result();
  }

  const mapIds = new Set<string>();
  for (const [i, map] of data.maps.entries()) {
    const where = `maps[${i}]`;
    if (!isRecord(map)) {
      errors.push(`${where} がオブジェクトではありません`);
      continue;
    }
    if (!isNonEmptyString(map.id)) {
      errors.push(`${where}.id が不正です`);
    } else if (mapIds.has(map.id)) {
      errors.push(`マップID "${map.id}" が重複しています`);
    } else {
      mapIds.add(map.id);
    }
    if (typeof map.name !== 'string') errors.push(`${where}.name が不正です`);

    const width = map.width;
    const height = map.height;
    if (!isInt(width) || !isInt(height) || width <= 0 || height <= 0) {
      errors.push(`${where} のサイズが不正です`);
      continue;
    }
    if (!Array.isArray(map.tiles) || map.tiles.length !== width * height) {
      errors.push(`${where}.tiles の長さが width×height と一致しません`);
    } else {
      for (const tile of map.tiles) {
        if (typeof tile !== 'string' || !(tile in TILE_DEFS)) {
          errors.push(`${where} に不明なタイル "${String(tile)}" があります`);
          break;
        }
      }
    }
    if (!Array.isArray(map.events)) {
      errors.push(`${where}.events が配列ではありません`);
      continue;
    }
    const eventIds = new Set<string>();
    const cells = new Set<string>();
    for (const [j, ev] of map.events.entries()) {
      const evWhere = `${where}.events[${j}]`;
      if (!isRecord(ev)) {
        errors.push(`${evWhere} がオブジェクトではありません`);
        continue;
      }
      if (!isNonEmptyString(ev.id)) {
        errors.push(`${evWhere}.id が不正です`);
      } else if (eventIds.has(ev.id)) {
        errors.push(`配置物ID "${ev.id}" が重複しています`);
      } else {
        eventIds.add(ev.id);
      }
      if (typeof ev.name !== 'string') errors.push(`${evWhere}.name が不正です`);
      if (typeof ev.appearance !== 'string' || !(EVENT_APPEARANCES as string[]).includes(ev.appearance)) {
        errors.push(`${evWhere}.appearance が不正です`);
      }
      validateEventCommands(ev.commands, evWhere, errors);
      const x = ev.x;
      const y = ev.y;
      if (!isInt(x) || !isInt(y) || x < 0 || y < 0 || x >= width || y >= height) {
        errors.push(`${evWhere} の座標がマップ外です`);
      } else {
        const key = `${x},${y}`;
        if (cells.has(key)) warnings.push(`(${x}, ${y}) に配置物が重なっています`);
        cells.add(key);
      }
    }
  }

  if (!isRecord(data.startPoint)) {
    errors.push('startPoint がありません');
    return result();
  }
  const sp = data.startPoint;
  const spMap = data.maps.find((m): m is Record<string, unknown> => isRecord(m) && m.id === sp.mapId);
  if (!spMap) {
    errors.push('startPoint.mapId が存在しないマップを指しています');
    return result();
  }
  const spX = sp.x;
  const spY = sp.y;
  if (!isInt(spX) || !isInt(spY)) {
    errors.push('startPoint の座標が不正です');
    return result();
  }
  const spWidth = spMap.width;
  const spHeight = spMap.height;
  if (isInt(spWidth) && isInt(spHeight)) {
    if (spX < 0 || spY < 0 || spX >= spWidth || spY >= spHeight) {
      errors.push('startPoint がマップ外です');
      return result();
    }
    const tiles = spMap.tiles;
    if (Array.isArray(tiles)) {
      const tile = tiles[spY * spWidth + spX];
      if (typeof tile === 'string' && tile in TILE_DEFS && !TILE_DEFS[tile as TileType].walkable) {
        warnings.push('スタート地点が通行できないタイルの上にあります');
      }
    }
    const events = spMap.events;
    if (Array.isArray(events) && events.some((e) => isRecord(e) && e.x === spX && e.y === spY)) {
      warnings.push('スタート地点に配置物が重なっています');
    }
  }

  return result();
}
