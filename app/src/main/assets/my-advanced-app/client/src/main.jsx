import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { AppProvider } from './context/AppContext';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { routefromelement } from './routes';
import { MessageProvider } from './context/MessageContext';

const router = createBrowserRouter(routefromelement);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <MessageProvider>
        <RouterProvider router={router} />
      </MessageProvider>
    </AppProvider>
  </StrictMode>
);
