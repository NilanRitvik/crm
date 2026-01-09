import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import './ChartsView.css';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const stageLabels = {
    "opp sourced": "Opp Sourced",
    "opp Nurturing": "Opp Nurturing",
    "opp qualified": "Opp Qualified",
    "opp in-progress": "In Progress",
    "Win": "Won",
    "lost": "Lost"
};

export default function ChartsView({ leads }) {
    const { stageData, typeData, stageValueData, metrics } = useMemo(() => {
        const stageCounts = {};
        const stageValues = {};
        const typeCounts = {};

        let totalValue = 0;
        let wonCount = 0;

        leads.forEach(lead => {
            const stage = stageLabels[lead.stage] || lead.stage;
            const value = Number(lead.value) || 0;
            const dealType = lead.dealType || "Unknown";

            // Stage Counts
            stageCounts[stage] = (stageCounts[stage] || 0) + 1;

            // Stage Values
            stageValues[stage] = (stageValues[stage] || 0) + value;

            // Type Counts
            typeCounts[dealType] = (typeCounts[dealType] || 0) + 1;

            // Metrics
            totalValue += value;
            if (lead.stage === "Win" || lead.stage === "Won" || lead.stage === "won") {
                wonCount++;
            }
        });

        const stageData = Object.keys(stageCounts).map(key => ({ name: key, value: stageCounts[key] }));
        const stageValueData = Object.keys(stageValues).map(key => ({ name: key, value: stageValues[key] }));
        const typeData = Object.keys(typeCounts).map(key => ({ name: key, value: typeCounts[key] }));

        const winRate = leads.length > 0 ? ((wonCount / leads.length) * 100).toFixed(1) : 0;
        const avgDealSize = leads.length > 0 ? (totalValue / leads.length).toFixed(0) : 0;

        return {
            stageData,
            typeData,
            stageValueData,
            metrics: { totalValue, winRate, avgDealSize, totalLeads: leads.length }
        };
    }, [leads]);

    if (leads.length === 0) {
        return <div className="charts-empty">No data to display</div>;
    }

    return (
        <div className="charts-container">
            {/* METRICS ROW */}
            <div className="metrics-summary">
                <div className="metric-card">
                    <h4>Total Leads</h4>
                    <p>{metrics.totalLeads}</p>
                </div>
                <div className="metric-card">
                    <h4>Pipeline Value</h4>
                    <p>${metrics.totalValue.toLocaleString()}</p>
                </div>
                <div className="metric-card">
                    <h4>Avg Deal Size</h4>
                    <p>${Number(metrics.avgDealSize).toLocaleString()}</p>
                </div>
                <div className="metric-card">
                    <h4>Win Rate</h4>
                    <p>{metrics.winRate}%</p>
                </div>
            </div>

            <div className="charts-grid">

                {/* PIE: Leads by Stage */}
                <div className="chart-wrapper card">
                    <h3 className="chart-title">Leads by Stage</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stageData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {stageData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* PIE: Leads by Type */}
                <div className="chart-wrapper card">
                    <h3 className="chart-title">Deal Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={typeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#82ca9d"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {typeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* BAR: Value by Stage */}
                <div className="chart-wrapper card" style={{ gridColumn: 'span 2' }}>
                    <h3 className="chart-title">Pipeline Value by Stage ($)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stageValueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="value" name="Value ($)" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
