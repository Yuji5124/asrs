import { useEffect } from 'react';
import { MapCanvas } from './canvas/MapCanvas';
import { Inspector } from './inspector/Inspector';
import { Palette } from './palette/Palette';
import { useEditorStore } from './store/editorStore';
import { Toolbar } from './Toolbar';

export function EditorScreen() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="app">
      <Toolbar />
      <div className="workspace">
        <Palette />
        <MapCanvas />
        <Inspector />
      </div>
    </div>
  );
}
