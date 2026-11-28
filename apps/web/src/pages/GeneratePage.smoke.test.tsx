import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GeneratePage } from './GeneratePage.js';

vi.mock('../scene/Scene.js', () => ({
  Scene: () => <div data-testid="scene">scene</div>,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('GeneratePage smoke', () => {
  it('shows honest empty canvas without demo query', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/app" element={<GeneratePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('empty-canvas')).toBeInTheDocument();
    expect(screen.queryByText('DEMO DATA')).not.toBeInTheDocument();
  });

  it('loads labeled DEMO fixture when ?demo=1', async () => {
    render(
      <MemoryRouter initialEntries={['/app?demo=1']}>
        <Routes>
          <Route path="/app" element={<GeneratePage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('DEMO DATA')).toBeInTheDocument();
    });
    expect(screen.getByTestId('scene')).toBeInTheDocument();
  });
});
