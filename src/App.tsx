import { EditorScreen } from './editor/EditorScreen';
import { useEditorStore } from './editor/store/editorStore';
import { PlayView } from './player/PlayView';

export default function App() {
  const mode = useEditorStore((s) => s.mode);
  return mode === 'edit' ? <EditorScreen /> : <PlayView />;
}
