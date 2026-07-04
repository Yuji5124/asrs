import type { AsrsProject, MapEvent } from '../types';
import { validateProject } from './validate';

export interface LoadResult {
  /** validateを通らなかった場合は null */
  project: AsrsProject | null;
  errors: string[];
  warnings: string[];
}

export function projectToJson(project: AsrsProject): string {
  return JSON.stringify(project, null, 2);
}

function normalizeEvent(event: MapEvent): MapEvent {
  return { ...event, commands: Array.isArray(event.commands) ? event.commands : [] };
}

function normalizeProject(project: AsrsProject): AsrsProject {
  return {
    ...project,
    maps: project.maps.map((map) => ({
      ...map,
      events: map.events.map(normalizeEvent),
    })),
  };
}

export function projectFromJson(text: string): LoadResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { project: null, errors: ['JSONとして解釈できませんでした'], warnings: [] };
  }
  const result = validateProject(data);
  return {
    project: result.ok ? normalizeProject(data as AsrsProject) : null,
    errors: result.errors,
    warnings: result.warnings,
  };
}
