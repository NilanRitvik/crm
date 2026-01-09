import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import KanbanBoard from "../components/KanbanBoard";
import ListView from "../components/ListView";
import AddDealModal from "../components/AddDealModal";
import ConfirmationModal from "../components/ConfirmationModal";
import ChartsView from "../components/ChartsView";
import { useToast } from "../context/ToastContext";
import { useSearchParams } from "react-router-dom"; // Ensure this is here if used
import CalendarView from "../components/CalendarView";
import "./LeadsDashboard.css";

export default function LeadsDashboard() {
    const [leads, setLeads] = useState([]);
    const [view, setView] = useState("kanban");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchParams] = useSearchParams(); // Get URL params if needed for search

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
            // No token, force login
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
                // Token invalid or expired
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            } else {
                showToast("Failed to load leads. Backend may be down.", "error");
            }
        }
    }, []);

    useEffect(() => {
        fetchLeads();

        // Socket.io Real-time Updates
        import("socket.io-client").then(({ io }) => {
            const socket = io("http://localhost:5000");

            socket.on("connect", () => {
                console.log("Connected to WebSocket");
            });

            socket.on("leads:updated", () => {
                console.log("Received leads:updated event -> refetching...");
                fetchLeads();
                showToast("Pipeline updated externally", "success");
            });

            return () => {
                socket.disconnect();
            };
        });

    }, [fetchLeads]);

    // Filter leads based on search logic
    // Filter leads based on search logic & Sector
    const [sectorFilter, setSectorFilter] = useState("All");
    const searchTerm = searchParams.get("search") || "";

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.dealType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.stage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.contacts?.some(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSector = sectorFilter === "All" || lead.sector === sectorFilter || (sectorFilter === 'State' && !lead.sector);
        // Exclude Forecast deals
        const isPipelineDeal = lead.dealType !== "Forecast";

        return matchesSearch && matchesSector && isPipelineDeal;
    });

    const handleUpdateLead = (updatedLead) => {
        setLeads((prev) =>
            prev.map((l) => (l._id === updatedLead._id ? updatedLead : l))
        );
    };

    const handleDeleteLead = (leadId) => {
        triggerConfirm("Are you sure you want to delete this lead?", async () => {
            const token = localStorage.getItem("token");
            try {
                await axios.delete(`http://localhost:5000/api/leads/${leadId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLeads((prev) => prev.filter((l) => l._id !== leadId));
                showToast("Lead deleted successfully", "success");
            } catch (err) {
                console.error("Error deleting lead:", err);
                showToast("Failed to delete lead", "error");
            }
        });
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2 style={{ margin: 0 }}>Leads Pipeline</h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsModalOpen(true)}
                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                        + Add New Deal
                    </button>
                </div>


                <div className="view-toggle">
                    <div className="view-toggle" style={{ marginRight: '15px' }}>
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

                    <button
                        className={`toggle-btn ${view === "kanban" ? "active" : ""}`}
                        onClick={() => setView("kanban")}
                        style={{
                            padding: "8px 16px",
                            border: "1px solid #ccc",
                            borderRight: "none",
                            borderRadius: "4px 0 0 4px",
                            background: view === "kanban" ? "#0052cc" : "white",
                            color: view === "kanban" ? "white" : "#333",
                            cursor: "pointer"
                        }}
                    >
                        Kanban
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
                        List
                    </button>
                    <button
                        className={`toggle-btn ${view === "chart" ? "active" : ""}`}
                        onClick={() => setView("chart")}
                        style={{
                            padding: "8px 16px",
                            border: "1px solid #ccc",
                            borderRight: "none",
                            background: view === "chart" ? "#0052cc" : "white",
                            color: view === "chart" ? "white" : "#333",
                            cursor: "pointer"
                        }}
                    >
                        Chart
                    </button>
                    <button
                        className={`toggle-btn ${view === "calendar" ? "active" : ""}`}
                        onClick={() => setView("calendar")}
                        style={{
                            padding: "8px 16px",
                            border: "1px solid #ccc",
                            borderRadius: "0 4px 4px 0",
                            background: view === "calendar" ? "#0052cc" : "white",
                            color: view === "calendar" ? "white" : "#333",
                            cursor: "pointer"
                        }}
                    >
                        Calendar
                    </button>
                </div>
            </div>

            {/* FILTER BAR */}
            {/* FILTER BAR REMOVED - Integrated into global search */}

            {view === "kanban" && <KanbanBoard leads={filteredLeads} onLeadUpdate={handleUpdateLead} onRefresh={fetchLeads} showToast={showToast} />}
            {view === "list" && <ListView leads={filteredLeads} onDelete={handleDeleteLead} />}
            {view === "chart" && <ChartsView leads={filteredLeads} />}
            {view === "calendar" && <CalendarView leads={filteredLeads} />}

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
