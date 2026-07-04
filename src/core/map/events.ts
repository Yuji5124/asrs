import type { EventAppearance } from '../types';

export interface EventDef {
  appearance: EventAppearance;
  label: string;
  color: string;
  symbol: string;
  defaultMessage: string;
}

export const EVENT_DEFS: Record<EventAppearance, EventDef> = {
  chest: { appearance: 'chest', label: 'たからばこ', color: '#c9862b', symbol: '宝', defaultMessage: '古い箱がある。' },
  npc: { appearance: 'npc', label: 'NPC', color: '#8458c9', symbol: '人', defaultMessage: '……。' },
  orb: { appearance: 'orb', label: 'イベント玉', color: '#2ba39a', symbol: '玉', defaultMessage: '小さな気配がある。' },
};

export const EVENT_APPEARANCES: EventAppearance[] = ['chest', 'npc', 'orb'];
