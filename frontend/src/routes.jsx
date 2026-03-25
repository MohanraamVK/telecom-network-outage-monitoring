import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import NodesPage from "./pages/NodesPage";
import IncidentsPage from "./pages/IncidentsPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/nodes" element={<NodesPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;