import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import '../styles/main.css';
import './AdminDashboard.css';

const ASSIGNED_TO_OPTIONS = [
    "Technical Team", "Repair Department", "Quality Control", "Spare Parts Team", "Dispatch Team", "Customer Service", "Management"
];

const REPAIR_STATUS_OPTIONS = [
    "Awaiting Assessment", "Under Investigation", "Repair In Progress", "Awaiting Spare Parts", "Quality Check", "Ready for Dispatch", "Completed", "On Hold"
];

const SPARE_PARTS_UPDATE_OPTIONS = [
    "N/A", "Awaiting Quote", "Spare Parts Ordered", "Spare Parts Received", "Part in Transit", "Part Installed"
];

const STATE_OPTIONS = [
    "NSW", "Victoria", "Western Australia", "South Australia", "Tasmania",
    "Northern Territory", "Queensland", "Australian Capital Territory", "External Territories"
];

export default function AdminDashboard() {
    const [activeRmas, setActiveRmas] = useState([]);
    const [archivedRmas, setArchivedRmas] = useState([]);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [selectedRMA, setSelectedRMA] = useState(null);
    const { user, role } = useAuth();
    const isRepresentative = role === 'representative';
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/rmas/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Export response error:', response.status, errorData);
                throw new Error(errorData.error || errorData.message || `Server responded with ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rmas_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error details:', err);
            alert('Export failed: ' + err.message);
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/rmas/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Import failed');

            alert(result.message);
            fetchRMAs(); // Refresh data
        } catch (err) {
            console.error('Import error:', err);
            alert('Import failed: ' + err.message);
        } finally {
            setLoading(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const handleDeleteAll = async () => {
        if (isRepresentative) return;

        const tabName = activeTab === 'active' ? 'ACTIVE' : 'ARCHIVED';
        const msg = `⚠️ WARNING: This will PERMANENTLY delete ALL ${tabName} records! \n\nAre you sure you want to proceed?`;

        if (!window.confirm(msg)) return;

        const confirmText = window.prompt(`Type "DELETE" to confirm the mass deletion of all ${tabName} records:`);
        if (confirmText !== 'DELETE') {
            alert('Deletion cancelled. Confirmation text did not match.');
            return;
        }

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/rmas/all?archived=${activeTab === 'archived'}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Bulk delete failed');

            alert(result.message);
            fetchRMAs();
        } catch (err) {
            console.error('Bulk delete error:', err);
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchRMAs = async () => {
        if (!user) return;

        // Representatives should only see records when searching
        if (isRepresentative && !search.trim()) {
            setActiveRmas([]);
            setArchivedRmas([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const [activeRes, archivedRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/admin/rmas?page=${page}&search=${search}&archived=false`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/admin/rmas?page=${page}&search=${search}&archived=true`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const [activeData, archivedData] = await Promise.all([
                activeRes.json(),
                archivedRes.json()
            ]);

            setActiveRmas(activeData.rmas || []);
            setArchivedRmas(archivedData.rmas || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delay = setTimeout(fetchRMAs, 300);
        return () => clearTimeout(delay);
    }, [search, page, activeTab]);

    const handleUpdateStatus = async (id, step) => {
        const currentRMA = activeRmas.find(r => r.id === id) || archivedRmas.find(r => r.id === id);
        if (!currentRMA) return;

        const stepsLogic = {
            productReceived: { name: "Product Received", prereq: null },
            investigationUnderway: { name: "Investigation Underway", prereq: "productReceived" },
            inProgress: { name: "Update on Product", prereq: "investigationUnderway" },
            dispatched: { name: "Dispatched", prereq: "inProgress" }
        };

        const thisStep = stepsLogic[step];
        if (thisStep && thisStep.prereq && !currentRMA[thisStep.prereq]) {
            alert(`Hold on — you can’t send “${thisStep.name} Email” until “${stepsLogic[thisStep.prereq].name} Email” is sent.`);
            return;
        }

        if (!confirm(`Send "${thisStep.name}" email to ${currentRMA.email}?`)) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/admin/rmas/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ step, value: true })
            });

            const data = await res.json();
            if (res.ok) {
                setActiveRmas(activeRmas.map(r => r.id === id ? data : r));
            } else {
                alert(data.error || 'Update failed');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const handleInlineUpdate = async (id, field, value) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/admin/rmas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ [field]: value })
            });

            if (res.ok) {
                const data = await res.json();
                setActiveRmas(activeRmas.map(r => r.id === id ? data : r));
                setArchivedRmas(archivedRmas.map(r => r.id === id ? data : r));
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    };

    const handleSparePartsChange = async (rmaId, newValue) => {
        const success = await handleInlineUpdate(rmaId, 'sparePartsUpdate', newValue);
        if (success) {
            const now = new Date().toISOString();
            if (newValue === "Spare Parts Ordered") {
                await handleInlineUpdate(rmaId, 'sparePartOrdered', now);
            } else if (newValue === "Spare Parts Received") {
                await handleInlineUpdate(rmaId, 'sparePartReceived', now);
            }
        }
    };

    const handleDeleteRMA = async (id, rmaNumber) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete RMA ${rmaNumber}?`)) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/admin/rmas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                setActiveRmas(activeRmas.filter(r => r.id !== id));
                setArchivedRmas(archivedRmas.filter(r => r.id !== id));
            } else {
                const data = await res.json();
                alert(`Delete failed: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            alert(`Network error: ${err.message}`);
        }
    };

    const handleArchiveRMA = async (id, rmaNumber) => {
        if (!confirm(`Are you sure you want to archive RMA ${rmaNumber}?`)) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/admin/rmas/${id}/archive`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                // Move from active to archived
                const archivedRma = activeRmas.find(r => r.id === id);
                if (archivedRma) {
                    setActiveRmas(activeRmas.filter(r => r.id !== id));
                    setArchivedRmas([{ ...archivedRma, ...data }, ...archivedRmas]);
                }
            } else {
                const data = await res.json();
                alert(`Archive failed: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            alert(`Network error: ${err.message}`);
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return '-';
        try {
            let date;
            if (dateValue._seconds !== undefined) {
                date = new Date(dateValue._seconds * 1000);
            } else if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
                date = dateValue.toDate();
            } else {
                date = new Date(dateValue);
            }
            return isNaN(date.getTime()) ? '-' : date.toLocaleString();
        } catch (e) {
            return '-';
        }
    };

    const safeFormatForInput = (dateValue) => {
        if (!dateValue) return '';
        try {
            let date;
            if (dateValue._seconds !== undefined) {
                date = new Date(dateValue._seconds * 1000);
            } else if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
                date = dateValue.toDate();
            } else {
                date = new Date(dateValue);
            }
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const getStatusPill = (rma) => {
        if (rma.dispatched) return <span className="status-pill status-completed">Dispatched</span>;
        if (rma.inProgress) return <span className="status-pill status-active">In Progress</span>;
        if (rma.investigationUnderway) return <span className="status-pill status-investigating">Investigating</span>;
        if (rma.productReceived) return <span className="status-pill status-received">Received</span>;
        return <span className="status-pill status-pending">Pending</span>;
    };

    const TableInput = ({ rmaId, field, value, type = 'text', width = '200px' }) => {
        const [localValue, setLocalValue] = useState(value || '');
        const [isSaving, setIsSaving] = useState(false);

        useEffect(() => { setLocalValue(value || ''); }, [value]);

        const onBlur = async () => {
            let valToSave = type === 'date' ? localValue : localValue.toString().trim();
            if (valToSave === (value || '')) return;
            if (isRepresentative) return;
            setIsSaving(true);
            const success = await handleInlineUpdate(rmaId, field, valToSave);
            setIsSaving(false);
            if (!success) setLocalValue(value || '');
        };

        return (
            <input
                type={type}
                value={type === 'date' ? safeFormatForInput(localValue) : localValue}
                onChange={e => setLocalValue(e.target.value)}
                onBlur={onBlur}
                disabled={isSaving || isRepresentative || activeTab === 'archived'}
                className="modern-inline-input"
                style={{ width }}
            />
        );
    };

    const DetailsModal = ({ rma, onClose }) => {
        if (!rma) return null;

        const Section = ({ title, children }) => (
            <div className="grid-section">
                <span className="section-label">{title}</span>
                <div className="data-grid">
                    {children}
                </div>
            </div>
        );

        const Field = ({ label, value }) => (
            <div className="data-item">
                <label>{label}</label>
                <div>{value || '-'}</div>
            </div>
        );

        return (
            <div className="modern-modal-overlay">
                <div className="modern-modal-container">
                    <div className="modal-header">
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: '700' }}>
                                RMA Summary: <span style={{ color: '#ef4444' }}>{rma.rmaNumber}</span>
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>Case lodged on {formatDate(rma.createdAt)}</p>
                        </div>
                        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>&times;</button>
                    </div>

                    <div className="modal-body">
                        <Section title="Contact Info">
                            <Field label="Contact Person" value={rma.name} />
                            <Field label="Company" value={rma.companyName} />
                            <Field label="Email Address" value={rma.email} />
                            <Field label="Phone" value={rma.contactPhone} />
                            <Field label="Address" value={`${rma.address || ''}, ${rma.suburb || ''}, ${rma.state || ''} ${rma.postCode || ''}`} />
                            <Field label="Reference No" value={rma.customerReference} />
                        </Section>

                        <Section title="Product & Issue">
                            <Field label="Model Name" value={rma.modelName} />
                            <Field label="Serial Number" value={rma.serialNumber} />
                            <Field label="Fault Description" value={rma.faultDescription} />
                            <Field label="Repair Description" value={rma.repairDescription} />
                            <Field label="Package Contents" value={rma.contentsOfPackage} />
                        </Section>

                        <Section title="Email Sent Timestamps">
                            <Field label="Product Received" value={formatDate(rma.productReceivedEmailAt)} />
                            <Field label="Investigation" value={formatDate(rma.investigationUnderwayEmailAt)} />
                            <Field label="Product Update" value={formatDate(rma.inProgressEmailAt)} />
                            <Field label="Dispatched" value={formatDate(rma.dispatchedEmailAt)} />
                        </Section>

                        <Section title="Logistics & Teams">
                            <Field label="Repair Status" value={rma.huntsmanRepairStatus} />
                            <Field label="Assigned Team" value={rma.assignedTo} />
                            <Field label="Tracking Number" value={rma.trackingNumber} />
                            <Field label="Dimensions" value={`${rma.length || '0'} x ${rma.width || '0'} x ${rma.height || '0'} cm (${rma.weight || '0'}kg)`} />
                        </Section>
                    </div>

                    <div className="modal-footer">
                        <button className="btn" onClick={onClose} style={{ padding: '0.6rem 1.5rem', background: '#334155', color: 'white', borderRadius: '0', fontWeight: '600' }}>Close Details</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-dashboard-wrapper">
            {selectedRMA && <DetailsModal rma={selectedRMA} onClose={() => setSelectedRMA(null)} />}

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".csv"
                onChange={handleImport}
            />

            <header className="dashboard-header">
                <div className="dashboard-title-area">
                    <h1>RMA Inventory Management</h1>
                </div>
                {!isRepresentative && (
                    <div className="admin-tools">
                        <button onClick={handleExport} className="btn-tool btn-export" title="Export to CSV">
                            <span>📤</span> Export
                        </button>
                        <button onClick={handleImportClick} className="btn-tool btn-import" title="Import from CSV">
                            <span>📥</span> Import
                        </button>
                        <button onClick={handleDeleteAll} className="btn-tool btn-delete-all" title="Delete All (Current Tab)">
                            <span>🗑️</span> Delete All
                        </button>
                    </div>
                )}
                <div className="search-container">
                    <input
                        placeholder="Search by RMA No, Serial, Email or Name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="modern-search-input"
                    />
                </div>
            </header>

            <div className="dashboard-tabs">
                <button
                    className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active RMAs ({activeRmas.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
                    onClick={() => setActiveTab('archived')}
                >
                    Archived RMAs ({archivedRmas.length})
                </button>
            </div>

            <div className="modern-card">
                <div className="table-responsive" style={{ maxHeight: '82vh' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '150px' }}>Date Lodged</th>
                                <th style={{ minWidth: '130px' }}>Status</th>
                                <th style={{ minWidth: '150px' }}>RMA Number</th>
                                <th style={{ minWidth: '180px' }}>Model Name</th>
                                <th style={{ minWidth: '200px' }}>Customer / Company</th>
                                <th style={{ minWidth: '120px' }}>Reference</th>
                                <th style={{ minWidth: '200px' }}>Email Address</th>
                                <th style={{ minWidth: '130px' }}>Contact Phone</th>
                                <th style={{ minWidth: '220px' }}>Address</th>
                                <th style={{ minWidth: '120px' }}>Suburb</th>
                                <th style={{ minWidth: '80px' }}>State</th>
                                <th style={{ minWidth: '100px' }}>Post Code</th>
                                <th style={{ minWidth: '160px' }}>Assign Team</th>
                                <th style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>Product Received</th>
                                <th style={{ minWidth: '250px' }}>Fault Description</th>
                                <th style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>investigation Underway</th>
                                <th style={{ minWidth: '180px' }}>Huntsman Status</th>
                                <th style={{ minWidth: '150px' }}>Serial Number</th>
                                <th style={{ minWidth: '250px' }}>Repair Notes</th>
                                <th style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>Update on product</th>
                                <th style={{ minWidth: '150px' }}>Spare Parts</th>
                                <th style={{ minWidth: '150px' }}>Return Date</th>
                                <th style={{ minWidth: '160px' }}>Tracking No</th>
                                <th style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>product Dispatch</th>
                                <th style={{ minWidth: '150px' }}>Received</th>
                                <th style={{ minWidth: '150px' }}>Service Start</th>
                                <th style={{ minWidth: '150px' }}>Investigation</th>
                                <th style={{ minWidth: '150px' }}>Update Sent</th>
                                <th style={{ minWidth: '150px' }}>Part Ordered</th>
                                <th style={{ minWidth: '150px' }}>Part Received</th>
                                <th style={{ minWidth: '100px' }}>Label Req?</th>
                                <th style={{ minWidth: '250px' }}>Package Contents</th>
                                <th style={{ minWidth: '80px' }}>Weight</th>
                                <th style={{ minWidth: '80px' }}>L (cm)</th>
                                <th style={{ minWidth: '80px' }}>W (cm)</th>
                                <th style={{ minWidth: '80px' }}>H (cm)</th>
                                <th style={{ padding: '0 1rem', position: 'sticky', right: 0, background: '#f8fafc', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="37" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Syncing data...</td></tr>
                            ) : (activeTab === 'active' ? activeRmas : archivedRmas).length === 0 ? (
                                <tr>
                                    <td colSpan="37" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                                        {isRepresentative && !search.trim()
                                            ? "Please enter a search term to view RMA records."
                                            : "No records found matching your search."
                                        }
                                    </td>
                                </tr>
                            ) : (activeTab === 'active' ? activeRmas : archivedRmas).map(rma => {
                                let rowClass = "";
                                if (rma.dispatched) rowClass = "row-dispatched";
                                else if (rma.inProgress) rowClass = "row-progress";
                                else if (rma.investigationUnderway) rowClass = "row-investigation";
                                else if (rma.productReceived) rowClass = "row-received";

                                return (
                                    <tr key={rma.id} className={rowClass}>
                                        <td>{formatDate(rma.createdAt)}</td>
                                        <td>{getStatusPill(rma)}</td>
                                        <td style={{ fontWeight: '700', color: '#0f172a' }}>{rma.rmaNumber}</td>
                                        <td><TableInput rmaId={rma.id} field="modelName" value={rma.modelName} width="160px" /></td>
                                        <td style={{ cursor: 'help' }} title={rma.companyName}>
                                            <div style={{ fontWeight: '600' }}>{rma.name}</div>
                                            {rma.companyName && <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>{rma.companyName}</div>}
                                        </td>
                                        <td><TableInput rmaId={rma.id} field="customerReference" value={rma.customerReference} width="100px" /></td>
                                        <td><TableInput rmaId={rma.id} field="email" value={rma.email} type="email" width="200px" /></td>
                                        <td><TableInput rmaId={rma.id} field="contactPhone" value={rma.contactPhone} width="120px" /></td>
                                        <td><TableInput rmaId={rma.id} field="address" value={rma.address} width="240px" /></td>
                                        <td><TableInput rmaId={rma.id} field="suburb" value={rma.suburb} width="120px" /></td>
                                        <td>
                                            <select
                                                value={rma.state || ''}
                                                onChange={e => handleInlineUpdate(rma.id, 'state', e.target.value)}
                                                disabled={isRepresentative || activeTab === 'archived'}
                                                className="modern-select"
                                                style={{ width: '120px' }}
                                            >
                                                <option value="">Select State</option>
                                                {STATE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td><TableInput rmaId={rma.id} field="postCode" value={rma.postCode} width="90px" /></td>
                                        <td>
                                            <select
                                                value={rma.assignedTo || ''}
                                                onChange={e => handleInlineUpdate(rma.id, 'assignedTo', e.target.value)}
                                                disabled={isRepresentative || activeTab === 'archived'}
                                                className="modern-select"
                                                style={{ width: '150px' }}
                                            >
                                                <option value="">None</option>
                                                {ASSIGNED_TO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input type="checkbox" checked={!!rma.productReceived} onChange={() => handleUpdateStatus(rma.id, 'productReceived')} disabled={!!rma.productReceived || isRepresentative || activeTab === 'archived'} className="modern-checkbox" />
                                        </td>
                                        <td><TableInput rmaId={rma.id} field="faultDescription" value={rma.faultDescription} width="250px" /></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input type="checkbox" checked={!!rma.investigationUnderway} onChange={() => handleUpdateStatus(rma.id, 'investigationUnderway')} disabled={!!rma.investigationUnderway || !rma.productReceived || isRepresentative || activeTab === 'archived'} className="modern-checkbox" />
                                        </td>
                                        <td>
                                            <select
                                                value={rma.huntsmanRepairStatus || ''}
                                                onChange={e => handleInlineUpdate(rma.id, 'huntsmanRepairStatus', e.target.value)}
                                                disabled={isRepresentative || activeTab === 'archived'}
                                                className="modern-select"
                                                style={{ width: '160px' }}
                                            >
                                                <option value="">None</option>
                                                {REPAIR_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </td>
                                        <td><TableInput rmaId={rma.id} field="serialNumber" value={rma.serialNumber} width="140px" /></td>
                                        <td><TableInput rmaId={rma.id} field="repairDescription" value={rma.repairDescription} width="250px" /></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input type="checkbox" checked={!!rma.inProgress} onChange={() => handleUpdateStatus(rma.id, 'inProgress')} disabled={!!rma.inProgress || !rma.investigationUnderway || isRepresentative || activeTab === 'archived'} className="modern-checkbox" />
                                        </td>
                                        <td>
                                            <select
                                                value={rma.sparePartsUpdate || ''}
                                                onChange={e => handleSparePartsChange(rma.id, e.target.value)}
                                                disabled={isRepresentative || activeTab === 'archived'}
                                                className="modern-select"
                                                style={{ width: '140px' }}
                                            >
                                                {SPARE_PARTS_UPDATE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </td>
                                        <td><TableInput rmaId={rma.id} field="completeDateOfReturn" value={rma.completeDateOfReturn} type="date" width="130px" /></td>
                                        <td><TableInput rmaId={rma.id} field="trackingNumber" value={rma.trackingNumber} width="150px" /></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input type="checkbox" checked={!!rma.dispatched} onChange={() => handleUpdateStatus(rma.id, 'dispatched')} disabled={!!rma.dispatched || !rma.inProgress || isRepresentative || activeTab === 'archived'} className="modern-checkbox" />
                                        </td>
                                        <td>{formatDate(rma.productReceivedEmailAt)}</td>
                                        <td><TableInput rmaId={rma.id} field="startedServiceDate" value={rma.startedServiceDate} type="date" width="130px" /></td>
                                        <td><TableInput rmaId={rma.id} field="investigationUnderwayEmailAt" value={rma.investigationUnderwayEmailAt} type="date" width="130px" /></td>
                                        <td><TableInput rmaId={rma.id} field="inProgressEmailAt" value={rma.inProgressEmailAt} type="date" width="130px" /></td>
                                        <td><TableInput rmaId={rma.id} field="sparePartOrdered" value={rma.sparePartOrdered} type="date" width="130px" /></td>
                                        <td><TableInput rmaId={rma.id} field="sparePartReceived" value={rma.sparePartReceived} type="date" width="130px" /></td>
                                        <td>
                                            <select
                                                value={rma.requireLabel || 'No'}
                                                onChange={e => handleInlineUpdate(rma.id, 'requireLabel', e.target.value)}
                                                disabled={isRepresentative || activeTab === 'archived'}
                                                className="modern-select"
                                                style={{ width: '80px' }}
                                            >
                                                <option value="No">No</option><option value="Yes">Yes</option>
                                            </select>
                                        </td>
                                        <td><TableInput rmaId={rma.id} field="contentsOfPackage" value={rma.contentsOfPackage} width="250px" /></td>
                                        <td><TableInput rmaId={rma.id} field="weight" value={rma.weight} width="70px" /></td>
                                        <td><TableInput rmaId={rma.id} field="length" value={rma.length} width="70px" /></td>
                                        <td><TableInput rmaId={rma.id} field="width" value={rma.width} width="70px" /></td>
                                        <td><TableInput rmaId={rma.id} field="height" value={rma.height} width="70px" /></td>
                                        <td style={{ position: 'sticky', right: 0, background: '#ffffff', boxShadow: '-2px 0 5px rgba(0,0,0,0.02)' }}>
                                            <div className="action-group">
                                                <button onClick={() => setSelectedRMA(rma)} className="btn-action btn-view" title="View Details">
                                                    <span className="btn-icon">👁️</span>
                                                    <span className="btn-text">View</span>
                                                </button>
                                                {!isRepresentative && activeTab === 'active' && (
                                                    <button onClick={() => handleArchiveRMA(rma.id, rma.rmaNumber)} className="btn-action btn-archive" title="Archive Case">
                                                        <span className="btn-icon">📦</span>
                                                        <span className="btn-text">Archive</span>
                                                    </button>
                                                )}
                                                {!isRepresentative && (
                                                    <button onClick={() => handleDeleteRMA(rma.id, rma.rmaNumber)} className="btn-action btn-remove" title="Delete RMA">
                                                        <span className="btn-icon">🗑️</span>
                                                        <span className="btn-text">Remove</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <footer style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                <div>Total Active: <strong>{activeRmas.length}</strong> | Total Archived: <strong>{archivedRmas.length}</strong></div>
                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                    <span>Page {page}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={(activeTab === 'active' ? activeRmas : archivedRmas).length < 20}>Next</button>
                </div>
            </footer>
        </div>
    );
}
