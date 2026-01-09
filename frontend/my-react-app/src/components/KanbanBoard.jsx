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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PriorityStars from "../components/PriorityStars";
import "./KanbanBoard.css";

const stages = [
  "opp sourced",
  "opp Nurturing",
  "opp qualified",
  "opp in-progress",
  "Win",
  "lost"
];

// Mapped Display Names
const stageLabels = {
  "opp sourced": "Opportunity Sourced",
  "opp Nurturing": "Opportunity Nurturing",
  "opp qualified": "Opportunity Qualified",
  "opp in-progress": "Opportunity In-Progress",
  "Win": "Win",
  "lost": "Lost"
};

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

/* ================= LEADS CARD COMPONENT (Shared for Drag & Overlay) ================= */
/* ================= LEADS CARD COMPONENT (Shared for Drag & Overlay) ================= */
function LeadCard({ lead, isOverlay, isForecast, ...props }) {
  const navigate = useNavigate();

  const getPriorityClass = (p) => {
    if (p >= 4) return "priority-high";
    if (p === 3) return "priority-medium";
    return "priority-low";
  };

  return (
    <div
      className={`kanban-card ${getPriorityClass(lead.priority)} ${isOverlay ? 'overlay' : ''}`}
      onDoubleClick={() => !isOverlay && navigate(`/lead/${lead._id}`)}
      {...props}
    >
      <div className="card-tags">
        {lead.sector && <span className="card-tag" style={{ background: lead.sector === "State" ? "#007bff" : "#28a745" }}>{lead.sector}</span>}
        {lead.dealType && <span className="card-tag" style={{ background: "#0052cc" }}>{lead.dealType}</span>}
        {isForecast && lead.winProbability > 0 && (
          <span className="card-tag" style={{ background: "#6554C0", fontWeight: 'bold' }}>
            {lead.winProbability}% Win
          </span>
        )}
        {lead.department && <span className="card-tag" style={{ background: "#6c757d" }}>{lead.department}</span>}
      </div>

      <div className="card-title">{lead.name}</div>

      <div className="card-meta">
        <div className="meta-left">
          <span className="card-amount">${(lead.value || 0).toLocaleString()}</span>
          <span>{lead.closeDate ? new Date(lead.closeDate).toLocaleDateString() : 'No Date'}</span>
        </div>
        <PriorityStars value={lead.priority || 1} readOnly />
      </div>

      {lead.sourcedBy && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: "#888", display: "flex", alignItems: "center", gap: "4px" }}>
          👤 {lead.sourcedBy}
        </div>
      )}
    </div>
  );
}

/* ================= DRAGGABLE CARD WRAPPER ================= */
function DraggableCard({ lead, isForecast }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead._id,
    data: { lead } // Pass lead data for overlay
  });

  if (isDragging) {
    return (
      <div ref={setNodeRef} className="kanban-card dragging" style={{ height: '150px' }}>
        {/* Ghost placeholder */}
      </div>
    );
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <LeadCard lead={lead} isForecast={isForecast} />
    </div>
  );
}

/* ================= STAGE COLUMN ================= */
function StageColumn({ stage, leads, isForecast }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage
  });

  const totalAmount = leads.reduce((acc, lead) => acc + (lead.value || 0), 0);
  const avgWinProb = isForecast && leads.length > 0
    ? Math.round(leads.reduce((acc, l) => acc + Number(l.winProbability || 0), 0) / leads.length)
    : 0;

  // Stage-specific colors with low opacity
  const getStageColor = (stage) => {
    const colors = {
      "opp sourced": "rgba(59, 130, 246, 0.08)",        // Blue
      "opp Nurturing": "rgba(234, 179, 8, 0.08)",       // Yellow
      "opp qualified": "rgba(168, 85, 247, 0.08)",      // Purple
      "opp in-progress": "rgba(249, 115, 22, 0.08)",    // Orange
      "Win": "rgba(34, 197, 94, 0.08)",                 // Green
      "lost": "rgba(239, 68, 68, 0.08)"                 // Red
    };
    return colors[stage] || "rgba(241, 245, 249, 0.5)";
  };

  return (
    <div
      ref={setNodeRef}
      className="kanban-column"
      style={{
        background: isOver ? "#e3f2fd" : getStageColor(stage),
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="column-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span className="column-title">{stageLabels[stage] || stage}</span>
          <span className="column-count">{leads.length}</span>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#172B4D', marginTop: '6px' }}>
          Total: ${totalAmount.toLocaleString()}
          {isForecast && leads.length > 0 && (
            <span style={{ display: 'block', color: '#6554C0', fontSize: '0.8rem' }}>Avg Win: {avgWinProb}%</span>
          )}
        </div>
      </div>

      <div className="cards-container">
        {[...leads].sort((a, b) => (b.priority || 1) - (a.priority || 1)).map(lead => (
          <DraggableCard key={lead._id} lead={lead} isForecast={isForecast} />
        ))}
      </div>
    </div>
  );
}

/* ================= KANBAN BOARD ================= */
export default function KanbanBoard({ leads, onLeadUpdate, onRefresh, showToast, isForecast }) {
  const [activeLead, setActiveLead] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    // setActiveId(active.id); // unused
    setActiveLead(active.data.current?.lead);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    // setActiveId(null); // unused
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id;
    const newStage = over.id;

    const currentLead = leads.find(l => l._id === leadId);

    if (!currentLead || currentLead.stage === newStage) return;

    // Optimistic Update
    const updatedLead = { ...currentLead, stage: newStage };
    onLeadUpdate(updatedLead);

    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:5000/api/leads/${leadId}/stage`,
        { stage: newStage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optional: showToast("Stage updated", "success"); 
      // Keeping it subtle for drag and drop, maybe only error?
    } catch (err) {
      console.error("Failed to update stage", err);
      if (onRefresh) onRefresh(); // Revert on failure
      if (showToast) showToast("Failed to update stage. Reverting.", "error");
    }
  };

  return (
    <div className="kanban-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-lanes">
          {stages.map(stage => (
            <StageColumn
              key={stage}
              stage={stage}
              leads={leads.filter(l => l.stage === stage)}
              isForecast={isForecast}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
