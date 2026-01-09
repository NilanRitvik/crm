import React, { useEffect, useState, useMemo } from 'react';
import api from '../axios'; // Use configured axios instance
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import './MainDashboard.css';

const COLORS = ['#0052cc', '#00C49F', '#FFBB28', '#FF8042', '#FF4560', '#AF19FF'];

export default function MainDashboard() {
    const [user, setUser] = useState({ name: 'Executive' });
    const [dashboardData, setDashboardData] = useState({
        leads: [],
        partners: [],
        proposals: [],
        events: [],
        contactsCount: 0,
        portalsCount: 0,
        stateOrgCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all'); // all, month, quarter
    const [sectorFilter, setSectorFilter] = useState('all'); // all, State, Federal, Others

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch (e) { }
        }
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        // api instance handles token
        const queries = [
            { key: 'leads', url: '/api/leads' },
            { key: 'partners', url: '/api/partners' },
            { key: 'contacts', url: '/api/contacts' },
            { key: 'proposals', url: '/api/proposals' },
            { key: 'events', url: '/api/events' },
            { key: 'portals', url: '/api/portals' },
            { key: 'stateOrg', url: '/api/state-org' }
        ];

        try {
            const results = await Promise.allSettled(
                queries.map(q => api.get(q.url))
            );

            const newData = { ...dashboardData };
            results.forEach((res, index) => {
                const key = queries[index].key;
                if (res.status === 'fulfilled') {
                    const val = res.value.data;
                    if (key === 'leads') newData.leads = Array.isArray(val) ? val : [];
                    else if (key === 'partners') newData.partners = Array.isArray(val) ? val : [];
                    else if (key === 'proposals') newData.proposals = Array.isArray(val) ? val : [];
                    else if (key === 'events') newData.events = Array.isArray(val) ? val : [];
                    else if (key === 'contacts') newData.contactsCount = Array.isArray(val) ? val.length : 0;
                    else if (key === 'portals') newData.portalsCount = Array.isArray(val) ? val.length : 0;
                    else if (key === 'stateOrg') newData.stateOrgCount = Array.isArray(val) ? val.length : 0;
                }
            });
            setDashboardData(newData);
        } catch (err) {
            console.error("Dashboard fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    // --- Computed Data ---
    const filteredLeads = useMemo(() => {
        let leads = dashboardData.leads;
        if (sectorFilter !== 'all') {
            leads = leads.filter(l => l.sector === sectorFilter || (!l.sector && sectorFilter === 'State'));
        }

        if (timeRange === 'all') return leads;

        const now = new Date();
        const past = new Date();
        if (timeRange === 'month') past.setMonth(now.getMonth() - 1);
        if (timeRange === 'quarter') past.setMonth(now.getMonth() - 3);

        return leads.filter(l => new Date(l.createdAt || l.updatedAt) >= past);
    }, [dashboardData.leads, timeRange, sectorFilter]);

    const totalPipeline = filteredLeads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
    const activeDeals = filteredLeads.length;

    // Win Rate Calculation
    const wonCount = filteredLeads.filter(l => l.stage?.toLowerCase().includes('won') || l.status === 'Won').length;
    const lossCount = filteredLeads.filter(l => l.stage?.toLowerCase().includes('lost') || l.status === 'Lost').length;
    const winRate = activeDeals > 0 ? (wonCount / activeDeals * 100).toFixed(1) : 0.0;

    // Activity Feed (Proposals + New Partners + Events)
    const combinedFeed = useMemo(() => {
        const feed = [];
        let props = dashboardData.proposals;
        if (sectorFilter !== 'all') {
            props = props.filter(p => p.sector === sectorFilter || (!p.sector && sectorFilter === 'State'));
        }

        props.forEach(p => feed.push({
            type: 'proposal', date: new Date(p.submittedDate || p.createdAt),
            title: `Proposal Submitted: ${p.solicitationNumber || 'N/A'}`, sub: p.agency
        }));
        dashboardData.partners.forEach(p => feed.push({
            type: 'partner', date: new Date(p.createdAt),
            title: `New Partner: ${p.companyName || p.name}`, sub: p.specialty
        }));
        dashboardData.events.forEach(e => feed.push({
            type: 'event', date: new Date(e.start || e.date),
            title: `Event: ${e.title}`, sub: new Date(e.start).toLocaleDateString()
        }));
        // Sort DESC
        return feed.sort((a, b) => b.date - a.date).slice(0, 10); // Last 10
    }, [dashboardData]);

    // Chart Data
    const stageCounts = {};
    filteredLeads.forEach(l => {
        const s = l.stage || 'Unknown';
        stageCounts[s] = (stageCounts[s] || 0) + 1;
    });
    const barData = Object.keys(stageCounts).map(k => ({ name: k, count: stageCounts[k] }));

    const pieData = [
        { name: 'Won', value: wonCount },
        { name: 'Lost', value: lossCount },
        { name: 'Open', value: activeDeals - wonCount - lossCount }
    ].filter(d => d.value > 0);

    if (loading) return <div className="main-dashboard" style={{ padding: '40px', textAlign: 'center' }}>Loading Executive Intelligence...</div>;

    return (
        <div className="main-dashboard">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="welcome-title">Techxl Intelligence System (TIS)</h1>
                    <p className="welcome-subtitle">Executive Overview for {user.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        className="dashboard-filter"
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #dfe1e6', background: 'white' }}
                    >
                        <option value="all">All Sectors</option>
                        <option value="State">State</option>
                        <option value="Federal">Federal</option>
                        <option value="Others">Others</option>
                    </select>
                    <select
                        className="dashboard-filter"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #dfe1e6', background: 'white' }}
                    >
                        <option value="all">All Time</option>
                        <option value="month">Last 30 Days</option>
                        <option value="quarter">Last Quarter</option>
                    </select>
                </div>
            </div>

            {/* KPI Row */}
            <div className="kpi-row">
                <div className="kpi-card">
                    <div className="kpi-label">Total Pipeline Value</div>
                    <div className="kpi-value">${totalPipeline.toLocaleString()}</div>
                    <div className="kpi-subtext">{activeDeals} Active Deals</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Active Partners</div>
                    <div className="kpi-value">{dashboardData.partners.length}</div>
                    <div className="kpi-subtext">Network Size</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Proposals Submitted</div>
                    <div className="kpi-value">{dashboardData.proposals.filter(p => p.status === 'Submitted').length}</div>
                    <div className="kpi-subtext">Win Pending</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Win Rate</div>
                    <div className="kpi-value" style={{ color: Number(winRate) > 20 ? '#006644' : '#172B4D' }}>{winRate}%</div>
                    <div className="kpi-subtext">Conversion Metric</div>
                </div>
            </div>

            {/* Main Content Grid with 2 Charts + Feed */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 0.8fr' }}>
                {/* Left Column: Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="section-card">
                        <h3 className="section-title">Pipeline Composition ({timeRange})</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#0052cc" radius={[4, 4, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="section-card">
                        <h3 className="section-title">Outcome Distribution</h3>
                        <div style={{ width: '100%', height: 250, display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity Feed & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Unified Activity Feed */}
                    <div className="section-card" style={{ flex: 1 }}>
                        <h3 className="section-title">Recent Intelligence</h3>
                        <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {combinedFeed.length === 0 ? <span style={{ color: '#666', fontSize: '0.9rem' }}>No recent activity.</span> :
                                combinedFeed.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#172B4D' }}>{item.title}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#6B778C' }}>{item.date.toLocaleDateString()}</span>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#5E6C84' }}>{item.sub}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="section-card">
                        <h3 className="section-title">Operational Metrics</h3>
                        <div className="stats-grid-small" style={{ marginTop: '15px' }}>
                            <div className="stat-item-small">
                                <h5>{dashboardData.contactsCount}</h5>
                                <span>Contacts</span>
                            </div>
                            <div className="stat-item-small">
                                <h5>{dashboardData.stateOrgCount}</h5>
                                <span>Agencies</span>
                            </div>
                            <div className="stat-item-small">
                                <h5>{dashboardData.portalsCount}</h5>
                                <span>Portals</span>
                            </div>
                            <div className="stat-item-small">
                                <h5>{dashboardData.events.length}</h5>
                                <span>Events</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
