import { FiActivity, FiArrowRight, FiCheckCircle, FiUploadCloud } from 'react-icons/fi'

const HowItWorks = () => {
    return (
        <section className="how-section" id="how-it-works">
            <div className="section-title">
                <span className="eyebrow">THE PROCESS</span>
                <h2>How It Works</h2>
                <p>A simple three-step workflow to support your research.</p>
            </div>
                        
            <div className="steps-row">
                <div className="process-step">
                    <div className="process-icon">
                        <FiUploadCloud />
                    </div>         
                    <span>01</span>      
                    <h3>Upload MRI Image</h3>
                    <p>Choose a clear MRI scan from your device.</p>
                </div>
                            
                <FiArrowRight className="step-arrow" />
                            
                <div className="process-step">
                    <div className="process-icon"><FiActivity /></div>
                        <span>02</span>
                        <h3>AI Model Analyzes</h3>                    
                        <p>The model reviews the image patterns.</p>
                    </div>
                            
                    <FiArrowRight className="step-arrow" />
                        
                    <div className="process-step">
                        <div className="process-icon">
                            <FiCheckCircle />
                        </div>        
                        <span>03</span>
                        <h3>Get Prediction</h3>
                        <p>Review the response and confidence score.</p>
                    </div>
            </div>
        </section>
    );
}

export default HowItWorks;