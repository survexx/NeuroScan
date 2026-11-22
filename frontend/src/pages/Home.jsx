import { Link } from 'react-router-dom';
import { FiActivity, FiShield, FiUploadCloud, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

export default function Home() {
    return (
        <main className="public-page">
            <nav className="public-nav">
                <Link className="public-brand" to="/"><span className="brand-mark"><FiActivity /></span><strong>NeuroScan</strong></Link>
                <div>
                    <Link className="nav-login" to="/login">Login</Link>
                    <Link className="nav-register" to="/register">Create account <FiArrowRight /></Link>
                </div>
            </nav>
            <section className="public-hero">
                <div>
                    <span className="eyebrow"><FiShield /> AI-assisted MRI analysis</span>
                    <h1>Understand brain MRI results with <em>NeuroScan.</em></h1>
                    <p>Upload a scan, receive a tumor-classification prediction, and keep every result private to your account.</p>
                    <div className="public-actions">
                        <Link className="primary-link" to="/register">Get started <FiArrowRight /></Link>
                        <Link className="secondary-link" to="/login">Log in</Link>
                    </div>
                </div>
                <div className="public-visual"><FiActivity /></div>
            </section>
            <section className="feature-grid">
                <article><FiUploadCloud /><h3>Secure upload</h3><p>Upload JPG or PNG MRI images through a protected account.</p></article>
                <article><FiActivity /><h3>AI prediction</h3><p>Receive the model label and confidence for each scan.</p></article>
                <article><FiCheckCircle /><h3>Personal history</h3><p>Review previous scans, details, and pagination only from your account.</p></article>
            </section>
        </main>
    );
}
