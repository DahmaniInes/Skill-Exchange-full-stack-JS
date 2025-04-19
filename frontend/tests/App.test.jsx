// tests/App.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

describe('App', () => {
  it('renders title', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    // Cibler l'élément <h2> dans la barre de navigation
    const titleElement = screen.getByRole('heading', {
      name: /eLEARNING/i,
      level: 2, // Correspond à <h2>
    });
    expect(titleElement).toBeInTheDocument();
  });
});