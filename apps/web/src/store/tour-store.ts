import type { GenerateRequest, Theme } from '@trailforge/shared';
import { create } from 'zustand';

export type TourDraft = {
  query: string;
  theme: Theme | '';
  durationMinutes: GenerateRequest['durationMinutes'];
  radiusMeters: GenerateRequest['radiusMeters'];
};

type TourStore = {
  draft: TourDraft;
  setDraft: (partial: Partial<TourDraft>) => void;
};

export const useTourStore = create<TourStore>((set) => ({
  draft: {
    query: '',
    theme: '',
    durationMinutes: 90,
    radiusMeters: 500,
  },
  setDraft: (partial) =>
    set((state) => ({
      draft: { ...state.draft, ...partial },
    })),
}));
