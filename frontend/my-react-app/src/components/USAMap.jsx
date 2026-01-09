import React from 'react';
import './USAMap.css';

const USAMap = ({ onStateClick }) => {
    const states = [
        { id: 'AK', name: 'Alaska', r: 1, c: 1 },
        { id: 'ME', name: 'Maine', r: 1, c: 12 },
        { id: 'VT', name: 'Vermont', r: 2, c: 11 },
        { id: 'NH', name: 'New Hampshire', r: 2, c: 12 },
        { id: 'WA', name: 'Washington', r: 3, c: 1 },
        { id: 'ID', name: 'Idaho', r: 3, c: 2 },
        { id: 'MT', name: 'Montana', r: 3, c: 3 },
        { id: 'ND', name: 'North Dakota', r: 3, c: 4 },
        { id: 'MN', name: 'Minnesota', r: 3, c: 5 },
        { id: 'IL', name: 'Illinois', r: 3, c: 6 },
        { id: 'WI', name: 'Wisconsin', r: 3, c: 7 },
        { id: 'MI', name: 'Michigan', r: 3, c: 8 },
        { id: 'NY', name: 'New York', r: 3, c: 10 },
        { id: 'MA', name: 'Massachusetts', r: 3, c: 11 },
        { id: 'RI', name: 'Rhode Island', r: 3, c: 12 },
        { id: 'OR', name: 'Oregon', r: 4, c: 1 },
        { id: 'NV', name: 'Nevada', r: 4, c: 2 },
        { id: 'WY', name: 'Wyoming', r: 4, c: 3 },
        { id: 'SD', name: 'South Dakota', r: 4, c: 4 },
        { id: 'IA', name: 'Iowa', r: 4, c: 5 },
        { id: 'IN', name: 'Indiana', r: 4, c: 6 },
        { id: 'OH', name: 'Ohio', r: 4, c: 7 },
        { id: 'PA', name: 'Pennsylvania', r: 4, c: 8 },
        { id: 'NJ', name: 'New Jersey', r: 4, c: 9 },
        { id: 'CT', name: 'Connecticut', r: 4, c: 10 },
        { id: 'CA', name: 'California', r: 5, c: 1 },
        { id: 'UT', name: 'Utah', r: 5, c: 2 },
        { id: 'CO', name: 'Colorado', r: 5, c: 3 },
        { id: 'NE', name: 'Nebraska', r: 5, c: 4 },
        { id: 'MO', name: 'Missouri', r: 5, c: 5 },
        { id: 'KY', name: 'Kentucky', r: 5, c: 6 },
        { id: 'WV', name: 'West Virginia', r: 5, c: 7 },
        { id: 'VA', name: 'Virginia', r: 5, c: 8 },
        { id: 'MD', name: 'Maryland', r: 5, c: 9 },
        { id: 'DE', name: 'Delaware', r: 5, c: 10 },
        { id: 'AZ', name: 'Arizona', r: 6, c: 2 },
        { id: 'NM', name: 'New Mexico', r: 6, c: 3 },
        { id: 'KS', name: 'Kansas', r: 6, c: 4 },
        { id: 'AR', name: 'Arkansas', r: 6, c: 5 },
        { id: 'TN', name: 'Tennessee', r: 6, c: 6 },
        { id: 'NC', name: 'North Carolina', r: 6, c: 7 },
        { id: 'SC', name: 'South Carolina', r: 6, c: 8 },
        { id: 'OK', name: 'Oklahoma', r: 7, c: 4 },
        { id: 'LA', name: 'Louisiana', r: 7, c: 5 },
        { id: 'MS', name: 'Mississippi', r: 7, c: 6 },
        { id: 'AL', name: 'Alabama', r: 7, c: 7 },
        { id: 'GA', name: 'Georgia', r: 7, c: 8 },
        { id: 'HI', name: 'Hawaii', r: 8, c: 1 },
        { id: 'TX', name: 'Texas', r: 8, c: 4 },
        { id: 'FL', name: 'Florida', r: 8, c: 9 },
        { id: 'DC', name: 'Dist. Columbia', r: 6, c: 9 }
    ];

    // Professional Palette
    const colors = [
        '#FFFAE6', '#EAE6FF', '#E3FCEF', '#DEEBFF', '#FFEBE6', '#F4F5F7'
    ];
    // Border colors corresponding to bg
    const borderColors = [
        '#FFC400', '#8777D9', '#36B37E', '#4C9AFF', '#FF5630', '#C1C7D0'
    ];

    const getColor = (index) => {
        return {
            bg: colors[index % colors.length],
            border: borderColors[index % colors.length]
        };
    };

    return (
        <div className="usa-grid-map">
            {states.map((s, index) => {
                const style = getColor(index);
                return (
                    <div
                        key={s.id}
                        className="state-box"
                        style={{
                            gridRow: s.r,
                            gridColumn: s.c,
                            backgroundColor: style.bg,
                            borderColor: style.border
                        }}
                        onClick={() => onStateClick(s.name, s.id)}
                        title={s.name}
                    >
                        <div className="state-content">
                            <span className="state-id">{s.id}</span>
                            <span className="state-name">{s.name}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default USAMap;
