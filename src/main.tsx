import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AuthProvider } from './context/AuthContext';
import { AppExitGuard } from './app/ExitGuard';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppExitGuard />
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
