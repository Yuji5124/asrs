import type { EventAppearance } from '../types';

export interface EventDef {
  appearance: EventAppearance;
  label: string;
  color: string;
  symbol: string;
}

export const EVENT_DEFS: Record<EventAppearance, EventDef> = {
  chest: { appearance: 'chest', label: 'たからばこ', color: '#c9862b', symbol: '宝' },
  npc: { appearance: 'npc', label: 'NPC', color: '#8458c9', symbol: '人' },
  orb: { appearance: 'orb', label: 'イベント玉', color: '#2ba39a', symbol: '玉' },
};

export const EVENT_APPEARANCES: EventAppearance[] = ['chest', 'npc', 'orb'];
