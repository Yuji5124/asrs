import type { AsrsProject } from '../types';
import { projectFromJson, projectToJson, type LoadResult } from './serialize';

export const STORAGE_KEY = 'asrs-project';

export function saveProjectToStorage(project: AsrsProject): void {
  localStorage.setItem(STORAGE_KEY, projectToJson(project));
}

/** 保存データが存在しなければ null */
export function loadProjectFromStorage(): LoadResult | null {
  const text = localStorage.getItem(STORAGE_KEY);
  if (text === null) return null;
  return projectFromJson(text);
}
