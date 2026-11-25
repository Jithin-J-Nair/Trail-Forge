import { create } from 'zustand';

export type TourDraft = {
  area: string;
  theme: string;
  durationMinutes: number;
};

type TourStore = {
  draft: TourDraft;
  setDraft: (partial: Partial<TourDraft>) => void;
};

export const useTourStore = create<TourStore>((set) => ({
  draft: {
    area: '',
    theme: '',
    durationMinutes: 90,
  },
  setDraft: (partial) =>
    set((state) => ({
      draft: { ...state.draft, ...partial },
    })),
}));
