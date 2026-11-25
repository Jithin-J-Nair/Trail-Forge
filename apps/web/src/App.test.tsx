import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

vi.mock('./scene/Scene.js', () => ({
  Scene: () => <div data-testid="scene">scene</div>,
}));

describe('App', () => {
  it('shows brand and OSM attribution without Phase 1 scaffold copy', () => {
    render(<App />);
    expect(screen.getAllByText('TrailForge').length).toBeGreaterThan(0);
    expect(screen.getByText('© OpenStreetMap contributors')).toBeInTheDocument();
    expect(screen.queryByText('Phase 1 scaffold')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Scene' })).not.toBeInTheDocument();
  });
});
