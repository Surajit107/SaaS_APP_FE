import { Navigate, Route, Routes } from 'react-router-dom';

import { publicRoutes } from '@/routes/public';
import { tenantRoutes } from '@/routes/tenant';

export function AppRoutes() {
  return (
    <Routes>
      {publicRoutes}
      {tenantRoutes}
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
