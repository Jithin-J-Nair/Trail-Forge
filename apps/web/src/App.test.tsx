import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

vi.mock('./scene/Scene.js', () => ({
  Scene: () => <div data-testid="scene">scene</div>,
}));

describe('App', () => {
  it('shows brand and OSM attribution', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'TrailForge' })).toBeInTheDocument();
    expect(screen.getByText('© OpenStreetMap contributors')).toBeInTheDocument();
  });
});
