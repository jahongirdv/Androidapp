import Errorpage from './pages/Errorpage';
import { createRoutesFromElements, Route } from 'react-router-dom';
import React from 'react';
import Root from './pages/Root';
import Home from './pages/Home';
export const routefromelement = createRoutesFromElements(
  <Route path="/" element={<Root />}>
    <Route errorElement={<Errorpage />}>
      <Route index element={<Home />} />
      <Route path="*" element={<Errorpage />} />
    </Route>
  </Route>
);
