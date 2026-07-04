import { MapCanvas } from './canvas/MapCanvas';
import { Inspector } from './inspector/Inspector';
import { Palette } from './palette/Palette';
import { Toolbar } from './Toolbar';

export function EditorScreen() {
  return (
    <div className="app">
      <Toolbar />
      <div className="workspace">
        <Palette />
        <main className="canvas-area">
          <MapCanvas />
        </main>
        <Inspector />
      </div>
    </div>
  );
}
