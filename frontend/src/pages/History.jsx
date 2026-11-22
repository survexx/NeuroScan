import { useEffect, useState } from 'react'
import { FiClock, FiFileText, FiChevronLeft, FiChevronRight, FiX, FiImage } from 'react-icons/fi'
import { getPredictionHistory, getPredictionHistoryDetail } from '../services/predictionService'

const History = () => {
    const [history, setHistory] = useState([])
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false, total: 0 })
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)

    async function loadPage(page = 1) {
        setLoading(true)
        try {
            const response = await getPredictionHistory(page, 8)
            setHistory(response.records || [])
            setPagination(response.pagination)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadPage(1) }, [])

    async function openDetail(id) {
        const response = await getPredictionHistoryDetail(id)
        setSelected(response.record)
    }

    return (
        <section className="history-section" id="history">
            <div className="section-title">
                <span className="eyebrow">PERSONAL ACTIVITY</span>
                <h2>Prediction History</h2>
                <p>{pagination.total} saved scan{pagination.total === 1 ? '' : 's'} in your account.</p>
            </div>

            {loading ? <div className="history-empty"><FiClock /><span>Loading history...</span></div> : history.length ? (
                <>
                    <div className="history-list">
                        {history.map((item) => (
                            <button className="history-item history-record" key={item.id} onClick={() => openDetail(item.id)}>
                                <FiFileText />
                                <div><strong>{item.filename}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div>
                                <b>{item.prediction}</b>
                                <span>{item.confidenceDisplay || 'N/A'}</span>
                            </button>
                        ))}
                    </div>
                    <div className="pagination">
                        <button disabled={!pagination.hasPreviousPage} onClick={() => loadPage(pagination.page - 1)}><FiChevronLeft /> Previous</button>
                        <span>Page {pagination.page} of {pagination.totalPages}</span>
                        <button disabled={!pagination.hasNextPage} onClick={() => loadPage(pagination.page + 1)}>Next <FiChevronRight /></button>
                    </div>
                </>
            ) : <div className="history-empty"><FiClock /><span>No predictions are saved in your account yet.</span></div>}

            {selected && <div className="detail-backdrop" role="dialog" aria-modal="true" onMouseDown={() => setSelected(null)}>
                <div className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
                    <button className="detail-close" onClick={() => setSelected(null)} aria-label="Close details"><FiX /></button>
                    <span className="eyebrow">SCAN DETAILS</span>
                    <h2>{selected.filename}</h2>
                    {(selected.imageUrl || selected.localImageUrl) && <img className="detail-image" src={selected.imageUrl || selected.localImageUrl} alt="Previous MRI scan" />}
                    <div className="detail-grid">
                        <div><span>Prediction</span><strong>{selected.prediction}</strong></div>
                        <div><span>Confidence</span><strong>{selected.confidenceDisplay}</strong></div>
                        <div><span>Scan date</span><strong>{new Date(selected.createdAt).toLocaleString()}</strong></div>
                    </div>
                    {Object.keys(selected.probabilities || {}).length > 0 && <div className="probabilities"><h3>Class probabilities</h3>{Object.entries(selected.probabilities).map(([name, value]) => <div key={name}><span>{name}</span><b>{typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}</b></div>)}</div>}
                </div>
            </div>}
        </section>
    )
}

export default History