import { useEffect, useRef, useState } from 'react'
import { FiActivity, FiAlertCircle, FiArrowRight, FiCheckCircle, FiClock, FiFileText, FiHome, 
    FiInfo, FiMail, FiMenu, FiPlus, FiRefreshCw, FiShield, FiUploadCloud, FiX } from 'react-icons/fi'
import './App.css'
import { predictBrainTumor, checkPredictionHealth, getPredictionHistory } from './services/predictionService'
import { mapPredictionResponse } from './utils/responseMapper'
import About from './pages/About'
import Contact from './pages/Contact'
import History from './pages/History'
import HowItWorks from './pages/HowItWorks'
import Header from './components/Header'
import Hero from './components/Hero'

const HISTORY_STORAGE_KEY = 'brain-tumor-prediction-history'
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png']

function App({ user, onLogout }) {
    const fileInputReference = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [predictionError, setPredictionError] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [history, setHistory] = useState([]);
    const [serviceStatus, setServiceStatus] = useState('checking');
    const [activeSection, setActiveSection] = useState(() => getSectionFromPath());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    // Load database history and verify that Node/FastAPI services are available.
    useEffect(() => {
        let isMounted = true;

        async function loadBackendData() {
            try {
                const healthResponse = await checkPredictionHealth();
                if (!isMounted) return;
                setServiceStatus(healthResponse?.success ? 'ready' : 'offline');
            } catch (error) {
                if (!isMounted) return;
                setServiceStatus('offline');
            }

            try {
                const historyResponse = await getPredictionHistory(1, 20);
                if (!isMounted) return;
                setHistory(historyResponse?.records || []);
            } catch (error) {
                if (!isMounted) return;
                setHistory([]);
            }
        }

        loadBackendData();
        return () => { isMounted = false; };
    }, []);


    // Release the browser's temporary image URL when it changes or the page closes.
    useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);


    // Validate a file before it enters the upload and preview flow.
    function handleFileSelection(file) {
        setUploadError(''); 
        setPredictionError(''); 
        setPrediction(null);

        if (!file) return;

        if(!SUPPORTED_IMAGE_TYPES.includes(file.type)){
            setUploadError('Please choose a JPG, JPEG, or PNG image.');
            return;
        }
        
        if(previewUrl) URL.revokeObjectURL(previewUrl);

        setSelectedFile(file); 
        setPreviewUrl(URL.createObjectURL(file));
    }


    // Support both the Browse Files button and drag-and-drop uploads.
    function handleDrop(event){
        event.preventDefault(); 
        handleFileSelection(event.dataTransfer.files[0]);
    }


    // Remove the current image and return the dashboard to its initial state.
    function clearSelectedFile() {
        setSelectedFile(null); 
        setPreviewUrl(''); 
        setPrediction(null); 
        setPredictionError(''); 
        setUploadError('');

        if(fileInputReference.current) fileInputReference.current.value = '';
    }


    // Send the selected File to the backend and save only successful result metadata.
    async function handleAnalyze() {
        if(!selectedFile){ 
            setUploadError('Select an MRI image before starting the analysis.'); 
            return;
        }

        setIsAnalyzing(true); 
        setPredictionError('');
        setPrediction(null);

        try {
            const response = await predictBrainTumor(selectedFile);
            const mappedPrediction = mapPredictionResponse(response);
            setPrediction(mappedPrediction);

            const historyItem = {
                id: response.recordId || Date.now().toString(),
                filename: selectedFile.name,
                prediction: mappedPrediction.prediction,
                confidence: mappedPrediction.confidenceDisplay,
                createdAt: new Date().toISOString()
            };

            setHistory((currentHistory) => [historyItem, ...currentHistory].slice(0, 20));

            try {
                const historyResponse = await getPredictionHistory(1, 20);
                setHistory(historyResponse.records || []);
            } catch {
                // The live result remains visible even if history refresh is temporarily unavailable.
            }
        } 
        catch(error){
            setPredictionError(error.message || 'The prediction service could not process this image.');
        }finally{ 
            setIsAnalyzing(false);
        }
    }


    // Change the URL without reloading the application and select the matching page.
    function navigateTo(section){
            setActiveSection(section);
            setIsSidebarOpen(false);

            window.history.pushState({}, '', section === 'Home' ? '/dashboard' : `/${section.toLowerCase().replaceAll(' ', '-')}`);
    }


    // Keep the selected page synchronized with browser back and forward buttons.
    useEffect(() => {
        const handlePopState = () => setActiveSection(getSectionFromPath());
        window.addEventListener('popstate', handlePopState);

        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const formattedSize = selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : '';
    const navigationItems = [
        ['Home', FiHome], 
        ['About', FiInfo], 
        ['How It Works', FiFileText], 
        ['History', FiClock], 
        ['Contact', FiMail]
    ];

    return (
        <div className="app-shell">
            <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="brand-block">
                    <div className="brand-mark">
                        <FiActivity />
                    </div>
                    <div>
                        <strong>NeuroScan</strong>
                        <span>Clinical Intelligence</span>
                    </div>
                    <button className="icon-button mobile-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu"><FiX /></button>
                </div>

                <div className="workspace-label">WORKSPACE</div>

                <nav className="sidebar-nav" aria-label="Main navigation">{navigationItems.map(([label, Icon]) => <button key={label} className={activeSection === label ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo(label)}><Icon /><span>{label}</span></button>)}</nav>
                
                <div className="sidebar-footer"><FiShield /><span>Educational use only</span></div>
            </aside>

            <main className="main-content" id="home">
                <Header
                    activeSection={activeSection}
                    setIsSidebarOpen={setIsSidebarOpen}
                    serviceStatus={serviceStatus}
                    user={user}
                    onLogout={onLogout}
                />
                
                <div className={`content-wrap ${activeSection === 'Home' ? 'home-content' : 'page-content'}`} style={activeSection === 'Home' ? { maxHeight: 'calc(100vh - 74px)', overflow: 'hidden' } : undefined}>
                    {activeSection === 'About' && <About />}
                    {activeSection === 'How It Works' && <HowItWorks />}
                    {activeSection === 'History' && <History history={history} />}
                    {activeSection === 'Contact' && <Contact />}
                    {activeSection !== 'Home' && <footer><span>NeuroScan · Brain Tumor Prediction</span><span>Built for research & learning</span></footer>}
                    {activeSection !== 'Home' && null}
                    {activeSection === 'Home' 
                        && 
                        <>
                            <Hero/>
                    
                            <section className="analysis-grid" aria-label="MRI prediction workspace">
                                <div className="panel upload-panel">
                                    <div className="panel-heading">
                                        <div>
                                            <span className="step-label">01 / UPLOAD</span>
                                            <h2>Upload MRI Image</h2>
                                        </div>
                                    
                                        <div className="heading-icon">
                                            <FiUploadCloud />
                                        </div>
                                    </div>
                                    
                                    <div className={`drop-zone ${uploadError ? 'has-error' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
                                        <input ref={fileInputReference} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(event) => handleFileSelection(event.target.files[0])} />
                                            <FiUploadCloud className="drop-icon" />
                                            <strong>Drag & drop your scan here</strong>
                                            <span>or</span>
                                            <button type="button" className="browse-button" onClick={() => fileInputReference.current?.click()}>Browse Files</button>
                                            <small>JPG, JPEG, PNG <b>·</b> Max 10 MB</small>
                                    </div>
                                    
                                    {
                                        uploadError && 
                                        <p className="error-message">
                                            <FiAlertCircle />{uploadError}
                                        </p>
                                    }
                                        
                                    {
                                        selectedFile && 
                                        <div className="file-row">
                                            <div className="file-icon">
                                                <FiFileText />
                                            </div>
                                                
                                            <div>
                                                <strong>{selectedFile.name}</strong>
                                                <span>{formattedSize}</span>
                                            </div>
                                                
                                            <button className="remove-button" onClick={clearSelectedFile} aria-label="Remove image">
                                                <FiX />
                                            </button>
                                        </div>
                                    }

                                </div>

                                <div className="panel preview-panel">
                                    <div className="panel-heading">
                                        <div>
                                            <span className="step-label">02 / REVIEW</span>
                                            <h2>MRI Scan Preview</h2>
                                        </div>

                                        <div className="heading-icon">
                                            <FiActivity />
                                        </div>
                                    </div>
                                        
                                    <div className="preview-window">
                                        {
                                            previewUrl 
                                            ? <img src={previewUrl} alt="Selected MRI scan preview" /> 
                                            : <div className="preview-placeholder">
                                                <div className="placeholder-grid">
                                                    <FiActivity />
                                                </div>
                                                <span>Your scan preview<br />will appear here</span>
                                            </div>
                                        }
                                    </div>
                                        
                                    {
                                        selectedFile && 
                                        <button className="change-link" onClick={() => fileInputReference.current?.click()}>
                                            <FiRefreshCw /> Change image
                                        </button>
                                    }

                                </div>

                                <div className="panel result-panel">
                                    <div className="panel-heading">
                                        <div>
                                            <span className="step-label">03 / RESULT</span>
                                            <h2>Prediction Result</h2>
                                        </div>
                                        
                                        <div className="heading-icon">
                                            <FiCheckCircle />
                                        </div>
                                    </div>
                                
                                    {   
                                        !prediction && !isAnalyzing && 
                                        <div className="result-empty">
                                            <FiActivity />
                                            <p>Upload an MRI image to get<br />prediction results.</p>
                                        </div>
                                    }
                                        
                                    {
                                        isAnalyzing && 
                                        <div className="result-empty analyzing">
                                            <div className="loader" />
                                            <p>Analyzing scan...<br /><small>This may take a moment</small></p>
                                        </div>
                                    }
                                        
                                    {
                                        prediction && 
                                        <div className="result-data">
                                            <div className="result-status">
                                                <FiCheckCircle /> Analysis complete
                                            </div>

                                            <div className="prediction-name">
                                                <span>Prediction</span>
                                                <strong>{prediction.prediction}</strong>
                                            </div>
                                            
                                            {
                                                prediction.confidence !== null && 
                                                <div className="confidence-row">
                                                    <span>Confidence</span>
                                                    <strong>{prediction.confidenceDisplay}</strong>
                                                </div>
                                            }
                                                
                                            {
                                                prediction.processingTime !== null && 
                                                <div className="confidence-row">
                                                    <span>Processing time</span>
                                                    <strong>{prediction.processingTimeDisplay}</strong>
                                                </div>
                                            }
                                        </div>
                                    }
                                        
                                    {
                                        predictionError && 
                                        <p className="error-message result-error"><FiAlertCircle />{predictionError}</p>
                                    }
                                </div>
                            </section>

                            <div className="action-row">
                                <button className="analyze-button" onClick={handleAnalyze} disabled={isAnalyzing}>{isAnalyzing ? <><span className="button-loader" /> Analyzing scan</> : <><FiActivity /> Analyze MRI Image</>}</button>
                                
                                {
                                    prediction && 
                                    <button className="secondary-button" onClick={clearSelectedFile}><FiPlus /> Try Another Image</button>
                                }
                                    
                                <span className="secure-note"><FiShield /> Your image is processed securely</span>
                            </div>
                            
                            <div className="disclaimer">
                                <FiShield />
                                <p>
                                    <strong>Educational disclaimer</strong> 
                                    This application is developed for educational and research purposes. Its predictions are not a medical diagnosis. Please consult a qualified medical professional for clinical evaluation.
                                </p>
                            </div>
                                
                            <footer>
                                <span>NeuroScan · Brain Tumor Prediction</span>
                                <span>Built for research & learning</span>
                            </footer>
                        </>
                    }
                </div>
            </main>
        </div>
    );
}

export default App;

function getSectionFromPath() {
    const path = window.location.pathname.replace(/^\//, '');
    if (!path || path === 'dashboard') return 'Home';
    const section = path.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    return ['Home', 'About', 'How It Works', 'History', 'Contact'].includes(section) ? section : 'Home';
}