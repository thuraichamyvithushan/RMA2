import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './EmailAnalytics.css';

const EMAIL_STEPS = [
    { name: 'Received Email', key: 'productReceivedEmailAt', color: '#eab308' },
    { name: 'Investigation Email', key: 'investigationUnderwayEmailAt', color: '#f97316' },
    { name: 'In Progress Email', key: 'inProgressEmailAt', color: '#ef4444' },
    { name: 'Dispatch Email', key: 'dispatchedEmailAt', color: '#22c55e' }
];

export default function EmailAnalytics() {
    const [emailData, setEmailData] = useState({
        productReceivedEmailAt: [],
        investigationUnderwayEmailAt: [],
        inProgressEmailAt: [],
        dispatchedEmailAt: []
    });
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { user } = useAuth();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchEmailRecords = async () => {
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

            const groupedEmails = {
                productReceivedEmailAt: [],
                investigationUnderwayEmailAt: [],
                inProgressEmailAt: [],
                dispatchedEmailAt: []
            };

            allRmas.forEach(rma => {
                if (rma.productReceivedEmailAt) groupedEmails.productReceivedEmailAt.push(rma);
                if (rma.investigationUnderwayEmailAt) groupedEmails.investigationUnderwayEmailAt.push(rma);
                if (rma.inProgressEmailAt) groupedEmails.inProgressEmailAt.push(rma);
                if (rma.dispatchedEmailAt) groupedEmails.dispatchedEmailAt.push(rma);
            });

            setEmailData(groupedEmails);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmailRecords();
    }, [user]);

    const chartData = EMAIL_STEPS.map(step => ({
        name: step.name,
        value: emailData[step.key]?.length || 0,
        color: step.color
    }));

    const totalSent = EMAIL_STEPS.reduce((acc, step) => acc + (emailData[step.key]?.length || 0), 0);

    const formatTimestamp = (ts) => {
        if (!ts) return '-';
        let date;
        if (ts.seconds) date = new Date(ts.seconds * 1000);
        else if (ts._seconds) date = new Date(ts._seconds * 1000);
        else date = new Date(ts);

        return isNaN(date.getTime()) ? '-' : date.toLocaleString('en-AU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    };

    if (loading) {
        return (
            <div className="email-analytics-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <p>Loading email records...</p>
            </div>
        );
    }

    return (
        <div className="email-analytics-wrapper">
            <header className="page-header">
                <h1>Email Completion Summary</h1>
                <button onClick={fetchEmailRecords} className="btn-refresh">
                    Refresh Records
                </button>
            </header>

            <div className="summary-stats">
                <div className="summary-card">
                    <span className="summary-label">Total Emails Sent</span>
                    <span className="summary-value">{totalSent}</span>
                </div>
                {EMAIL_STEPS.map(step => (
                    <div key={step.key} className="summary-card" style={{ borderTop: `4px solid ${step.color}` }}>
                        <span className="summary-label">{step.name}</span>
                        <span className="summary-value" style={{ color: step.color }}>{emailData[step.key]?.length || 0}</span>
                    </div>
                ))}
            </div>

            <div className="pie-chart-section">
                <h2>Email Distribution by Step</h2>
                <div className="pie-chart-container">
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
                            <Tooltip />
                            <Legend
                                verticalAlign="bottom"
                                height={isMobile ? 120 : 60}
                                content={() => (
                                    <div className="custom-legend">
                                        {EMAIL_STEPS.map((step) => (
                                            <div key={step.key} className="legend-item">
                                                <span className="legend-dot" style={{ backgroundColor: step.color }}></span>
                                                <span className="legend-text">{step.name} ({emailData[step.key]?.length || 0})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="email-tables-grid">
                {EMAIL_STEPS.map(step => (
                    <div key={step.key} className="email-table-section">
                        <div className="step-tag" style={{ backgroundColor: step.color }}>
                            {step.name}
                        </div>
                        <div className="table-responsive">
                            <table className="email-records-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Customer</th>
                                        <th>Product</th>
                                        <th>Email Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emailData[step.key]?.length > 0 ? (
                                        emailData[step.key].sort((a, b) => {
                                            const da = new Date(a[step.key]?.seconds ? a[step.key].seconds * 1000 : a[step.key]);
                                            const db = new Date(b[step.key]?.seconds ? b[step.key].seconds * 1000 : b[step.key]);
                                            return db - da;
                                        }).map(rma => (
                                            <tr key={`${rma.id}-${step.key}`}>
                                                <td className="time-col">{formatTimestamp(rma[step.key])}</td>
                                                <td>{rma.name}</td>
                                                <td>{rma.modelName}</td>
                                                <td className="email-col">{rma.email}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="empty-row">No emails sent for this step.</td>
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
