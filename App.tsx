
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './containers/HomePage';
import { PostPage } from './containers/PostPage';
import { AdminDashboard } from './containers/AdminDashboard';
import { AdminEditor } from './containers/AdminEditor';
import { AdminSettings } from './containers/AdminSettings';
import { AdminAppearance } from './containers/AdminAppearance';
import { AdminUsers } from './containers/AdminUsers';
import { AdminLeads } from './containers/AdminLeads';
import { AdminKanban } from './containers/AdminKanban';
import { AdminWhatsApp } from './containers/AdminWhatsApp';
import { AdminEmail } from './containers/AdminEmail';
import { AdminEmailEditor } from './containers/AdminEmailEditor';
import { AdminFunnels } from './containers/AdminFunnels';
import { AdminLandingGenerator } from './containers/AdminLandingGenerator';
import { LoginPage } from './containers/LoginPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/post/:slug" element={<PostPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/leads" element={<ProtectedRoute><AdminLeads /></ProtectedRoute>} />
                <Route path="/admin/crm" element={<ProtectedRoute><AdminKanban /></ProtectedRoute>} />
                <Route path="/admin/landing" element={<ProtectedRoute><AdminLandingGenerator /></ProtectedRoute>} />
                <Route path="/admin/whatsapp" element={<ProtectedRoute><AdminWhatsApp /></ProtectedRoute>} />
                <Route path="/admin/email" element={<ProtectedRoute><AdminEmail /></ProtectedRoute>} />
                <Route path="/admin/emails/editor" element={<ProtectedRoute><AdminEmailEditor /></ProtectedRoute>} />
                <Route path="/admin/funnels" element={<ProtectedRoute><AdminFunnels /></ProtectedRoute>} />
                <Route path="/admin/create" element={<ProtectedRoute><AdminEditor /></ProtectedRoute>} />
                <Route path="/admin/edit/:id" element={<ProtectedRoute><AdminEditor /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                <Route path="/admin/appearance" element={<ProtectedRoute><AdminAppearance /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
