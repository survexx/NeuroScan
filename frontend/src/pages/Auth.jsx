import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiActivity, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { loginAccount, registerAccount, saveSession } from '../services/authService';

export default function Auth({ mode = 'login', onAuthenticated }) {
    const navigate = useNavigate();
    const isRegister = mode === 'register';
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = isRegister
                ? await registerAccount(form)
                : await loginAccount({ email: form.email, password: form.password });
            saveSession(response.token, response.user);
            onAuthenticated(response.user);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to complete authentication.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <Link className="auth-back" to="/"><FiArrowLeft /> Back to home</Link>
            <section className="auth-card">
                <div className="auth-brand"><span className="brand-mark"><FiActivity /></span><strong>NeuroScan</strong></div>
                <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
                <p>{isRegister ? 'Start saving and reviewing your MRI predictions.' : 'Log in to open your private workspace.'}</p>
                <form onSubmit={submit}>
                    {isRegister && <label>Full name<input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></label>}
                    <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
                    <label>Password<div className="password-input"><input required minLength={isRegister ? 8 : 1} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={isRegister ? 'At least 8 characters' : 'Your password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label>
                    {error && <div className="auth-error">{error}</div>}
                    <button className="auth-submit" disabled={loading}>{loading ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}</button>
                </form>
                <div className="auth-switch">{isRegister ? 'Already have an account?' : 'New to NeuroScan?' } <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Create account'}</Link></div>
            </section>
        </main>
    );
}
