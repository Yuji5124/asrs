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
        <MapCanvas />
        <Inspector />
      </div>
    </div>
  );
}
