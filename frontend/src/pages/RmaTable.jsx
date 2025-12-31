import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './RmaTable.css';

const RmaTable = () => {
    const [rmas, setRmas] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchRmas();
    }, []);

    const fetchRmas = async () => {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/rmas?search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setRmas(data.rmas || []);
        } catch (err) {
            console.error('Fetch RMAs failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchRmas();
    };

    const updateStatus = async (id, step, value) => {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/rmas/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ step, value })
            });
            if (response.ok) fetchRmas();
        } catch (err) {
            console.error('Update status failed', err);
        }
    };

    return (
        <div className="rma-table-wrapper">
            <div className="table-header-actions">
                <h2>RMA Management</h2>
                <form onSubmit={handleSearch} className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by name, email, serial..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>
            </div>

            <div className="horizontal-scroll-container">
                <table className="rma-data-table">
                    <thead>
                        <tr>
                            <th>Created At</th>
                            <th>Status Actions</th>
                            <th>Serial Number</th>
                            <th>Customer Name</th>
                            <th>Email</th>
                            <th>Model Name</th>
                            <th>Fault Description</th>
                            <th>Address</th>
                            <th>Tracking No</th>
                            <th>Repair Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rmas.map(rma => (
                            <tr key={rma.id}>
                                <td>{new Date(rma.createdAt).toLocaleDateString()}</td>
                                <td className="actions-cell">
                                    <div className="status-btns">
                                        <button
                                            className={rma.productReceived ? 'active' : ''}
                                            onClick={() => updateStatus(rma.id, 'productReceived', true)}
                                        >Recv</button>
                                        <button
                                            className={rma.investigationUnderway ? 'active' : ''}
                                            onClick={() => updateStatus(rma.id, 'investigationUnderway', true)}
                                        >Invst</button>
                                        <button
                                            className={rma.inProgress ? 'active' : ''}
                                            onClick={() => updateStatus(rma.id, 'inProgress', true)}
                                        >Prog</button>
                                        <button
                                            className={rma.dispatched ? 'active' : ''}
                                            onClick={() => updateStatus(rma.id, 'dispatched', true)}
                                        >Disp</button>
                                    </div>
                                </td>
                                <td className="bold">{rma.serialNumber}</td>
                                <td>{rma.name}</td>
                                <td>{rma.email}</td>
                                <td>{rma.modelName}</td>
                                <td className="truncate">{rma.faultDescription}</td>
                                <td>{`${rma.address}, ${rma.suburb}, ${rma.state} ${rma.postCode}`}</td>
                                <td>{rma.trackingNumber || '-'}</td>
                                <td className="truncate">{rma.repairDescription || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rmas.length === 0 && !loading && <p className="no-data">No RMA records found.</p>}
                {loading && <p className="loading-text">Loading...</p>}
            </div>
        </div>
    );
};

export default RmaTable;
