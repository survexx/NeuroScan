import { FiMail, FiMessageCircle } from 'react-icons/fi'

function Contact() {
    return (
        <section className="info-page">
            <div className="section-title">
                <span className="eyebrow">GET IN TOUCH</span>
                <h2>Contact</h2>
                <p>Questions about the project or the backend integration?</p>
            </div>

            <div className="panel contact-card">
                <FiMessageCircle />
                <div>
                    <h3>Project support</h3>
                    <p>Speak with your project team about the prediction endpoint, model response fields, or demonstration setup.</p>
                    <a href="mailto:project-team@example.com"><FiMail /> project-team@example.com</a>
                </div>
            </div>
        </section>
    );
}

export default Contact;