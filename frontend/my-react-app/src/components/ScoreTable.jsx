import React from 'react';

const ScoreTable = ({ result }) => {
  if (!result) return null;

  return (
    <div className="score-table-container" style={{ marginTop: '15px', background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>AI Analysis Report</h3>
          <span style={{ fontSize: '0.8rem', color: '#6b778c' }}>Confidence: <strong>{result.confidence}</strong></span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: '16px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            background: result.recommendation === "Go" ? "#dcfce7" : (result.recommendation?.includes("Conditional") ? "#fef9c3" : "#fee2e2"),
            color: result.recommendation === "Go" ? "#166534" : (result.recommendation?.includes("Conditional") ? "#854d0e" : "#991b1b")
          }}>
            {result.recommendation?.toUpperCase() || "PENDING"}
          </span>
        </div>
      </div>

      {/* SCORE BREAKDOWN GRID */}
      <h4 style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '8px' }}>Score Breakdown</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
        {result.breakdown && Object.entries(result.breakdown).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed #e5e7eb', paddingBottom: '2px' }}>
            <span style={{ textTransform: 'capitalize', color: '#4b5563' }}>{key}</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* STRENGTHS & RISKS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <h4 style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '4px' }}>✅ Strengths</h4>
          <ul style={{ paddingLeft: '15px', margin: 0, fontSize: '0.75rem', color: '#374151' }}>
            {result.strengths?.map((s, i) => <li key={i} style={{ marginBottom: '2px' }}>{s}</li>) || <li>No data</li>}
          </ul>
        </div>
        <div>
          <h4 style={{ fontSize: '0.8rem', color: '#991b1b', marginBottom: '4px' }}>⚠️ Risks</h4>
          <ul style={{ paddingLeft: '15px', margin: 0, fontSize: '0.75rem', color: '#374151' }}>
            {result.risks?.map((s, i) => <li key={i} style={{ marginBottom: '2px' }}>{s}</li>) || <li>No data</li>}
          </ul>
        </div>
      </div>

    </div>
  );
};

export default ScoreTable;
