import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page', () => {
  render(<App />);
  expect(screen.getByText(/Ma Santé/i)).toBeInTheDocument();
  expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
});