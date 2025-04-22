import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { BrowserRouter } from 'react-router-dom'; // add this

test.skip('renders title', () => {
  render(<App />);
  
});
