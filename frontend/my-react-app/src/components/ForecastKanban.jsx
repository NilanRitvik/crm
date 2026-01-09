import {
    DndContext,
    useDraggable,
    useDroppable,
    closestCenter,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import axios from "axios";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PriorityStars from "../components/PriorityStars";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import "./KanbanBoard.css";

// Register ChartJS
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const forecastStages = ["Source", "High Priority", "Low Priority"];

const stageLabels = {
    "Source": "📥 Sourced",
    "High Priority": "🔥 High Priority",
    "Low Priority": "📌 Low Priority"
};

const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: '0.5' },
        },
    }),
};

/* ================= FORECAST CARD COMPONENT ================= */
function ForecastCard({ lead, isOverlay, ...props }) {
    const navigate = useNavigate();

    return (
        <div
            className={`kanban-card ${isOverlay ? 'overlay' : ''}`}
            onDoubleClick={() => !isOverlay && navigate(`/lead/${lead._id}`)}
            {...props}
            style={{
                borderLeft: `4px solid ${lead.forecastStage === 'High Priority' ? '#ef4444' : lead.forecastStage === 'Low Priority' ? '#eab308' : '#3b82f6'}`,
                marginBottom: '10px'
            }}
        >
            <div className="card-tags">
                {lead.sector && <span className="card-tag" style={{ background: lead.sector === "State" ? "#007bff" : "#28a745" }}>{lead.sector}</span>}
                {lead.winProbability > 0 && (
                    <span className="card-tag" style={{ background: "#6554C0", fontWeight: 'bold' }}>
                        {lead.winProbability}% Win
                    </span>
                )}
            </div>
            <div className="card-title">{lead.name}</div>
            <div className="card-meta">
                <div className="meta-left">
                    <span className="card-amount">${(lead.value || 0).toLocaleString()}</span>
                </div>
                <PriorityStars value={lead.priority || 1} readOnly />
            </div>
        </div>
    );
}

/* ================= DRAGGABLE CARD WRAPPER ================= */
function DraggableCard({ lead }) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: lead._id,
        data: { lead }
    });

    return (
        <div ref={setNodeRef} {...listeners} {...attributes}>
            <ForecastCard lead={lead} />
        </div>
    );
}

/* ================= STAGE COLUMN (VERTICAL) ================= */
function StageColumn({ stage, leads }) {
    const { setNodeRef, isOver } = useDroppable({ id: stage });

    const totalAmount = leads.reduce((acc, lead) => acc + (lead.value || 0), 0);

    const getStageColor = (stage) => {
        const colors = {
            "Source": "#eff6ff",           // Blue tint
            "High Priority": "#fef2f2",     // Red tint
            "Low Priority": "#fefce8"       // Yellow tint
        };
        return colors[stage] || "#f8f9fa";
    };

    return (
        <div
            ref={setNodeRef}
            className="vertical-stage-column"
            style={{
                background: isOver ? "#e0e7ff" : getStageColor(stage),
                padding: '15px',
                borderRadius: '12px',
                minWidth: '220px', /* Allow shrinking */
                flex: 1, /* Share space equally */
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(0,0,0,0.05)'
            }}
        >
            <div className="column-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>{stageLabels[stage]}</span>
                <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {leads.length} • ${totalAmount.toLocaleString()}
                </span>
            </div>

            <div className="cards-list" style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}>
                {leads.map(lead => (
                    <DraggableCard key={lead._id} lead={lead} />
                ))}
                {leads.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Drop items here</div>}
            </div>
        </div>
    );
}

/* ================= MAIN COMPONENT ================= */
export default function ForecastKanban({ leads, onLeadUpdate, onRefresh, showToast }) {
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
    );

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const leadId = active.id;
        const newStage = over.id;
        if (!forecastStages.includes(newStage)) return;

        const token = localStorage.getItem("token");
        try {
            await axios.put(
                `http://localhost:5000/api/leads/${leadId}`,
                { forecastStage: newStage },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onRefresh) onRefresh();
            if (showToast) showToast(`Moved to ${newStage}`, "success");
        } catch (err) {
            console.error("Update failed:", err);
            if (showToast) showToast("Failed to update stage", "error");
        }
    };

    const activeLead = activeId ? leads.find(l => l._id === activeId) : null;

    // Chart Data
    const chartData = useMemo(() => {
        const counts = forecastStages.map(stage => leads.filter(l => (l.forecastStage || "Source") === stage).length);
        const values = forecastStages.map(stage => leads.filter(l => (l.forecastStage || "Source") === stage).reduce((a, b) => a + (Number(b.value) || 0), 0));

        return {
            pie: {
                labels: forecastStages,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#3b82f6', '#ef4444', '#eab308'],
                    borderWidth: 0
                }]
            },
            bar: {
                labels: forecastStages,
                datasets: [{
                    label: 'Pipeline Value ($)',
                    data: values,
                    backgroundColor: ['rgba(59, 130, 246, 0.6)', 'rgba(239, 68, 68, 0.6)', 'rgba(234, 179, 8, 0.6)'],
                    borderRadius: 6
                }]
            }
        };
    }, [leads]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            title: { display: false }
        },
        scales: {
            y: { beginAtZero: true, grid: { display: false } },
            x: { grid: { display: false } }
        }
    };

    return (
        <div className="forecast-dashboard" style={{ display: 'flex', gap: '30px', height: 'calc(100vh - 140px)', padding: '0 10px' }}>

            {/* LEFT COLUMN: KANBAN (Main) */}
            <div className="kanban-horizontal-section" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'row', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {forecastStages.map(stage => (
                        <StageColumn
                            key={stage}
                            stage={stage}
                            leads={leads.filter(l => (l.forecastStage || "Source") === stage)}
                        />
                    ))}

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeLead ? <ForecastCard lead={activeLead} isOverlay={true} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* RIGHT COLUMN: CHARTS (Sidebar) */}
            <div className="charts-section" style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="chart-card" style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', flex: 1 }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#475569' }}>Forecast Value Distribution</h3>
                    <div style={{ height: '200px', width: '100%' }}>
                        <Bar options={{ ...chartOptions, maintainAspectRatio: false, indexAxis: 'y' }} data={chartData.bar} />
                    </div>
                </div>

                <div className="chart-card" style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', flex: 1, display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#475569' }}>Deal Count by Stage</h3>
                        <div style={{ height: '180px', display: 'flex', justifyContent: 'center' }}>
                            <Doughnut options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } } }} data={chartData.pie} />
                        </div>
                    </div>
                    {/* Add more stats or insights here if needed */}
                </div>
            </div>

        </div>
    );
}
