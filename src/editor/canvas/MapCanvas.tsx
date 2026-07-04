import { useEffect, useRef, useState } from 'react';
import { EVENT_DEFS } from '../../core/map/events';
import { eventAt, inBounds, tileAt } from '../../core/map/passability';
import { TILE_DEFS } from '../../core/map/tiles';
import { drawMap, TILE_SIZE } from '../../render/drawMap';
import { useEditorStore } from '../store/editorStore';
import type { PaletteSelection } from '../store/editorStore';

function toolLabel(palette: PaletteSelection): string {
  if (palette.kind === 'tile') return `${TILE_DEFS[palette.tile].label}を塗る`;
  if (palette.kind === 'event') return `${EVENT_DEFS[palette.appearance].label}を置く`;
  return 'スタート地点を移す';
}

function drawToolPreview(
  ctx: CanvasRenderingContext2D,
  palette: PaletteSelection,
  x: number,
  y: number,
  hasEvent: boolean,
): void {
  if (hasEvent) return;

  const left = x * TILE_SIZE;
  const top = y * TILE_SIZE;
  const cx = left + TILE_SIZE / 2;
  const cy = top + TILE_SIZE / 2;

  ctx.save();
  if (palette.kind === 'tile') {
    const def = TILE_DEFS[palette.tile];
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = def.color;
    ctx.fillRect(left + 2, top + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    if (def.symbol) {
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.symbol, cx, cy);
    }
  } else if (palette.kind === 'event') {
    const def = EVENT_DEFS[palette.appearance];
    ctx.globalAlpha = 0.74;
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE / 2 - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#f4f2ea';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, cx, cy + 1);
  } else {
    ctx.globalAlpha = 0.86;
    ctx.fillStyle = '#f0d95c';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = 1;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy + 1);
    ctx.strokeText('★', cx, cy + 1);
  }
  ctx.restore();
}

function drawHoverFrame(ctx: CanvasRenderingContext2D, x: number, y: number, isBlocked: boolean): void {
  const left = x * TILE_SIZE;
  const top = y * TILE_SIZE;
  ctx.save();
  ctx.strokeStyle = isBlocked ? 'rgba(216, 122, 122, 0.9)' : 'rgba(240, 217, 92, 0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(left + 1, top + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  if (isBlocked) {
    ctx.strokeStyle = 'rgba(216, 122, 122, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left + 7, top + 7);
    ctx.lineTo(left + TILE_SIZE - 7, top + TILE_SIZE - 7);
    ctx.moveTo(left + TILE_SIZE - 7, top + 7);
    ctx.lineTo(left + 7, top + TILE_SIZE - 7);
    ctx.stroke();
  }
  ctx.restore();
}

export function MapCanvas() {
  const project = useEditorStore((s) => s.project);
  const palette = useEditorStore((s) => s.palette);
  const selectedEventId = useEditorStore((s) => s.selectedEventId);
  const applyToolAt = useEditorStore((s) => s.applyToolAt);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paintingRef = useRef(false);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const map = project.maps[0];

  const hoverInMap = hover !== null && inBounds(map, hover.x, hover.y);
  const hoverTile = hoverInMap ? tileAt(map, hover.x, hover.y) : null;
  const hoverEvent = hoverInMap ? eventAt(map, hover.x, hover.y) : null;
  const hoverStart =
    hoverInMap &&
    project.startPoint.mapId === map.id &&
    project.startPoint.x === hover.x &&
    project.startPoint.y === hover.y;
  const hoverWalkable = hoverTile !== null && TILE_DEFS[hoverTile].walkable && hoverEvent === null;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawMap(ctx, map, { grid: true, startPoint: project.startPoint, selectedEventId });
    if (hoverInMap && hoverTile !== null) {
      drawToolPreview(ctx, palette, hover!.x, hover!.y, hoverEvent !== null);
      drawHoverFrame(ctx, hover!.x, hover!.y, !hoverWalkable);
    }
  }, [map, palette, project.startPoint, selectedEventId, hover, hoverInMap, hoverTile, hoverEvent, hoverWalkable]);

  function cellFromMouse(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / TILE_SIZE),
      y: Math.floor((e.clientY - rect.top) / TILE_SIZE),
    };
  }

  const cursorClass = hoverEvent ? 'is-select' : palette.kind === 'tile' ? 'is-paint' : 'is-place';

  const hoverInfo = hoverTile && hover
    ? `(${hover.x}, ${hover.y}) ${TILE_DEFS[hoverTile].label}` +
      (hoverEvent ? ` / ${hoverEvent.name}` : '') +
      (hoverStart ? ' / スタート地点' : '') +
      (hoverWalkable ? '・通行できる' : '・通行できない')
    : 'マップにカーソルを乗せると座標が表示されます';
  const hoverAction =
    hoverEvent !== null
      ? 'クリックで配置物を選択'
      : hoverTile !== null && palette.kind === 'tile' && hoverStart && !TILE_DEFS[palette.tile].walkable
        ? `クリック/ドラッグで${TILE_DEFS[palette.tile].label}を塗る（スタート地点に注意）`
        : hoverTile !== null
          ? `クリック: ${toolLabel(palette)}`
          : `選択中: ${toolLabel(palette)}`;

  return (
    <main className="canvas-column">
      <div className="canvas-area">
        <canvas
          ref={canvasRef}
          className={`map-canvas ${cursorClass}`}
          width={map.width * TILE_SIZE}
          height={map.height * TILE_SIZE}
          onMouseDown={(e) => {
            paintingRef.current = true;
            const c = cellFromMouse(e);
            applyToolAt(c.x, c.y, false);
          }}
          onMouseMove={(e) => {
            const c = cellFromMouse(e);
            setHover((prev) => (prev && prev.x === c.x && prev.y === c.y ? prev : c));
            if (paintingRef.current) applyToolAt(c.x, c.y, true);
          }}
          onMouseUp={() => {
            paintingRef.current = false;
          }}
          onMouseLeave={() => {
            paintingRef.current = false;
            setHover(null);
          }}
        />
      </div>
      <div className="canvas-footer">
        <span className="canvas-footer-cell">{hoverInfo}</span>
        <span className="canvas-footer-action">{hoverAction}</span>
        <span className="canvas-footer-map">
          マップ {map.width}×{map.height} ・ 配置物 {map.events.length}
        </span>
      </div>
    </main>
  );
}
