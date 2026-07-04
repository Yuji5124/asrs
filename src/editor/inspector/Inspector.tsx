import { EVENT_DEFS } from '../../core/map/events';
import { useEditorStore } from '../store/editorStore';

export function Inspector() {
  const project = useEditorStore((s) => s.project);
  const selectedEventId = useEditorStore((s) => s.selectedEventId);
  const renameEvent = useEditorStore((s) => s.renameEvent);
  const updateEventMessage = useEditorStore((s) => s.updateEventMessage);
  const deleteEvent = useEditorStore((s) => s.deleteEvent);
  const renameMap = useEditorStore((s) => s.renameMap);
  const map = project.maps[0];
  const event = map.events.find((e) => e.id === selectedEventId) ?? null;
  const message = event?.commands.find((command) => command.type === 'showMessage')?.text ?? '';

  if (event) {
    const def = EVENT_DEFS[event.appearance];
    return (
      <aside className="inspector">
        <h2>配置物の設定</h2>
        <div className="inspector-chip">
          <span className="swatch swatch-round" style={{ background: def.color }}>
            {def.symbol}
          </span>
          <span>{def.label}</span>
        </div>
        <label>
          名前
          <input value={event.name} onChange={(e) => renameEvent(event.id, e.target.value)} />
        </label>
        <label>
          メッセージ
          <textarea
            value={message}
            rows={5}
            placeholder="話しかけた時に表示する文章"
            onChange={(e) => updateEventMessage(event.id, e.target.value)}
          />
        </label>
        <dl className="meta">
          <div>
            <dt>ID</dt>
            <dd>{event.id}</dd>
          </div>
          <div>
            <dt>座標</dt>
            <dd>
              ({event.x}, {event.y})
            </dd>
          </div>
        </dl>
        <button className="danger" onClick={() => deleteEvent(event.id)}>
          この配置物を削除
        </button>
      </aside>
    );
  }

  return (
    <aside className="inspector">
      <h2>マップの設定</h2>
      <label>
        マップ名
        <input value={map.name} onChange={(e) => renameMap(e.target.value)} />
      </label>
      <dl className="meta">
        <div>
          <dt>サイズ</dt>
          <dd>
            {map.width}×{map.height}
          </dd>
        </div>
        <div>
          <dt>スタート地点</dt>
          <dd>
            ({project.startPoint.x}, {project.startPoint.y})
          </dd>
        </div>
        <div>
          <dt>配置物</dt>
          <dd>{map.events.length}個</dd>
        </div>
      </dl>
      <div className="hint-box">
        <p>タイルはクリックまたはドラッグで塗れます</p>
        <p>配置物はクリックで置けます</p>
        <p>置いた配置物をクリックすると、ここで名前とメッセージを編集できます</p>
      </div>
    </aside>
  );
}
