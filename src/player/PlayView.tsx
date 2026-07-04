import { useEffect, useRef, useState } from 'react';
import { isWalkable } from '../core/map/passability';
import type { PlaySession } from '../core/types';
import { useEditorStore } from '../editor/store/editorStore';
import { drawMap, drawPlayer, TILE_SIZE } from '../render/drawMap';

const KEY_DIRS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  W: [0, -1],
  S: [0, 1],
  A: [-1, 0],
  D: [1, 0],
};

export function PlayView() {
  const project = useEditorStore((s) => s.project);
  const setMode = useEditorStore((s) => s.setMode);
  const map = project.maps.find((m) => m.id === project.startPoint.mapId) ?? project.maps[0];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [session, setSession] = useState<PlaySession>(() => ({
    mapId: map.id,
    playerX: project.startPoint.x,
    playerY: project.startPoint.y,
  }));

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const dir = KEY_DIRS[e.key];
      if (!dir) return;
      e.preventDefault();
      setSession((s) => {
        const nx = s.playerX + dir[0];
        const ny = s.playerY + dir[1];
        return isWalkable(map, nx, ny) ? { ...s, playerX: nx, playerY: ny } : s;
      });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [map]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawMap(ctx, map);
    drawPlayer(ctx, session.playerX, session.playerY);
  }, [map, session]);

  return (
    <div className="app play">
      <header className="toolbar">
        <span className="brand">テストプレイ</span>
        <span className="hint">移動: 矢印キー / WASD</span>
        <button onClick={() => setMode('edit')}>■ エディタに戻る</button>
      </header>
      <main className="canvas-area">
        <canvas
          ref={canvasRef}
          className="map-canvas"
          width={map.width * TILE_SIZE}
          height={map.height * TILE_SIZE}
        />
      </main>
    </div>
  );
}
