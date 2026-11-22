import { FiActivity, FiShield } from 'react-icons/fi'

const About = () => {
    return (
        <section className="info-page">
            <div className="section-title">
                <span className="eyebrow">ABOUT NEUROSCAN</span>
                <h2>Brain Tumor Prediction</h2>
                <p>A simple educational interface for exploring MRI image classification workflows.</p>
            </div>

            <div className="info-grid">
                <div className="panel info-card">
                    <FiActivity />
                    <h3>Built for learning</h3>
                    <p>NeuroScan helps students understand how an uploaded MRI image travels from a browser to a prediction service.</p>
                </div>

                <div className="panel info-card">
                    <FiShield />
                    <h3>Responsible by design</h3>
                    <p>Results are shown only when returned by the connected backend. No medical claims or fabricated predictions are displayed.</p>
                </div>
            </div>
        </section>
    );
}

export default About;