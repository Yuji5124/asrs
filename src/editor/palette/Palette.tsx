import { EVENT_APPEARANCES, EVENT_DEFS } from '../../core/map/events';
import { TILE_DEFS, TILE_TYPES } from '../../core/map/tiles';
import { useEditorStore, type PaletteSelection } from '../store/editorStore';

function currentToolLabel(palette: PaletteSelection): string {
  if (palette.kind === 'tile') return `タイル: ${TILE_DEFS[palette.tile].label}`;
  if (palette.kind === 'event') return `配置物: ${EVENT_DEFS[palette.appearance].label}`;
  return 'スタート地点';
}

export function Palette() {
  const palette = useEditorStore((s) => s.palette);
  const setPalette = useEditorStore((s) => s.setPalette);

  return (
    <aside className="palette">
      <section className="palette-section">
        <h2>地形タイル</h2>
        {TILE_TYPES.map((tile) => {
          const def = TILE_DEFS[tile];
          const active = palette.kind === 'tile' && palette.tile === tile;
          return (
            <button
              key={tile}
              className={active ? 'active' : ''}
              aria-pressed={active}
              onClick={() => setPalette({ kind: 'tile', tile })}
            >
              <span className="swatch" style={{ background: def.color }}>
                {def.symbol}
              </span>
              <span className="palette-label">{def.label}</span>
              {!def.walkable && <span className="badge">通行不可</span>}
            </button>
          );
        })}
      </section>
      <section className="palette-section">
        <h2>配置物</h2>
        {EVENT_APPEARANCES.map((appearance) => {
          const def = EVENT_DEFS[appearance];
          const active = palette.kind === 'event' && palette.appearance === appearance;
          return (
            <button
              key={appearance}
              className={active ? 'active' : ''}
              aria-pressed={active}
              onClick={() => setPalette({ kind: 'event', appearance })}
            >
              <span className="swatch swatch-round" style={{ background: def.color }}>
                {def.symbol}
              </span>
              <span className="palette-label">{def.label}</span>
            </button>
          );
        })}
      </section>
      <section className="palette-section">
        <h2>マップ設定</h2>
        <button
          className={palette.kind === 'start' ? 'active' : ''}
          aria-pressed={palette.kind === 'start'}
          onClick={() => setPalette({ kind: 'start' })}
        >
          <span className="swatch swatch-round swatch-start">★</span>
          <span className="palette-label">スタート地点</span>
        </button>
      </section>
      <div className="palette-current">
        <span className="palette-current-title">選択中のツール</span>
        {currentToolLabel(palette)}
      </div>
    </aside>
  );
}
