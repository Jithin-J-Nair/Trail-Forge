import type { GenerateResponse } from '@trailforge/shared';
import { create } from 'zustand';

export type UiLanguage = 'ja' | 'en';
export type SceneStatus = 'idle' | 'loading' | 'ready' | 'error';

type TourSceneState = {
  response: GenerateResponse | null;
  selectedPoiId: string | null;
  hoveredPoiId: string | null;
  uiLanguage: UiLanguage;
  status: SceneStatus;
  errorMessage: string | null;
  setResponse: (response: GenerateResponse | null) => void;
  setSelectedPoiId: (id: string | null) => void;
  setHoveredPoiId: (id: string | null) => void;
  setUiLanguage: (lang: UiLanguage) => void;
  setStatus: (status: SceneStatus, errorMessage?: string | null) => void;
};

export const useTourSceneStore = create<TourSceneState>((set) => ({
  response: null,
  selectedPoiId: null,
  hoveredPoiId: null,
  uiLanguage: 'en',
  status: 'idle',
  errorMessage: null,
  setResponse: (response) => set({ response, status: response ? 'ready' : 'idle' }),
  setSelectedPoiId: (selectedPoiId) => set({ selectedPoiId }),
  setHoveredPoiId: (hoveredPoiId) => set({ hoveredPoiId }),
  setUiLanguage: (uiLanguage) => set({ uiLanguage }),
  setStatus: (status, errorMessage = null) => set({ status, errorMessage }),
}));
