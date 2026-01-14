import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './HuntsmanAnalytics.css';

const HUNTSMAN_STEPS = [
    { name: 'Awaiting Assessment', key: 'Awaiting Assessment', color: '#94a3b8' },
    { name: 'Under Investigation', key: 'Under Investigation', color: '#f59e0b' },
    { name: 'Repair In Progress', key: 'Repair In Progress', color: '#3b82f6' },
    { name: 'Awaiting Spare Parts', key: 'Awaiting Spare Parts', color: '#8b5cf6' },
    { name: 'Quality Check', key: 'Quality Check', color: '#ec4899' },
    { name: 'Ready for Dispatch', key: 'Ready for Dispatch', color: '#10b981' },
    { name: 'Completed', key: 'Completed', color: '#22c55e' },
    { name: 'On Hold', key: 'On Hold', color: '#ef4444' }
];

export default function HuntsmanAnalytics() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { user } = useAuth();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchAllData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const [activeRes, archivedRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/admin/rmas?archived=false`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/admin/rmas?archived=true`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const [activeData, archivedData] = await Promise.all([
                activeRes.json(),
                archivedRes.json()
            ]);

            const allRmas = [...(activeData.rmas || []), ...(archivedData.rmas || [])];

            const groups = {};
            HUNTSMAN_STEPS.forEach(step => groups[step.key] = []);

            allRmas.forEach(rma => {
                const status = rma.huntsmanRepairStatus;
                if (status && groups[status]) {
                    groups[status].push(rma);
                }
            });

            setData(groups);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const chartData = HUNTSMAN_STEPS.map(step => ({
        name: step.name,
        value: data[step.key]?.length || 0,
        color: step.color
    }));

    const total = HUNTSMAN_STEPS.reduce((acc, step) => acc + (data[step.key]?.length || 0), 0);

    if (loading) {
        return (
            <div className="analytics-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <p>Analyzing Huntsman Status data...</p>
            </div>
        );
    }

    return (
        <div className="analytics-wrapper">
            <header className="analytics-header">
                <h1>Huntsman Status Analytics</h1>
                <button onClick={fetchAllData} className="btn-tool" style={{ padding: '0.5rem 1rem' }}>
                    Refresh Data
                </button>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="label">Total Tracked</span>
                    <span className="value">{total}</span>
                </div>
                {HUNTSMAN_STEPS.map(step => (
                    <div key={step.key} className="stat-card" style={{ borderTop: `4px solid ${step.color}` }}>
                        <span className="label" style={{ fontSize: '0.8rem' }}>{step.name}</span>
                        <span className="value" style={{ color: step.color }}>{data[step.key]?.length || 0}</span>
                    </div>
                ))}
            </div>

            <div className="chart-section">
                <div className="chart-header">
                    <h2>Huntsman Status Distribution</h2>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData.filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={isMobile ? 70 : 100}
                                outerRadius={isMobile ? 110 : 160}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, value, percent }) =>
                                    (value > 0 && !isMobile) ? `${name} (${(percent * 100).toFixed(0)}%)` : null
                                }
                                labelLine={!isMobile}
                            >
                                {chartData.filter(d => d.value > 0).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={isMobile ? 240 : 80}
                                content={() => (
                                    <div className="custom-legend">
                                        {HUNTSMAN_STEPS.map((step) => (
                                            <div key={step.key} className="legend-item">
                                                <span className="legend-dot" style={{ backgroundColor: step.color }}></span>
                                                <span className="legend-text">{step.name} ({data[step.key]?.length || 0})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="sections-grid">
                {HUNTSMAN_STEPS.map(step => (
                    <div key={step.key} className="step-section" style={{ borderLeft: `8px solid ${step.color}` }}>
                        <div className="step-section-header" style={{ background: `${step.color}15`, color: step.color }}>
                            <h3 style={{ color: '#1e293b' }}>{step.name}</h3>
                            <span className="count-badge" style={{ background: `${step.color}25`, color: step.color }}>
                                {data[step.key]?.length || 0} RMAs
                            </span>
                        </div>
                        <div className="step-table-container">
                            <table className="step-table">
                                <thead>
                                    <tr>
                                        <th>RMA Number</th>
                                        <th>Model Name</th>
                                        <th>Serial Number</th>
                                        <th>Customer</th>
                                        <th>Date Lodged</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data[step.key]?.length > 0 ? (
                                        data[step.key].map(rma => (
                                            <tr key={rma.id}>
                                                <td style={{ fontWeight: '700' }}>{rma.rmaNumber}</td>
                                                <td>{rma.modelName}</td>
                                                <td>{rma.serialNumber}</td>
                                                <td>{rma.name}</td>
                                                <td>{(() => {
                                                    const dateVal = rma.createdAt;
                                                    if (!dateVal) return '-';
                                                    let date;
                                                    if (dateVal.seconds) date = new Date(dateVal.seconds * 1000);
                                                    else if (dateVal._seconds) date = new Date(dateVal._seconds * 1000);
                                                    else date = new Date(dateVal);
                                                    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                                                })()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                No RMAs currently in this status.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
