import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LandingPage } from './LandingPage.js';

describe('LandingPage', () => {
  it('shows TrailForge brand, headline, CTA, and OSM attribution', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('TrailForge')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Walk a real city/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Generate a tour/i })).toHaveAttribute('href', '/app');
    expect(screen.getByText('© OpenStreetMap contributors')).toBeInTheDocument();
  });
});
