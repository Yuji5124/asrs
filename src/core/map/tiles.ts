import type { TileType } from '../types';

export interface TileDef {
  type: TileType;
  label: string;
  color: string;
  symbol: string;
  walkable: boolean;
}

export const TILE_DEFS: Record<TileType, TileDef> = {
  floor: { type: 'floor', label: 'ゆか', color: '#b9a97e', symbol: '', walkable: true },
  wall: { type: 'wall', label: 'かべ', color: '#4b4b57', symbol: '#', walkable: false },
  grass: { type: 'grass', label: 'くさ', color: '#5f9350', symbol: '"', walkable: true },
  water: { type: 'water', label: 'みず', color: '#3c6fa8', symbol: '~', walkable: false },
};

export const TILE_TYPES: TileType[] = ['floor', 'wall', 'grass', 'water'];
