import { useEffect, useRef, useState } from 'react';
import { eventAt, inBounds, tileAt } from '../../core/map/passability';
import { TILE_DEFS } from '../../core/map/tiles';
import { drawMap, TILE_SIZE } from '../../render/drawMap';
import { useEditorStore } from '../store/editorStore';

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

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawMap(ctx, map, { grid: true, startPoint: project.startPoint, selectedEventId });
    if (hover && inBounds(map, hover.x, hover.y)) {
      ctx.strokeStyle = 'rgba(240, 217, 92, 0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hover.x * TILE_SIZE + 1, hover.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }
  }, [map, project.startPoint, selectedEventId, hover]);

  function cellFromMouse(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / TILE_SIZE),
      y: Math.floor((e.clientY - rect.top) / TILE_SIZE),
    };
  }

  const cursorClass = hoverEvent ? 'is-select' : palette.kind === 'tile' ? 'is-paint' : 'is-place';

  const hoverInfo = hoverTile
    ? `(${hover!.x}, ${hover!.y}) ${TILE_DEFS[hoverTile].label}` +
      (hoverEvent ? ` / ${hoverEvent.name}` : '') +
      (TILE_DEFS[hoverTile].walkable && !hoverEvent ? '・通行できる' : '・通行できない')
    : 'マップにカーソルを乗せると座標が表示されます';

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
        <span className="canvas-footer-map">
          マップ {map.width}×{map.height} ・ 配置物 {map.events.length}
        </span>
      </div>
    </main>
  );
}
