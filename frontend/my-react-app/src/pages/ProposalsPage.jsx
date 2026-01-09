import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import './ProposalsPage.css';
import ProposalModal from '../components/ProposalModal';
import ConfirmationModal from '../components/ConfirmationModal';
import StateFilter from '../components/StateFilter';
import { useToast } from '../context/ToastContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function ProposalsPage() {
    const { addToast } = useToast();
    const [proposals, setProposals] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [leads, setLeads] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingProposal, setEditingProposal] = useState(null);

    // Confirmation State
    const [showConfirm, setShowConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [sectorFilter, setSectorFilter] = useState('All');
    const [selectedState, setSelectedState] = useState(null);

    // Document Delete State
    const [docToDelete, setDocToDelete] = useState(null);
    const [showDocConfirm, setShowDocConfirm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const [propRes, anaRes, leadRes] = await Promise.all([
                axios.get('http://localhost:5000/api/proposals', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/proposals/analytics', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/leads', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setProposals(propRes.data);
            setAnalytics(anaRes.data);
            setLeads(leadRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdateProposal = async (data) => {
        const token = localStorage.getItem('token');

        console.log('💾 Saving proposal with data:', data);

        try {
            // Send as JSON, not FormData
            const proposalData = {
                lead: data.lead,
                solicitationNumber: data.solicitationNumber || '',
                agency: data.agency || '',
                state: data.state || '', // Explicitly include state
                sector: data.sector || 'State', // Include sector
                status: data.status || 'Draft',
                submittedDate: data.submittedDate,
                submittedValue: data.submittedValue || 0,
                role: data.role || 'Prime'
            };

            console.log('📤 Sending proposal data:', proposalData);

            let savedProposalId;

            if (editingProposal) {
                const res = await axios.put(
                    `http://localhost:5000/api/proposals/${editingProposal._id}`,
                    proposalData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                savedProposalId = res.data._id;
                addToast('Proposal updated successfully', 'success');
            } else {
                const res = await axios.post(
                    'http://localhost:5000/api/proposals',
                    proposalData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                savedProposalId = res.data._id;
                addToast('Proposal created successfully', 'success');
            }

            // Handle File Upload separately
            if (data.file) {
                console.log('📎 Uploading file...', data.file.name);
                const formData = new FormData();
                formData.append('file', data.file);

                await axios.post(
                    `http://localhost:5000/api/proposals/${savedProposalId}/upload`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                addToast('Document uploaded successfully', 'success');
            }

            setShowModal(false);
            setEditingProposal(null);
            fetchData();
        } catch (err) {
            console.error('❌ Error saving proposal:', err);
            const msg = err.response?.data?.error || err.response?.data?.message || 'Unknown error';
            addToast(`Failed to ${editingProposal ? 'update' : 'create'} proposal: ${msg}`, 'error');
        }
    };

    const handleDeleteProposal = (id) => {
        setItemToDelete(id);
        setShowConfirm(true);
    };



    const handleDeleteDocument = (proposalId, docId) => {
        setDocToDelete({ proposalId, docId });
        setShowDocConfirm(true);
    };

    const proceedDeleteDocument = async () => {
        if (!docToDelete) return;
        const { proposalId, docId } = docToDelete;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/proposals/${proposalId}/documents/${docId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast('Document deleted successfully', 'success');

            // Update local state if editing
            if (editingProposal && editingProposal._id === proposalId) {
                setEditingProposal(prev => ({
                    ...prev,
                    documents: prev.documents.filter(d => d._id !== docId)
                }));
            }

            fetchData();
        } catch (err) {
            console.error('Delete Document Error:', err);
            addToast('Failed to delete document', 'error');
        } finally {
            setShowDocConfirm(false);
            setDocToDelete(null);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/proposals/${itemToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
            showToast("Proposal deleted successfully", "success");
        } catch (err) {
            console.error(err);
            showToast("Failed to delete proposal", 'error');
        } finally {
            setShowConfirm(false);
            setItemToDelete(null);
        }
    };

    const openCreateModal = () => {
        setEditingProposal(null);
        setShowModal(true);
    };

    const openEditModal = (proposal) => {
        setEditingProposal(proposal);
        setShowModal(true);
    };

    // --- CHART DATA ---
    const winLossData = {
        labels: ['Won', 'Lost', 'Pending'],
        datasets: [{
            data: [
                analytics?.kpis?.totalWins || 0,
                analytics?.kpis?.totalLosses || 0,
                (analytics?.kpis?.totalSubmitted || 0) - (analytics?.kpis?.totalWins || 0) - (analytics?.kpis?.totalLosses || 0)
            ],
            backgroundColor: ['#36B37E', '#FF5630', '#FFAB00'],
            borderWidth: 0
        }]
    };

    const lossReasonData = {
        labels: Object.keys(analytics?.charts?.lossReasons || {}),
        datasets: [{
            label: 'Loss Reasons',
            data: Object.values(analytics?.charts?.lossReasons || {}),
            backgroundColor: '#FF5630',
            maxBarThickness: 60,
            borderRadius: 4
        }]
    };

    // --- FILTERED LIST ---
    const filteredProposals = proposals.filter(p =>
        (statusFilter === 'All' ? true : p.status === statusFilter) &&
        (sectorFilter === 'All' ? true : (p.sector === sectorFilter || (sectorFilter === 'State' && !p.sector))) &&
        (selectedState ?
            (selectedState === '__NO_STATE__' ?
                !(p.state || p.lead?.state) :
                (p.state === selectedState || p.lead?.state === selectedState)
            )
            : true)
    );

    const calcSector = (sector) => {
        const subset = proposals.filter(p => p.sector === sector || (sector === 'State' && !p.sector));
        const total = subset.length;
        const wins = subset.filter(p => ['Awarded', 'Won'].includes(p.status)).length;
        const losses = subset.filter(p => ['Lost', 'Cancelled'].includes(p.status)).length;
        const pending = total - wins - losses;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

        const subVal = subset.reduce((acc, p) => acc + (p.submittedValue || 0), 0);
        const awardVal = subset.filter(p => ['Awarded', 'Won'].includes(p.status)).reduce((acc, p) => acc + (p.submittedValue || 0), 0);

        return {
            total, winRate, subVal, awardVal,
            chartData: {
                labels: ['Won', 'Lost', 'Pending'],
                datasets: [{
                    data: [wins, losses, pending],
                    backgroundColor: ['#36B37E', '#FF5630', '#FFAB00'],
                    borderWidth: 0
                }]
            }
        };
    };

    const fedStats = calcSector('Federal');
    const stateStats = calcSector('State');
    const otherStats = calcSector('Others');

    return (
        <div className="proposals-page">

            <div className="proposals-container">
                <div className="page-header">
                    <h1>Proposal Tracking & Analytics</h1>
                    <div className="header-actions">
                        <button className={`view-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                            📊 Dashboard
                        </button>
                        <button className={`view-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                            📄 Proposals
                        </button>
                        <button className="create-proposal-btn" onClick={openCreateModal}>+ New Proposal</button>
                    </div>
                </div>

                {loading ? <p>Loading data...</p> : (
                    <>
                        {/* --- DASHBOARD VIEW --- */}
                        {activeTab === 'dashboard' && (
                            <div className="dashboard-overview" style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '40px' }}>
                                {[
                                    { title: 'Federal Proposals', stats: fedStats },
                                    { title: 'State Proposals', stats: stateStats },
                                    { title: 'Other Proposals', stats: otherStats }
                                ].filter(s => s.stats.total > 0 || ['Federal Proposals', 'State Proposals'].includes(s.title)).map((section, idx) => (
                                    <div key={idx} className="sector-section">
                                        <h2 style={{ fontSize: '1.3rem', color: '#172B4D', marginBottom: '16px', borderBottom: '2px solid #dfe1e6', paddingBottom: '8px', fontWeight: '600' }}>
                                            {section.title}
                                        </h2>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                            {/* KPI Row (Small & Clean) */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #ebecf0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B778C', fontWeight: '700' }}>Submissions</div>
                                                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#172B4D', marginTop: '4px', lineHeight: 1.2 }}>{section.stats.total}</div>
                                                </div>
                                                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #ebecf0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B778C', fontWeight: '700' }}>Win Rate</div>
                                                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#006644', marginTop: '4px', lineHeight: 1.2 }}>{section.stats.winRate}%</div>
                                                </div>
                                                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #ebecf0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B778C', fontWeight: '700' }}>Submitted Value</div>
                                                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#172B4D', marginTop: '4px', lineHeight: 1.2 }}>${section.stats.subVal.toLocaleString()}</div>
                                                </div>
                                                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #ebecf0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B778C', fontWeight: '700' }}>Awarded Value</div>
                                                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#006644', marginTop: '4px', lineHeight: 1.2 }}>${section.stats.awardVal.toLocaleString()}</div>
                                                </div>
                                            </div>

                                            {/* Chart Row (Small & Aligned) */}
                                            <div style={{ display: 'flex' }}>
                                                <div style={{ width: '380px', background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #ebecf0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#42526E', fontWeight: '600' }}>Outcome Distribution</h4>
                                                    <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
                                                        <Doughnut
                                                            data={section.stats.chartData}
                                                            options={{
                                                                maintainAspectRatio: false,
                                                                cutout: '65%',
                                                                plugins: {
                                                                    legend: {
                                                                        position: 'right',
                                                                        labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 }, padding: 15 }
                                                                    }
                                                                },
                                                                layout: { padding: 5 }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- LIST VIEW --- */}
                        {activeTab === 'list' && (
                            <div className="list-view">
                                <div className="filters-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={sectorFilter}
                                            onChange={(e) => setSectorFilter(e.target.value)}
                                            style={{
                                                padding: '10px 36px 10px 14px',
                                                borderRadius: '6px',
                                                border: '1px solid #dfe1e6',
                                                backgroundColor: 'white',
                                                fontSize: '0.9rem',
                                                color: '#172b4d',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                minWidth: '160px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                appearance: 'none',
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2342526E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 14px center',
                                                outline: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <option value="All">All Sectors</option>
                                            <option value="State">State</option>
                                            <option value="Federal">Federal</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>

                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            style={{
                                                padding: '10px 36px 10px 14px',
                                                borderRadius: '6px',
                                                border: '1px solid #dfe1e6',
                                                backgroundColor: 'white',
                                                fontSize: '0.9rem',
                                                color: '#172b4d',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                minWidth: '160px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                appearance: 'none',
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2342526E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 14px center',
                                                outline: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Draft">Draft</option>
                                            <option value="Submitted">Submitted</option>
                                            <option value="Awarded">Awarded</option>
                                            <option value="Lost">Lost</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Active Filter Indicator */}
                                {selectedState && (
                                    <div style={{
                                        background: '#e6f2ff',
                                        border: '1px solid #0052cc',
                                        borderRadius: '6px',
                                        padding: '12px 16px',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: '#0052cc', fontWeight: '600' }}>
                                            📍 Filtered by: {selectedState === '__NO_STATE__' ? 'No Location' : selectedState}
                                            <span style={{ marginLeft: '8px', color: '#42526e', fontWeight: 'normal' }}>
                                                ({filteredProposals.length} of {proposals.length} proposals)
                                            </span>
                                        </span>
                                        <button
                                            onClick={() => setSelectedState(null)}
                                            style={{
                                                background: '#0052cc',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            Clear Filter
                                        </button>
                                    </div>
                                )}

                                {/* Two-column layout for table and state filter */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
                                    <div>

                                        <table className="proposals-table">
                                            <thead>
                                                <tr>
                                                    <th>Proposal / Opportunity</th>
                                                    <th>Agency</th>
                                                    <th>State</th>
                                                    <th>Submit Date</th>
                                                    <th>Value</th>
                                                    <th>Status</th>
                                                    <th>Docs</th>
                                                    <th>Partners</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredProposals.length > 0 ? filteredProposals.map(p => (
                                                    <tr key={p._id}>
                                                        <td>
                                                            <div className="proposal-name">
                                                                {p.lead?.name || 'Untitled'}
                                                                {p.documents && p.documents.length > 0 && (
                                                                    <span title={`${p.documents.length} files attached`} style={{ marginLeft: '5px' }}>📎</span>
                                                                )}
                                                            </div>
                                                            <div className="solicitation-num">{p.solicitationNumber || 'No Sol#'}</div>
                                                        </td>
                                                        <td>{p.agency || p.lead?.agency || '-'}</td>
                                                        <td>{p.state || p.lead?.state || '-'}</td>
                                                        <td>{p.submittedDate ? new Date(p.submittedDate).toLocaleDateString() : '-'}</td>
                                                        <td>${(p.submittedValue || 0).toLocaleString()}</td>
                                                        <td>
                                                            <span className={`status-badge ${p.status.toLowerCase()}`}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {p.documents && p.documents.length > 0 ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    {p.documents.map((doc, idx) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={`http://localhost:5000${doc.url}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ color: '#0066cc', textDecoration: 'none', fontSize: '0.9rem' }}
                                                                            title={doc.name}
                                                                        >
                                                                            📄 View
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            ) : <span style={{ color: '#cbd5e0' }}>-</span>}
                                                        </td>
                                                        <td>
                                                            {p.partners.length > 0 ? (
                                                                <div className="partner-stack">
                                                                    {p.partners.map((pt, i) => (
                                                                        <span key={i} className="partner-chip">{pt.name}</span>
                                                                    ))}
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button className="edit-btn" onClick={() => openEditModal(p)}>✏️ Edit</button>
                                                                <button className="edit-btn" style={{ color: '#d32f2f', borderColor: '#ffcdd2' }} onClick={() => handleDeleteProposal(p._id)}>🗑️</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#6b778c' }}>
                                                        {selectedState ? (
                                                            <>
                                                                <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No proposals found in this location</div>
                                                                <div style={{ fontSize: '0.9rem' }}>Try selecting a different location or clear the filter</div>
                                                            </>
                                                        ) : (
                                                            'No proposals found.'
                                                        )}
                                                    </td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* State Filter Panel */}
                                    <StateFilter
                                        items={proposals}
                                        selectedState={selectedState}
                                        onStateSelect={setSelectedState}
                                        getStateFromItem={(p) => p.state || p.lead?.state}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={showConfirm}
                title="Delete Proposal"
                message="Are you sure you want to delete this proposal? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setShowConfirm(false)}
            />

            <ConfirmationModal
                isOpen={showDocConfirm}
                title="Delete Document"
                message="Are you sure you want to delete this attached document? This cannot be undone."
                onConfirm={proceedDeleteDocument}
                onCancel={() => setShowDocConfirm(false)}
            />

            <ProposalModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleCreateOrUpdateProposal}
                leads={leads}
                initialData={editingProposal}
                onDeleteDocument={handleDeleteDocument}
            />
        </div >
    );
}
