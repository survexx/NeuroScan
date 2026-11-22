import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import { clearSession, getSavedUser, getToken, getCurrentUser } from './services/authService';

function ProtectedRoutes({ user, setUser }) {
    const location = useLocation();
    if (!getToken()) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (!user) return <div className="session-loading">Loading workspace...</div>;
    return <Outlet />;
}

export default function AppRouter() {
    const [user, setUser] = useState(() => getSavedUser());

    useEffect(() => {
        if (!getToken()) return;
        getCurrentUser()
            .then((response) => setUser(response.user))
            .catch(() => {
                clearSession();
                setUser(null);
            });
    }, []);

    function logout() {
        clearSession();
        setUser(null);
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Auth mode="login" onAuthenticated={setUser} />} />
                <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Auth mode="register" onAuthenticated={setUser} />} />
                <Route element={<ProtectedRoutes user={user} setUser={setUser} />}>
                    <Route path="/dashboard" element={<App user={user} onLogout={logout} />} />
                    <Route path="/:section" element={<App user={user} onLogout={logout} />} />
                </Route>
                <Route path="*" element={<Navigate to={getToken() ? '/dashboard' : '/'} replace />} />
            </Routes>
        </BrowserRouter>
    );
}
