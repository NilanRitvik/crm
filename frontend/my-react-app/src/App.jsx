import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LeadsDashboard from "./pages/LeadsDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LeadDetail from "./pages/LeadDetail";
import ContactsView from "./pages/ContactsView";
import Profile from "./pages/Profile";
import EventsPage from "./pages/EventsPage";
import ForecastPage from "./pages/ForecastPage";
import PartnersPage from "./pages/PartnersPage";
import AIConfigPage from "./pages/AIConfigPage";
import CompanyProfile from "./pages/CompanyProfile";
import ProposalsPage from "./pages/ProposalsPage";
import OrgChartPage from "./pages/OrgChartPage";
import PortalsPage from "./pages/PortalsPage";
import PortalCredentials from "./pages/PortalCredentials";
import StateCIOPage from "./pages/StateCIOPage";
import MainDashboard from "./pages/MainDashboard";
import Layout from "./components/Layout";
import { ToastProvider } from "./context/ToastContext";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
}


import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MainDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pipeline"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LeadsDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ContactsView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/partners"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PartnersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/forecast"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ForecastPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/lead/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LeadDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/company-profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CompanyProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/org-chart"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrgChartPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/proposals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProposalsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PortalsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portals/credentials"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PortalCredentials />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/state-cio"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StateCIOPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
