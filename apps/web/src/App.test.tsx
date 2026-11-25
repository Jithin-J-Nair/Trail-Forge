import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

vi.mock('./components/ScenePlaceholder.js', () => ({
  ScenePlaceholder: () => <div data-testid="scene-placeholder">scene</div>,
}));

describe('App', () => {
  it('shows brand header and OSM attribution', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'TrailForge' })).toBeInTheDocument();
    expect(screen.getByText('© OpenStreetMap contributors')).toBeInTheDocument();
  });
});
