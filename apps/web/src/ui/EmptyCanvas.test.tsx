import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EmptyCanvas } from './EmptyCanvas.js';

describe('EmptyCanvas', () => {
  it('shows honest empty copy and labeled demo link', () => {
    render(
      <MemoryRouter>
        <EmptyCanvas lang="en" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('empty-canvas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No city loaded' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open labeled DEMO city/i })).toHaveAttribute(
      'href',
      '/app?demo=1',
    );
  });
});
