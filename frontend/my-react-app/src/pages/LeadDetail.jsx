import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PriorityStars from "../components/PriorityStars";
import { useToast } from "../context/ToastContext";
import FileUpload from "../components/FileUpload";
import ConfirmationModal from "../components/ConfirmationModal";
import { jsPDF } from "jspdf";
import ScoreDial from "../components/ScoreDial";
import ScoreTable from "../components/ScoreTable";
import "./LeadDetail.css";

const stageLabels = {
  "opp sourced": "Opportunity Sourced",
  "opp Nurturing": "Opportunity Nurturing",
  "opp qualified": "Opportunity Qualified",
  "opp in-progress": "Opportunity In-Progress",
  "Win": "Win",
  "lost": "Lost"
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* ================= LEAD STATE ================= */
  const [lead, setLead] = useState(null);
  const [editing, setEditing] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    name: "",
    stage: "",
    value: "",
    department: "",
    description: "",
    dealType: "",
    agency: "",
    state: "",
    opportunityId: "",
    opportunityUrl: "",
    incumbent: "",
    source: "",
    sourcedBy: "",
    priority: 1,
    estimatedRfpDate: "",
    awardDate: "",
    closeDate: "",
    captureActivities: "",
    keyContacts: "",
    actionItems: "",
    notes: "",
    company: "",
    email: "",
    mobile: "",
    location: "",
    opportunityStatus: "Open",
    responseMethod: "Electronic",
    sector: "State",
    winProbability: 0,
    attachments: []
  });

  /* ================= ACTIVITY STATE ================= */
  const [activityType, setActivityType] = useState("Call");
  const [activityDate, setActivityDate] = useState("");
  const [activityTime, setActivityTime] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const [newContact, setNewContact] = useState({
    name: "", surname: "", role: "", email: "", phone: "", notes: "",
    state: "", county: "", agency: "", department: "", stateUrl: "", linkedinUrl: ""
  });

  const [editingContactIndex, setEditingContactIndex] = useState(null);
  const [tempContact, setTempContact] = useState({});

  /* ================= CONFIRMATION & TOAST STATE ================= */
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);

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

  /* ================= FETCH LEAD ================= */
  const fetchLead = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/leads/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data;
      setLead(data);
      setFormData({
        name: data.name || "",
        stage: data.stage || "opp sourced",
        value: data.value || 0,
        department: data.department || "",
        description: data.description || "",
        dealType: data.dealType || "",
        agency: data.agency || "",
        state: data.state || "",
        opportunityId: data.opportunityId || "",
        opportunityUrl: data.opportunityUrl || "",
        incumbent: data.incumbent || "",
        source: data.source || "",
        sourcedBy: data.sourcedBy || "",
        priority: data.priority || 1,
        estimatedRfpDate: data.estimatedRfpDate ? data.estimatedRfpDate.split('T')[0] : "",
        awardDate: data.awardDate ? data.awardDate.split('T')[0] : "",
        closeDate: data.closeDate ? data.closeDate.split('T')[0] : "",
        captureActivities: data.captureActivities || "",
        keyContacts: data.keyContacts || "",
        actionItems: data.actionItems || "",
        notes: data.notes || "",
        company: data.company || "",
        email: data.email || "",
        mobile: data.mobile || "",
        location: data.location || "",
        opportunityStatus: data.opportunityStatus || "Open",
        responseMethod: data.responseMethod || "Electronic",
        sector: data.sector || "State",
        winProbability: data.winProbability || 0,
        attachments: data.attachments || [] // attachments
      });
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else {
        showToast("Failed to load lead details", "error");
      }
    }
  }, [id, token]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (val) => {
    setFormData(prev => ({ ...prev, priority: val }));
  };

  const saveLead = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/leads/${id}`,
        {
          ...formData,
          value: Number(formData.value) || 0,
          contacts: lead.contacts, // Preserve contacts update
          attachments: lead.attachments // Ensure attachments (including deletions) are saved
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditing(false);
      fetchLead();
      showToast("Lead updated successfully", "success");
    } catch (err) {
      showToast("Failed to update lead", "error");
      console.error(err);
    }
  };

  const deleteLead = () => {
    triggerConfirm("Are you sure you want to delete this lead permanently?", async () => {
      try {
        await axios.delete(
          `http://localhost:5000/api/leads/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        navigate("/");
      } catch (err) {
        console.error(err);
        showToast("Failed to delete lead", "error");
      }
    });
  };

  const addContact = async () => {
    if (!newContact.name) return showToast("Name is required", "error");
    const updatedContacts = [...(lead.contacts || []), newContact];

    if (!editing) {
      // Immediate Save (View Mode)
      try {
        await axios.put(
          `http://localhost:5000/api/leads/${id}`,
          { contacts: updatedContacts },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchLead();
        setNewContact({
          name: "", surname: "", role: "", email: "", phone: "", notes: "",
          state: "", county: "", agency: "", department: "", stateUrl: "", linkedinUrl: ""
        });
        setIsAddingContact(false);
        showToast("Contact saved successfully", "success");
      } catch (err) {
        console.error(err);
        showToast("Failed to save contact", "error");
      }
    } else {
      // Edit Mode (Deferred)
      setLead(prev => ({ ...prev, contacts: updatedContacts }));
      setNewContact({
        name: "", surname: "", role: "", email: "", phone: "", notes: "",
        state: "", county: "", agency: "", department: "", stateUrl: "", linkedinUrl: ""
      });
    }
  };

  const removeContact = async (index) => {
    if (editing) {
      const updatedContacts = lead.contacts.filter((_, i) => i !== index);
      setLead(prev => ({ ...prev, contacts: updatedContacts }));
    } else {
      if (!window.confirm("Are you sure you want to remove this contact?")) return;

      const updatedContacts = lead.contacts.filter((_, i) => i !== index);
      try {
        await axios.put(
          `http://localhost:5000/api/leads/${id}`,
          { contacts: updatedContacts },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchLead();
        showToast("Contact removed", "success");
      } catch (err) {
        console.error(err);
        showToast("Failed to remove contact", "error");
      }
    }
  };

  const startEditContact = (index, contact) => {
    setEditingContactIndex(index);
    setTempContact({ ...contact });
  };

  const cancelEditContact = () => {
    setEditingContactIndex(null);
    setTempContact({});
  };

  const saveEditContact = () => {
    const updatedContacts = [...lead.contacts];
    updatedContacts[editingContactIndex] = tempContact;
    setLead(prev => ({ ...prev, contacts: updatedContacts }));
    setEditingContactIndex(null);
    setTempContact({});
  };

  const handleEditContactChange = (field, value) => {
    setTempContact(prev => ({ ...prev, [field]: value }));
  };

  /* ================= FILE UPLOAD ================= */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      // 1. Upload File
      const uploadRes = await axios.post("http://localhost:5000/api/leads/upload", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      const { name, url } = uploadRes.data;

      // 2. Add to Lead Attachments
      const newAttachment = { name, url, uploadedAt: new Date() };
      const updatedAttachments = [...(lead.attachments || []), newAttachment];

      // 3. Update Lead
      await axios.put(
        `http://localhost:5000/api/leads/${id}`,
        { attachments: updatedAttachments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchLead();
      showToast("File uploaded successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload file", "error");
    }
  };

  /* ================= PDF EXPORT ================= */
  const handleExportPDF = () => {
    if (!lead) return;

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("TechXL - Lead Detail Report", 14, 20);

    doc.setFontSize(14);
    doc.text(`Opportunity Name: ${lead.name}`, 14, 30);
    doc.text(`Sector: ${lead.sector || "N/A"}`, 14, 38);
    doc.text(`Department: ${lead.department || "N/A"}`, 14, 46);
    doc.text(`Value: $${(lead.value || 0).toLocaleString()}`, 14, 54);
    doc.text(`Status: ${lead.opportunityStatus || "N/A"} | Stage: ${stageLabels[lead.stage] || lead.stage}`, 14, 62);

    doc.setFontSize(16);
    doc.text("Key Dates", 14, 75);
    doc.setFontSize(12);
    doc.text(`Est. RFP Date: ${lead.estimatedRfpDate ? new Date(lead.estimatedRfpDate).toLocaleDateString() : "N/A"}`, 14, 83);
    doc.text(`Award Date: ${lead.awardDate ? new Date(lead.awardDate).toLocaleDateString() : "N/A"}`, 14, 91);
    doc.text(`Close Date: ${lead.closeDate ? new Date(lead.closeDate).toLocaleDateString() : "N/A"}`, 14, 99);

    doc.setFontSize(16);
    doc.text("Ownership & Details", 14, 115);
    doc.setFontSize(12);
    doc.text(`Incumbent: ${lead.incumbent || "N/A"}`, 14, 123);
    doc.text(`Response Method: ${lead.responseMethod || "N/A"}`, 14, 131);
    doc.text(`Sourced By: ${lead.sourcedBy || "N/A"}`, 14, 139);

    doc.setFontSize(16);
    doc.text("Description", 14, 155);
    doc.setFontSize(12);

    const splitDesc = doc.splitTextToSize(lead.description || "N/A", 180);
    doc.text(splitDesc, 14, 163);

    let yPos = 163 + (splitDesc.length * 7);

    if (lead.contacts && lead.contacts.length > 0) {
      yPos += 15;
      if (yPos > 270) { doc.addPage(); yPos = 20; }

      doc.setFontSize(16);
      doc.text("Important Contacts", 14, yPos);
      yPos += 10;
      doc.setFontSize(12);

      lead.contacts.forEach((c) => {
        if (yPos > 280) { doc.addPage(); yPos = 20; }
        const contactInfo = `${c.name} ${c.surname} - ${c.role} (${c.email || "No Email"})`;
        doc.text(contactInfo, 14, yPos);
        yPos += 7;
      });
    }

    doc.save(`${lead.name.replace(/\s+/g, '_')}_report.pdf`);
    showToast("PDF Exported successfully", "success");
  };

  /* ================= AI SCORING ================= */
  const [aiResult, setAiResult] = useState(null);
  const [scoringLoading, setScoringLoading] = useState(false);

  const handleScoreDeal = async () => {
    setScoringLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/ai/score/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiResult(res.data);
      showToast("Scoring analysis complete", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate score. Ensure API key is set.", "error");
    } finally {
      setScoringLoading(false);
    }
  };

  /* ================= ACTIVITY HANDLERS ================= */
  const addActivity = async () => {
    if (!activityDate || !activityNote.trim()) return;

    // Combine Date and Time
    const finalDate = activityTime ? `${activityDate}T${activityTime}:00` : new Date(activityDate).toISOString();

    try {
      await axios.post(
        `http://localhost:5000/api/leads/${id}/activities`,
        { type: activityType, dueDate: finalDate, note: activityNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivityDate("");
      setActivityTime("");
      setActivityNote("");
      fetchLead();
      showToast("Activity added", "success");
    } catch (err) {
      showToast("Failed to add activity", "error");
    }
  };

  const updateActivity = async (activityId) => {
    const finalDate = editTime ? `${editDate}T${editTime}:00` : new Date(editDate).toISOString();

    try {
      await axios.put(
        `http://localhost:5000/api/leads/${id}/activities/${activityId}`,
        { note: editNote, dueDate: finalDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingActivityId(null);
      fetchLead();
      showToast("Activity updated", "success");
    } catch (err) {
      showToast("Failed to update activity", "error");
    }
  };

  const completeActivity = async (activityId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/leads/${id}/activities/${activityId}/status`,
        { status: "Done" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLead();
      showToast("Activity marked as done", "success");
    } catch (err) {
      showToast("Failed to complete activity", "error");
    }
  };

  const deleteActivity = (activityId) => {
    triggerConfirm("Are you sure you want to delete this activity?", async () => {
      try {
        await axios.delete(
          `http://localhost:5000/api/leads/${id}/activities/${activityId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchLead();
        showToast("Activity deleted", "success");
      } catch (err) {
        showToast("Failed to delete activity", "error");
      }
    });
  };

  if (!lead) return <div className="lead-detail-container">Loading...</div>;

  const pendingActivities = lead.activities?.filter(a => a.status !== "Done") || [];
  const completedActivities = lead.activities?.filter(a => a.status === "Done") || [];

  return (
    <div className="lead-detail-container">
      {/* HEADER */}
      <div className="detail-header">
        <div>
          <button onClick={() => navigate("/")} className="btn btn-secondary" style={{ marginBottom: "8px" }}>
            ⬅ Back to Board
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="header-title">{lead.name}</h1>
            {!editing && <span className="status-badge" style={{ background: '#0052cc', color: 'white' }}>{lead.sector}</span>}
            {!editing && <span className="status-badge">{lead.opportunityStatus}</span>}
          </div>
        </div>
        <div className="header-actions">
          {!editing && (
            <>
              <button onClick={() => setEditing(true)} className="btn btn-primary">✏️ Edit Deal</button>
              <button onClick={handleExportPDF} className="btn btn-secondary" style={{ backgroundColor: "#28a745", color: "white", borderColor: "#28a745" }}>📄 Export PDF</button>
              <button onClick={deleteLead} className="btn btn-danger">🗑 Delete</button>
            </>
          )}
          {editing && (
            <>
              <button onClick={saveLead} className="btn btn-primary">💾 Save Changes</button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary">Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="main-grid">
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* AI SCORING CARD */}
          <div className="detail-card">
            <div className="card-header-styled" style={{ background: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)', color: '#0369a1', borderBottom: '1px solid #bae6fd' }}>
              🤖 AI Opportunity Scoring {scoringLoading && "(Analyzing...)"}
            </div>
            <div className="card-content">
              {!aiResult ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ color: '#64748b', marginBottom: '15px' }}>
                    Evaluate this opportunity against {lead.company || "Company"} capabilities using AI.
                  </p>
                  <button
                    onClick={handleScoreDeal}
                    disabled={scoringLoading}
                    className="btn btn-primary"
                    style={{ background: scoringLoading ? '#94a3b8' : '#0ea5e9', border: 'none', padding: '10px 24px', fontSize: '1rem' }}
                  >
                    {scoringLoading ? " Analyzing Requirements..." : "✨ Calculate Go / No-Go Score"}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* THREE-TIER SCORING DISPLAY */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>

                    {/* 1. COMPANY BASELINE SCORE */}
                    <div style={{ textAlign: 'center', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #0ea5e9' }}>
                      <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: '600', marginBottom: '8px' }}>
                        🏢 COMPANY BASELINE
                      </div>
                      <ScoreDial score={aiResult.company_score || aiResult.overall_score || 0} size={100} />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                        From companycap.txt
                      </div>
                    </div>

                    {/* 2. PARTNER ANALYSIS */}
                    <div style={{ textAlign: 'center', padding: '15px', background: '#fff7ed', borderRadius: '8px', border: '2px solid #f59e0b' }}>
                      <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '600', marginBottom: '8px' }}>
                        🤝 PARTNER LIFT
                      </div>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#16a34a', lineHeight: '100px' }}>
                        +{Math.max(0, (aiResult.team_score || 0) - (aiResult.company_score || aiResult.overall_score || 0))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                        Gap-filling bonus
                      </div>
                    </div>

                    {/* 3. TEAM SCORE */}
                    <div style={{ textAlign: 'center', padding: '15px', background: '#ecfdf5', borderRadius: '8px', border: '2px solid #10b981' }}>
                      <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: '600', marginBottom: '8px' }}>
                        🚀 TEAM SCORE
                      </div>
                      <ScoreDial score={aiResult.team_score || aiResult.company_score || aiResult.overall_score || 0} size={100} />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                        Company + Partners
                      </div>
                    </div>

                  </div>

                  {/* RECOMMENDATION */}
                  <div style={{ textAlign: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#374151' }}>Final Recommendation</h3>
                    <p style={{ fontSize: '1.2rem', fontWeight: '600', margin: '0', color: aiResult.team_recommendation === 'Go' ? '#059669' : (aiResult.team_recommendation?.includes('Conditional') ? '#d97706' : '#dc2626') }}>
                      {aiResult.team_recommendation || aiResult.recommendation || "Pending"}
                    </p>
                    <button onClick={handleScoreDeal} className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }}>🔄 Re-Evaluate</button>
                  </div>

                  <ScoreTable result={aiResult} />
                </div>
              )}
            </div>
          </div>

          {/* TEAM SCORING CARD */}
          {aiResult && aiResult.suggested_partners && aiResult.suggested_partners.length > 0 && (
            <div className="detail-card">
              <div className="card-header-styled" style={{ background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)', color: '#9a3412', borderBottom: '1px solid #fed7aa' }}>
                🤝 Team & Partner Recommendation {aiResult.team_score > 0 && `(Combined Score: ${aiResult.team_score}/100)`}
              </div>
              <div className="card-content">
                <p style={{ marginBottom: '10px', color: '#333' }}>
                  Based on your capabilities and the gaps needed for this opportunity, here are the top suggested partners:
                </p>

                {aiResult.suggested_partners.map((sp, i) => (
                  <div key={i} style={{
                    background: 'white',
                    border: '1px solid #fed7aa',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#7c2d12' }}>🤝 {sp.name}</strong>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{
                          background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                        }}>Match: {sp.probability || sp.score}%</span>
                        <span style={{
                          background: '#ffedd5', color: '#9a3412', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                        }}>+{sp.score} pts</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#555', margin: 0 }}>
                      {sp.reason}
                    </p>
                  </div>
                ))}

                {/* SCORING BREAKDOWN */}
                <div style={{ marginTop: '15px', padding: '15px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#065f46', borderBottom: '1px solid #a7f3d0', paddingBottom: '5px' }}>Projected Outcome with Team</h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', fontSize: '0.95rem' }}>
                    <span style={{ color: '#334155' }}>🏢 My Company Score:</span>
                    <strong style={{ color: '#334155' }}>{aiResult.company_score || aiResult.overall_score || 0}/100</strong>

                    <span style={{ color: '#334155' }}>🤝 Partner Lift (Best Match):</span>
                    <strong style={{ color: '#16a34a' }}>+{(aiResult.team_score - (aiResult.company_score || aiResult.overall_score || 0)).toFixed(0)}</strong>

                    <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #a7f3d0', margin: '5px 0' }}></div>

                    <span style={{ color: '#065f46', fontWeight: 'bold' }}>🚀 Total Team Score:</span>
                    <strong style={{ color: '#065f46', fontSize: '1.1rem' }}>{aiResult.team_score}/100</strong>
                  </div>

                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <strong style={{
                      display: 'inline-block',
                      background: aiResult.team_recommendation === 'Go' ? '#059669' : (aiResult.team_recommendation?.includes('Conditional') ? '#d97706' : '#dc2626'),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.9rem'
                    }}>
                      Final Recommendation: {aiResult.team_recommendation}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CORE DETAILS */}
          <div className="detail-card">
            <div className="card-header-styled">📌 Core Details</div>
            <div className="card-content">
              <div className="detail-grid">
                <div className="field-group">
                  <label className="field-label">Opportunity Name</label>
                  {editing ? <input name="name" className="form-input" value={formData.name} onChange={handleChange} /> : <div className="field-value highlight">{lead.name}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Opportunity - Department</label>
                  {editing ? <input name="department" className="form-input" value={formData.department} onChange={handleChange} /> : <div className="field-value">{lead.department || "-"}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Deal Type</label>
                  {editing ? (
                    <select name="dealType" className="form-select" value={formData.dealType} onChange={handleChange}>
                      <option value="RFP">RFP</option>
                      <option value="RFI">RFI</option>
                      <option value="RFR">RFR</option>
                      <option value="Solicitation">Solicitation</option>
                      <option value="Notice">Notice</option>
                      <option value="Forecast">Forecast</option>
                    </select>
                  ) : <div className="field-value">{lead.dealType || "-"}</div>}
                </div>
                {/* Win Probability - Only for Forecast or if value exists */}
                {(formData.dealType === 'Forecast' || lead.winProbability > 0) && (
                  <div className="field-group">
                    <label className="field-label">Win Probability (%)</label>
                    {editing ? (
                      <input name="winProbability" type="number" min="0" max="100" className="form-input" value={formData.winProbability || ''} onChange={handleChange} />
                    ) : (
                      <div className="field-value" style={{ fontWeight: 'bold', color: '#6554C0' }}>
                        {lead.winProbability ? `${lead.winProbability}%` : "0%"}
                      </div>
                    )}
                  </div>
                )}
                <div className="field-group">
                  <label className="field-label">Value ($)</label>
                  {editing ? <input name="value" type="number" className="form-input" value={formData.value} onChange={handleChange} /> : <div className="field-value">${(lead.value || 0).toLocaleString()}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Opp Status</label>
                  {editing ? (
                    <select name="opportunityStatus" className="form-select" value={formData.opportunityStatus} onChange={handleChange}>
                      <option>Open</option>
                      <option>Closed</option>
                      <option>TBD</option>
                    </select>
                  ) : <div className="field-value">{lead.opportunityStatus || "Open"}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Response Method</label>
                  {editing ? (
                    <select name="responseMethod" className="form-select" value={formData.responseMethod} onChange={handleChange}>
                      <option>Electronic</option>
                      <option>Manual</option>
                    </select>
                  ) : <div className="field-value">{lead.responseMethod || "Electronic"}</div>}
                </div>
                {editing && (
                  <div className="field-group">
                    <label className="field-label">Sector</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <label><input type="radio" name="sector" value="State" checked={formData.sector === "State"} onChange={handleChange} /> State</label>
                      <label><input type="radio" name="sector" value="Federal" checked={formData.sector === "Federal"} onChange={handleChange} /> Federal</label>
                      <label><input type="radio" name="sector" value="Others" checked={formData.sector === "Others"} onChange={handleChange} /> Others</label>
                    </div>
                  </div>
                )}
                <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">Description (BOX)</label>
                  {editing ? <textarea name="description" className="form-textarea" value={formData.description} onChange={handleChange} /> : <div className="field-value" style={{ whiteSpace: 'pre-wrap', background: '#f4f5f7', padding: '10px', borderRadius: '4px' }}>{lead.description || "-"}</div>}
                </div>
              </div>
            </div>

            {/* OPPORTUNITY INFO */}
            <div className="detail-card">
              <div className="card-header-styled">🔗 Opportunity Info & Dates</div>
              <div className="card-content">
                <div className="detail-grid">
                  <div className="field-group">
                    <label className="field-label">Opportunity ID</label>
                    {editing ? <input name="opportunityId" className="form-input" value={formData.opportunityId} onChange={handleChange} /> : <div className="field-value">{lead.opportunityId || "-"}</div>}
                  </div>
                  <div className="field-group" style={{ gridColumn: "span 2" }}>
                    <label className="field-label">Opportunity URL</label>
                    {editing ? <input name="opportunityUrl" className="form-input" value={formData.opportunityUrl} onChange={handleChange} /> :
                      <div className="field-value">{lead.opportunityUrl ? <a href={lead.opportunityUrl.startsWith('http') ? lead.opportunityUrl : `https://${lead.opportunityUrl}`} target="_blank" rel="noreferrer" style={{ color: '#0052cc' }}>{lead.opportunityUrl}</a> : "-"}</div>}
                  </div>

                  <div className="field-group">
                    <label className="field-label">Est. RFP Date</label>
                    {editing ? <input type="date" name="estimatedRfpDate" className="form-input" value={formData.estimatedRfpDate} onChange={handleChange} /> : <div className="field-value">{lead.estimatedRfpDate ? new Date(lead.estimatedRfpDate).toLocaleDateString() : "-"}</div>}
                  </div>
                  <div className="field-group">
                    <label className="field-label">Award Date</label>
                    {editing ? <input type="date" name="awardDate" className="form-input" value={formData.awardDate} onChange={handleChange} /> : <div className="field-value">{lead.awardDate ? new Date(lead.awardDate).toLocaleDateString() : "-"}</div>}
                  </div>
                  <div className="field-group">
                    <label className="field-label">Close Date</label>
                    {editing ? <input type="date" name="closeDate" className="form-input" value={formData.closeDate} onChange={handleChange} /> : <div className="field-value">{lead.closeDate ? new Date(lead.closeDate).toLocaleDateString() : "-"}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* ATTACHMENTS */}
            <div className="detail-card">
              <div className="card-header-styled">📎 Attachments</div>
              <div className="card-content">
                {lead.attachments && lead.attachments.length > 0 ? lead.attachments.map((att, index) => (
                  <div key={index} className="attachment-item" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <a href={`http://localhost:5000${att.url}`} target="_blank" rel="noopener noreferrer">📄 {att.name}</a>
                      <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '10px' }}>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    {editing && (
                      <button
                        onClick={() => {
                          const newAttachments = lead.attachments.filter((_, i) => i !== index);
                          setLead(prev => ({ ...prev, attachments: newAttachments }));
                          // We'll save this change when the user clicks "Save Changes", or we can auto-save.
                          // Given the context of "Edit Deal" mode, we usually wait for Save. 
                          // However, the user might want immediate deletion. 
                          // Let's modify the filtering to happen in formData as well if we are in edit mode, 
                          // OR strictly rely on the 'Save' button to persist this.
                          // Based on previous code, setFormData handles the state.
                          setFormData(prev => ({ ...prev, attachments: newAttachments }));
                        }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                )) : <p style={{ color: '#888', fontStyle: 'italic' }}>No attachments.</p>}

                <div style={{ marginTop: '15px' }}>
                  <label className="field-label" style={{ marginBottom: '5px', display: 'block' }}>Add Attachment</label>
                  <FileUpload onChange={handleFileUpload} label="Upload Attachment" />
                </div>
              </div>
            </div>

            {/* DETAILS & NOTES */}
            <div className="detail-card">
              <div className="card-header-styled">📝 Details & Notes</div>
              <div className="card-content">
                <div className="detail-grid-2">
                  <div className="field-group">
                    <label className="field-label">Capture Activities</label>
                    {editing ? <textarea name="captureActivities" className="form-textarea" value={formData.captureActivities} onChange={handleChange} /> : <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>{lead.captureActivities || "-"}</div>}
                  </div>
                  <div className="field-group">
                    <label className="field-label">Action Items</label>
                    {editing ? <textarea name="actionItems" className="form-textarea" value={formData.actionItems} onChange={handleChange} /> : <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>{lead.actionItems || "-"}</div>}
                  </div>
                  <div className="field-group">
                    <label className="field-label">General Notes</label>
                    {editing ? <textarea name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} /> : <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>{lead.notes || "-"}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIVITY LOG */}
            <div className="detail-card">
              <div className="card-header-styled">⚡ Activity Log</div>
              <div className="card-content">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <select value={activityType} onChange={e => setActivityType(e.target.value)} className="form-select" style={{ width: 'auto' }}>
                    <option>Call</option>
                    <option>Meeting</option>
                    <option>Email</option>
                    <option>Task</option>
                  </select>
                  <input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} className="form-input" style={{ width: 'auto' }} />
                  <input type="time" value={activityTime} onChange={e => setActivityTime(e.target.value)} className="form-input" style={{ width: 'auto' }} />
                  <input placeholder="Add a note..." value={activityNote} onChange={e => setActivityNote(e.target.value)} className="form-input" style={{ flex: 1, minWidth: '200px' }} />
                  <button onClick={addActivity} className="btn btn-primary">Add</button>
                </div>

                <h5 style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Pending</h5>
                {pendingActivities.length === 0 && <p style={{ fontSize: '13px', color: '#888' }}>No pending activities</p>}
                {pendingActivities.map(a => (
                  <div key={a._id} className="activity-item">
                    <div className="activity-header">
                      <strong>{a.type}</strong>
                      <span>{new Date(a.dueDate).toLocaleDateString()} {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="activity-body">
                      {editingActivityId === a._id ? (
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <textarea value={editNote} onChange={e => setEditNote(e.target.value)} className="form-textarea" />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="form-input" />
                            <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="form-input" />
                          </div>
                          <div>
                            <button onClick={() => updateActivity(a._id)} className="btn btn-primary btn-sm" style={{ marginRight: '8px' }}>Save</button>
                            <button onClick={() => setEditingActivityId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{a.note}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => completeActivity(a._id)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }}>Done</button>
                            <button onClick={() => {
                              const dateObj = new Date(a.dueDate);
                              setEditingActivityId(a._id);
                              setEditNote(a.note);
                              setEditDate(dateObj.toISOString().split("T")[0]);
                              setEditTime(dateObj.toTimeString().split(" ")[0].substring(0, 5));
                            }} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }}>Edit</button>
                            <button onClick={() => deleteActivity(a._id)} className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '11px' }}>X</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {completedActivities.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h5 style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>History</h5>
                    {completedActivities.map(a => (
                      <div key={a._id} style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px', color: '#888' }}>
                        <span style={{ textDecoration: 'line-through' }}>{a.type} - {a.note}</span>
                        <span style={{ float: 'right' }}>{new Date(a.dueDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN (SIDEBAR) */}
        <div className="sidebar-section">

          {/* INCUMBENT & OWNERSHIP */}
          <div className="detail-card">
            <div className="card-header-styled">👤 Ownership</div>
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="field-group">
                  <label className="field-label">Incumbent</label>
                  {editing ? <input name="incumbent" className="form-input" value={formData.incumbent} onChange={handleChange} /> : <div className="field-value">{lead.incumbent || "-"}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Sourced By</label>
                  {editing ? <input name="sourcedBy" className="form-input" value={formData.sourcedBy} onChange={handleChange} /> : <div className="field-value">{lead.sourcedBy || "-"}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Source</label>
                  {editing ? (
                    <select name="source" className="form-select" value={formData.source} onChange={handleChange}>
                      <option value="">Select Source</option>
                      <option value="State Portal">State Portal</option>
                      <option value="FED Portal">FED Portal</option>
                      <option value="Others">Others</option>
                    </select>
                  ) : <div className="field-value">{lead.source || "-"}</div>}
                </div>
                <div className="field-group">
                  <label className="field-label">Priority</label>
                  {editing ? <PriorityStars value={formData.priority} onChange={handlePriorityChange} /> : <PriorityStars value={formData.priority} readOnly />}
                </div>
              </div>
            </div>
          </div>

          {/* IMPORTANT CONTACTS */}
          <div className="detail-card">
            <div className="card-header-styled">👥 Important Contacts</div>
            <div className="card-content">
              <div className="contacts-list">
                {lead.contacts && lead.contacts.map((contact, index) => (
                  <div key={index} className="contact-item">
                    {editing && editingContactIndex === index ? (
                      <div className="add-contact-form" style={{ marginTop: 0, width: '100%', padding: '10px' }}>
                        <div className="contact-inputs-grid" style={{ gridTemplateColumns: '1fr' }}>
                          <input placeholder="Name" className="form-input" value={tempContact.name} onChange={e => handleEditContactChange("name", e.target.value)} />
                          <input placeholder="Role" className="form-input" value={tempContact.role} onChange={e => handleEditContactChange("role", e.target.value)} />
                          <input placeholder="Email" className="form-input" value={tempContact.email} onChange={e => handleEditContactChange("email", e.target.value)} />
                          <input placeholder="Phone" className="form-input" value={tempContact.phone} onChange={e => handleEditContactChange("phone", e.target.value)} />
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <button onClick={saveEditContact} className="btn btn-primary btn-sm">Save</button>
                          <button onClick={cancelEditContact} className="btn btn-secondary btn-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="contact-info">
                          <strong>{contact.name} {contact.surname}</strong>
                          <span className="contact-role">{contact.role}</span>
                          <div className="contact-details" style={{ flexDirection: 'column', gap: '2px' }}>
                            {contact.email && <span>📧 <a href={`mailto:${contact.email}`}>{contact.email}</a></span>}
                            {contact.phone && <span>📞 {contact.phone}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {editing && <button onClick={() => startEditContact(index, contact)} className="btn btn-secondary btn-sm">Edit</button>}
                          <button onClick={() => removeContact(index)} className="btn btn-danger btn-sm" title="Remove Contact">X</button>
                        </div>
                      </>
                    )}
                  </div>
                ))
                }
                {lead.contacts?.length === 0 && !editing && <p className="text-muted">No contacts added.</p>}
              </div>

              {/* Add Contact Trigger in View Mode */}
              {!editing && !isAddingContact && (
                <div style={{ marginTop: '15px' }}>
                  <button onClick={() => setIsAddingContact(true)} className="btn btn-primary btn-sm">+ Add New Contact</button>
                </div>
              )}

              {(editing || isAddingContact) && (
                <div className="add-contact-form" style={{ padding: '12px', marginTop: '15px', borderTop: '1px solid #eee' }}>
                  <h5 style={{ fontSize: '1rem', marginBottom: '10px' }}>{editing ? "Add Contact (Save Lead to persist)" : "Add New Contact"}</h5>
                  <div className="contact-inputs-grid" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '10px', marginBottom: '10px' }}>
                    <input placeholder="Name *" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} className="form-input" />
                    <input placeholder="Surname" value={newContact.surname} onChange={e => setNewContact({ ...newContact, surname: e.target.value })} className="form-input" />
                    <input placeholder="Role" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} className="form-input" />
                    <input placeholder="Email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} className="form-input" />
                    <input placeholder="Phone" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} className="form-input" />
                    <input placeholder="State" value={newContact.state} onChange={e => setNewContact({ ...newContact, state: e.target.value })} className="form-input" />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={addContact} className="btn btn-primary btn-sm">Save Contact</button>
                    {!editing && <button type="button" onClick={() => setIsAddingContact(false)} className="btn btn-secondary btn-sm">Cancel</button>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LOCATIONS & AGENCY */}
          <div className="detail-card">
            <div className="card-header-styled">📍 Location</div>
            <div className="card-content">
              <div className="field-group">
                <label className="field-label">Agency</label>
                {editing ? <input name="agency" className="form-input" value={formData.agency} onChange={handleChange} /> : <div className="field-value">{lead.agency || "-"}</div>}
              </div>
              <div className="field-group" style={{ marginTop: '12px' }}>
                <label className="field-label">State/Location</label>
                {editing ? <input name="state" className="form-input" value={formData.state} onChange={handleChange} /> : <div className="field-value">{lead.state || "-"}</div>}
              </div>
            </div>
          </div>

        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Action"
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />

    </div >
  );
}
