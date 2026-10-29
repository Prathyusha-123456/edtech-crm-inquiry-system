import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import InquiryForm from './pages/InquiryForm.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { clearToken, fetchMe, getToken } from './api.js';

function ProtectedRoute({ authed, children }) {
  if (authed === null) return <p className="center muted">Checking session…</p>;
  return authed ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  // null = still verifying, true/false = known
  const [authed, setAuthed] = useState(getToken() ? null : false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      fetchMe()
        .then(() => setAuthed(true))
        .catch(() => setAuthed(false));
    }
    const onExpired = () => {
      setAuthed(false);
      navigate('/admin/login');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [navigate]);

  const logout = () => {
    clearToken();
    setAuthed(false);
    navigate('/admin/login');
  };

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">EdTech CRM</Link>
        <nav>
          <Link to="/">Inquiry Form</Link>
          {authed ? (
            <>
              <Link to="/admin">Dashboard</Link>
              <button className="link-btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link to="/admin/login">Admin</Link>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<InquiryForm />} />
          <Route path="/admin/login" element={authed ? <Navigate to="/admin" replace /> : <AdminLogin onLogin={() => setAuthed(true)} />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute authed={authed}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
