import { EVENT_DEFS } from '../core/map/events';
import { TILE_DEFS } from '../core/map/tiles';
import type { GameMap, StartPoint } from '../core/types';

export const TILE_SIZE = 32;

export interface DrawOptions {
  grid?: boolean;
  startPoint?: StartPoint | null;
  selectedEventId?: string | null;
}

export function drawMap(ctx: CanvasRenderingContext2D, map: GameMap, opts: DrawOptions = {}): void {
  const T = TILE_SIZE;
  ctx.clearRect(0, 0, map.width * T, map.height * T);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const def = TILE_DEFS[map.tiles[y * map.width + x]];
      ctx.fillStyle = def.color;
      ctx.fillRect(x * T, y * T, T, T);
      if (def.symbol) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.symbol, x * T + T / 2, y * T + T / 2);
      }
    }
  }

  if (opts.grid) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 1; x < map.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * T + 0.5, 0);
      ctx.lineTo(x * T + 0.5, map.height * T);
      ctx.stroke();
    }
    for (let y = 1; y < map.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * T + 0.5);
      ctx.lineTo(map.width * T, y * T + 0.5);
      ctx.stroke();
    }
  }

  for (const event of map.events) {
    const def = EVENT_DEFS[event.appearance];
    const cx = event.x * T + T / 2;
    const cy = event.y * T + T / 2;
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(cx, cy, T / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f2ea';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, cx, cy + 1);
    if (opts.selectedEventId === event.id) {
      ctx.strokeStyle = '#f0d95c';
      ctx.lineWidth = 2;
      ctx.strokeRect(event.x * T + 1, event.y * T + 1, T - 2, T - 2);
    }
  }

  if (opts.startPoint && opts.startPoint.mapId === map.id) {
    const cx = opts.startPoint.x * T + T / 2;
    const cy = opts.startPoint.y * T + T / 2;
    ctx.fillStyle = '#f0d95c';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy + 1);
    ctx.strokeText('★', cx, cy + 1);
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const T = TILE_SIZE;
  ctx.fillStyle = '#f0ede4';
  ctx.fillRect(x * T + 4, y * T + 4, T - 8, T - 8);
  ctx.strokeStyle = '#26262c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x * T + 4, y * T + 4, T - 8, T - 8);
  ctx.fillStyle = '#26262c';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@', x * T + T / 2, y * T + T / 2 + 1);
}
