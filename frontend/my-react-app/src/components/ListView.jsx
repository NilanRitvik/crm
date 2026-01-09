import React from "react";
import { useNavigate } from "react-router-dom";
import PriorityStars from "./PriorityStars";
import "./ListView.css";

const stageLabels = {
    "opp sourced": "Opportunity Sourced",
    "opp Nurturing": "Opportunity Nurturing",
    "opp qualified": "Opportunity Qualified",
    "opp in-progress": "Opportunity In-Progress",
    "Win": "Win",
    "lost": "Lost"
};

const getStageClass = (stage) => {
    return `stage-${stage?.replace(/\s+/g, '-').toLowerCase()}`;
};

export default function ListView({ leads, onDelete }) {
    const navigate = useNavigate();

    return (
        <div className="list-view-container">
            <table className="list-view-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Stage</th>
                        <th>Deal Type</th>
                        <th>Agency</th>
                        <th>Value</th>
                        <th>Priority</th>
                        <th>Close Date</th>
                        <th>AI Score</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr key={lead._id} onDoubleClick={() => navigate(`/lead/${lead._id}`)}>
                            <td>{lead.name}</td>
                            <td>
                                <span className={`stage-badge ${getStageClass(lead.stage)}`}>
                                    {stageLabels[lead.stage] || lead.stage}
                                </span>
                            </td>
                            <td>{lead.dealType || "-"}</td>
                            <td>{lead.agency || "-"}</td>
                            <td>${(lead.value || 0).toLocaleString()}</td>
                            <td>
                                <PriorityStars value={lead.priority || 1} readOnly />
                            </td>
                            <td>{lead.closeDate ? new Date(lead.closeDate).toLocaleDateString() : "-"}</td>
                            <td>
                                {lead.aiScore > 0 ? (
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: lead.aiScore >= 80 ? '#166534' : (lead.aiScore >= 60 ? '#854d0e' : '#991b1b'),
                                        background: lead.aiScore >= 80 ? '#dcfce7' : (lead.aiScore >= 60 ? '#fef9c3' : '#fee2e2'),
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem'
                                    }}>
                                        {lead.aiScore}%
                                    </span>
                                ) : <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Pending</span>}
                            </td>
                            <td>
                                <button
                                    className="action-btn delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(lead._id);
                                    }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {leads.length === 0 && (
                        <tr>
                            <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                                No leads found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
