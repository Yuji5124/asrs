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

  return (
    <aside className="inspector">
      <h2>設定</h2>
      {event ? (
        <div>
          <h3>配置物</h3>
          <label>
            名前
            <input value={event.name} onChange={(e) => renameEvent(event.id, e.target.value)} />
          </label>
          <label>
            メッセージ
            <textarea
              value={message}
              rows={5}
              onChange={(e) => updateEventMessage(event.id, e.target.value)}
            />
          </label>
          <p>ID: {event.id}</p>
          <p>種別: {EVENT_DEFS[event.appearance].label}</p>
          <p>
            座標: ({event.x}, {event.y})
          </p>
          <button className="danger" onClick={() => deleteEvent(event.id)}>
            削除
          </button>
        </div>
      ) : (
        <div>
          <h3>マップ</h3>
          <label>
            マップ名
            <input value={map.name} onChange={(e) => renameMap(e.target.value)} />
          </label>
          <p>
            サイズ: {map.width}×{map.height}
          </p>
          <p>
            スタート地点: ({project.startPoint.x}, {project.startPoint.y})
          </p>
          <p>配置物: {map.events.length}個</p>
          <p className="hint-text">配置物をクリックすると詳細を編集できます</p>
        </div>
      )}
    </aside>
  );
}
