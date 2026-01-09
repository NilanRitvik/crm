import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import ForecastKanban from "../components/ForecastKanban";
import ListView from "../components/ListView";
import AddDealModal from "../components/AddDealModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { useToast } from "../context/ToastContext";
import { useSearchParams } from "react-router-dom";
import "./LeadsDashboard.css";

export default function ForecastPage() {
    const [leads, setLeads] = useState([]);
    const [view, setView] = useState("kanban"); // "kanban", "list", "card"
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const [sectorFilter, setSectorFilter] = useState("All");

    // Confirmation & Toast State
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmCallback, setConfirmCallback] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const { addToast } = useToast();
    const showToast = (msg, type) => addToast(msg, type);

    const triggerConfirm = (message, action) => {
        setConfirmMessage(message);
        setConfirmCallback(() => action);
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        if (confirmCallback) await confirmCallback();
        setShowConfirm(false);
    };

    const fetchLeads = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            const res = await axios.get("http://localhost:5000/api/leads", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeads(res.data);
        } catch (err) {
            console.error("Error fetching leads:", err);
            if (err.response && err.response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            } else {
                showToast("Failed to load leads.", "error");
            }
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Filter leads for FORECAST page
    const searchTerm = searchParams.get("search") || "";

    const filteredLeads = leads.filter(lead => {
        // MUST be Forecast type
        if (lead.dealType !== "Forecast") return false;

        const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.dealType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.forecastStage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.location?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSector = sectorFilter === "All" || lead.sector === sectorFilter || (sectorFilter === 'State' && !lead.sector);

        return matchesSearch && matchesSector;
    });

    const handleUpdateLead = (updatedLead) => {
        setLeads((prev) =>
            prev.map((l) => (l._id === updatedLead._id ? updatedLead : l))
        );
    };

    const handleDeleteLead = (leadId) => {
        triggerConfirm("Are you sure you want to delete this forecast?", async () => {
            const token = localStorage.getItem("token");
            try {
                await axios.delete(`http://localhost:5000/api/leads/${leadId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLeads((prev) => prev.filter((l) => l._id !== leadId));
                showToast("Forecast deleted successfully", "success");
            } catch (err) {
                console.error("Error deleting lead:", err);
                showToast("Failed to delete forecast", "error");
            }
        });
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2 style={{ margin: 0 }}>Forecast Pipeline</h2>
                    <div className="view-toggle">
                        {['All', 'State', 'Federal', 'Others'].map((filter, idx, arr) => (
                            <button
                                key={filter}
                                className={`toggle-btn ${sectorFilter === filter ? "active" : ""}`}
                                onClick={() => setSectorFilter(filter)}
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #ccc",
                                    borderRight: idx === arr.length - 1 ? "1px solid #ccc" : "none",
                                    borderRadius: idx === 0 ? "4px 0 0 4px" : idx === arr.length - 1 ? "0 4px 4px 0" : "0",
                                    background: sectorFilter === filter ? "#007bff" : "white",
                                    color: sectorFilter === filter ? "white" : "#333",
                                    cursor: "pointer"
                                }}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${view === "kanban" ? "active" : ""}`}
                        onClick={() => setView("kanban")}
                        style={{
                            padding: "8px 16px",
                            border: "1px solid #ccc",
                            borderRight: "none",
                            borderRadius: "4px 0 0 0",
                            background: view === "kanban" ? "#0052cc" : "white",
                            color: view === "kanban" ? "white" : "#333",
                            cursor: "pointer"
                        }}
                    >
                        📊 Kanban
                    </button>
                    <button
                        className={`toggle-btn ${view === "list" ? "active" : ""}`}
                        onClick={() => setView("list")}
                        style={{
                            padding: "8px 16px",
                            border: "1px solid #ccc",
                            borderRight: "none",
                            background: view === "list" ? "#0052cc" : "white",
                            color: view === "list" ? "white" : "#333",
                            cursor: "pointer"
                        }}
                    >
                        📋 List
                    </button>
                    <button
                        className={`toggle-btn ${view === "card" ? "active" : ""}`}
                        onClick={() => setView("card")}
                        style={{
                            padding: "8px 16px",
                            border: "1px solid #ccc",
                            borderRadius: "0 4px 4px 0",
                            background: view === "card" ? "#0052cc" : "white",
                            color: view === "card" ? "white" : "#333",
                            cursor: "pointer"
                        }}
                    >
                        🗂️ Card
                    </button>
                </div>
            </div>

            {view === "kanban" && (
                <ForecastKanban
                    leads={filteredLeads}
                    onLeadUpdate={handleUpdateLead}
                    onRefresh={fetchLeads}
                    showToast={showToast}
                />
            )}
            {view === "list" && <ListView leads={filteredLeads} onDelete={handleDeleteLead} />}
            {view === "card" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', padding: '20px 0' }}>
                    {filteredLeads.map(lead => (
                        <div key={lead._id} style={{
                            background: 'white',
                            borderRadius: '8px',
                            padding: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border: '1px solid #e0e0e0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#172b4d' }}>{lead.name}</h3>
                                <span style={{
                                    background: lead.forecastStage === 'High Priority' ? '#dcfce7' : lead.forecastStage === 'Low Priority' ? '#fef3c7' : '#dbeafe',
                                    color: lead.forecastStage === 'High Priority' ? '#166534' : lead.forecastStage === 'Low Priority' ? '#92400e' : '#1e40af',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}>
                                    {lead.forecastStage || 'Source'}
                                </span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Value:</span>
                                    <strong style={{ fontSize: '1.1rem', color: '#059669' }}>${(lead.value || 0).toLocaleString()}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Win Probability:</span>
                                    <strong style={{ fontSize: '1rem', color: '#6366f1' }}>{lead.winProbability || 0}%</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Close Date:</span>
                                    <span style={{ fontSize: '0.9rem' }}>{lead.closeDate ? new Date(lead.closeDate).toLocaleDateString() : 'Not set'}</span>
                                </div>
                            </div>
                            {lead.sector && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                    <span style={{
                                        background: '#f3f4f6',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        color: '#374151'
                                    }}>
                                        {lead.sector}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <AddDealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDealAdded={(msg) => {
                    fetchLeads();
                    if (msg) showToast(msg, "success");
                }}
            />

            <ConfirmationModal
                isOpen={showConfirm}
                title="Confirm Action"
                message={confirmMessage}
                onConfirm={handleConfirm}
                onCancel={() => setShowConfirm(false)}
            />

        </div>
    );
}
