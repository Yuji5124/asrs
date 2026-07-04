import { useEffect, useRef, useState } from 'react';
import { eventAt, isWalkable } from '../core/map/passability';
import type { GameMap, MapEvent, PlaySession } from '../core/types';
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

const DECISION_KEYS = new Set(['Enter', ' ', 'Spacebar', 'z', 'Z']);
const ADJACENT_DIRS: [number, number][] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

function adjacentEvent(map: GameMap, x: number, y: number): MapEvent | null {
  for (const [dx, dy] of ADJACENT_DIRS) {
    const event = eventAt(map, x + dx, y + dy);
    if (event) return event;
  }
  return null;
}

function firstMessage(event: MapEvent): string | null {
  const text = event.commands.find((command) => command.type === 'showMessage')?.text;
  return text && text.length > 0 ? text : null;
}

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
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (DECISION_KEYS.has(e.key)) {
        e.preventDefault();
        if (message !== null) {
          setMessage(null);
          return;
        }
        const event = adjacentEvent(map, session.playerX, session.playerY);
        const text = event ? firstMessage(event) : null;
        if (text) setMessage(text);
        return;
      }

      const dir = KEY_DIRS[e.key];
      if (!dir) return;
      e.preventDefault();
      if (message !== null) return;
      setSession((s) => {
        const nx = s.playerX + dir[0];
        const ny = s.playerY + dir[1];
        return isWalkable(map, nx, ny) ? { ...s, playerX: nx, playerY: ny } : s;
      });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [map, message, session.playerX, session.playerY]);

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
      {message !== null && (
        <div className="message-window">
          <p>{message}</p>
          <span>Enter / Space / Z</span>
        </div>
      )}
    </div>
  );
}
