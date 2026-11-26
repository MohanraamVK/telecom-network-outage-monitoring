import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PageLoader from "./components/common/PageLoader";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";

// Pages are loaded on demand, so Chart.js only downloads when the dashboard opens.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const IncidentsPage = lazy(() => import("./pages/IncidentsPage"));
const NodesPage = lazy(() => import("./pages/NodesPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/nodes" element={<NodesPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;