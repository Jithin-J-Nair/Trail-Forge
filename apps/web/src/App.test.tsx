import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

vi.mock('./scene/Scene.js', () => ({
  Scene: () => <div data-testid="scene">scene</div>,
}));

afterEach(() => cleanup());

describe('App', () => {
  it('shows brand, OSM attribution, and skip link to main', () => {
    render(<App />);
    expect(screen.getAllByText('TrailForge').length).toBeGreaterThan(0);
    expect(screen.getByText('© OpenStreetMap contributors')).toBeInTheDocument();
    expect(screen.queryByText('Phase 1 scaffold')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Scene' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Skip to content/i })).toHaveAttribute('href', '#main');
    expect(document.getElementById('main')).toBeTruthy();
  });
});
