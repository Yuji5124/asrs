import { EVENT_APPEARANCES, EVENT_DEFS } from '../../core/map/events';
import { TILE_DEFS, TILE_TYPES } from '../../core/map/tiles';
import { useEditorStore } from '../store/editorStore';

export function Palette() {
  const palette = useEditorStore((s) => s.palette);
  const setPalette = useEditorStore((s) => s.setPalette);

  return (
    <aside className="palette">
      <h2>タイル</h2>
      {TILE_TYPES.map((tile) => (
        <button
          key={tile}
          className={palette.kind === 'tile' && palette.tile === tile ? 'active' : ''}
          onClick={() => setPalette({ kind: 'tile', tile })}
        >
          <span className="swatch" style={{ background: TILE_DEFS[tile].color }} />
          {TILE_DEFS[tile].label}
        </button>
      ))}
      <h2>配置物</h2>
      {EVENT_APPEARANCES.map((appearance) => (
        <button
          key={appearance}
          className={palette.kind === 'event' && palette.appearance === appearance ? 'active' : ''}
          onClick={() => setPalette({ kind: 'event', appearance })}
        >
          <span className="swatch" style={{ background: EVENT_DEFS[appearance].color }} />
          {EVENT_DEFS[appearance].label}
        </button>
      ))}
      <h2>その他</h2>
      <button
        className={palette.kind === 'start' ? 'active' : ''}
        onClick={() => setPalette({ kind: 'start' })}
      >
        <span className="swatch" style={{ background: '#f0d95c' }} />
        スタート地点
      </button>
    </aside>
  );
}
