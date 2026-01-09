import React from 'react';

const ScoreDial = ({ score, size = 80, stroke = 8 }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    let color = "#ef4444"; // Red
    if (score >= 80) color = "#22c55e"; // Green
    else if (score >= 60) color = "#eab308"; // Yellow

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    stroke="#e5e7eb"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    strokeWidth={stroke}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transition: 'stroke-dashoffset 0.5s ease',
                        strokeLinecap: 'round'
                    }}
                />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{score}%</span>
                {/* <div style={{ fontSize: '0.8rem', color: '#6b778c' }}>Fit</div> */}
            </div>
        </div>
    );
};

export default ScoreDial;
