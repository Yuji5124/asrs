import { useRef } from 'react';
import { useEditorStore } from './store/editorStore';

export function Toolbar() {
  const status = useEditorStore((s) => s.status);
  const setMode = useEditorStore((s) => s.setMode);
  const saveToStorage = useEditorStore((s) => s.saveToStorage);
  const loadFromStorage = useEditorStore((s) => s.loadFromStorage);
  const exportJson = useEditorStore((s) => s.exportJson);
  const importJson = useEditorStore((s) => s.importJson);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function handleExport() {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asrs-project.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    importJson(await file.text());
    e.target.value = '';
  }

  return (
    <header className="toolbar">
      <span className="brand">ASRS</span>
      <span className="mode-chip">マップ編集</span>
      <div className="toolbar-group">
        <button onClick={saveToStorage}>保存</button>
        <button onClick={loadFromStorage}>読込</button>
      </div>
      <div className="toolbar-group">
        <button onClick={handleExport}>JSON書き出し</button>
        <button onClick={() => fileRef.current?.click()}>JSON読み込み</button>
      </div>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
      <button className="primary" onClick={() => setMode('play')}>
        ▶ テストプレイ
      </button>
      <span className="status">{status}</span>
    </header>
  );
}
