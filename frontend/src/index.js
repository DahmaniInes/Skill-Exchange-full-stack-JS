// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import { MaterialUIControllerProvider } from "context";
import { ThemeProvider } from '@mui/material/styles';
import theme from "assets/theme"; // Ensure this path is correct based on your file structure

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <MaterialUIControllerProvider>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </MaterialUIControllerProvider>
  </BrowserRouter>
);

reportWebVitals();
