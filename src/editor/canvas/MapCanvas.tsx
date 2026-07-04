import { useEffect, useRef } from 'react';
import { drawMap, TILE_SIZE } from '../../render/drawMap';
import { useEditorStore } from '../store/editorStore';

export function MapCanvas() {
  const project = useEditorStore((s) => s.project);
  const selectedEventId = useEditorStore((s) => s.selectedEventId);
  const applyToolAt = useEditorStore((s) => s.applyToolAt);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paintingRef = useRef(false);
  const map = project.maps[0];

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawMap(ctx, map, { grid: true, startPoint: project.startPoint, selectedEventId });
  }, [map, project.startPoint, selectedEventId]);

  function cellFromMouse(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / TILE_SIZE),
      y: Math.floor((e.clientY - rect.top) / TILE_SIZE),
    };
  }

  return (
    <canvas
      ref={canvasRef}
      className="map-canvas"
      width={map.width * TILE_SIZE}
      height={map.height * TILE_SIZE}
      onMouseDown={(e) => {
        paintingRef.current = true;
        const c = cellFromMouse(e);
        applyToolAt(c.x, c.y, false);
      }}
      onMouseMove={(e) => {
        if (!paintingRef.current) return;
        const c = cellFromMouse(e);
        applyToolAt(c.x, c.y, true);
      }}
      onMouseUp={() => {
        paintingRef.current = false;
      }}
      onMouseLeave={() => {
        paintingRef.current = false;
      }}
    />
  );
}
