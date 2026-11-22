import { FiActivity} from 'react-icons/fi'

const Hero = () => {
  return (
    <section className="hero-section">
        <div>
            <div className="eyebrow">
                <FiActivity /> MRI ANALYSIS PLATFORM
            </div>
            <h1>Brain Tumor <em>Prediction</em></h1>
            <p>Upload an MRI image to analyze and identify potential signs of brain tumors.</p>
        </div>
                        
        <div className="hero-illustration" aria-hidden="true">
            <div className="scan-ring" /><div className="brain-shape">
                <span /><span /><span />
            </div>
            <div className="scan-line" />
        </div>
    </section>
  )
}

export default Hero
