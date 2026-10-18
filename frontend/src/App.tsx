import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import StationsPage from './pages/StationsPage';
import StationDetailsPage from './pages/StationDetailsPage';
import SessionsPage from './pages/SessionsPage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import SessionSummaryPage from './pages/SessionSummaryPage';
import WalletPage from './pages/WalletPage';

// Lazy-loaded Admin Pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminStationsPage = lazy(() => import('./pages/admin/AdminStationsPage').then(m => ({ default: m.AdminStationsPage })));
const AdminTariffsPage = lazy(() => import('./pages/admin/AdminTariffsPage').then(m => ({ default: m.AdminTariffsPage })));
const AdminPlansPage = lazy(() => import('./pages/admin/AdminPlansPage').then(m => ({ default: m.AdminPlansPage })));
const AdminMaintenancePage = lazy(() => import('./pages/admin/AdminMaintenancePage').then(m => ({ default: m.AdminMaintenancePage })));
const AdminSessionsPage = lazy(() => import('./pages/admin/AdminSessionsPage').then(m => ({ default: m.AdminSessionsPage })));
const AdminTransactionsPage = lazy(() => import('./pages/admin/AdminTransactionsPage').then(m => ({ default: m.AdminTransactionsPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })));

const AdminLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
    <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-sm text-slate-400">Loading administrative module...</p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/stations" element={<StationsPage />} />
            <Route path="/stations/:id" element={<StationDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Customer Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <VehiclesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions"
              element={
                <ProtectedRoute>
                  <SessionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/:id"
              element={
                <ProtectedRoute>
                  <ActiveSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/:id/summary"
              element={
                <ProtectedRoute>
                  <SessionSummaryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              }
            />

            {/* Authenticated Administrator Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminLayout />
                  </Suspense>
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<AdminLoadingFallback />}><AdminDashboardPage /></Suspense>} />
              <Route path="stations" element={<Suspense fallback={<AdminLoadingFallback />}><AdminStationsPage /></Suspense>} />
              <Route path="tariffs" element={<Suspense fallback={<AdminLoadingFallback />}><AdminTariffsPage /></Suspense>} />
              <Route path="plans" element={<Suspense fallback={<AdminLoadingFallback />}><AdminPlansPage /></Suspense>} />
              <Route path="maintenance" element={<Suspense fallback={<AdminLoadingFallback />}><AdminMaintenancePage /></Suspense>} />
              <Route path="sessions" element={<Suspense fallback={<AdminLoadingFallback />}><AdminSessionsPage /></Suspense>} />
              <Route path="transactions" element={<Suspense fallback={<AdminLoadingFallback />}><AdminTransactionsPage /></Suspense>} />
              <Route path="audit-logs" element={<Suspense fallback={<AdminLoadingFallback />}><AdminAuditLogsPage /></Suspense>} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;

