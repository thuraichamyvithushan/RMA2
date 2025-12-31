import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import DashboardLayout from '../components/DashboardLayout';
import './StaffList.css';

const StaffList = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setStaff(data);
        } catch (err) {
            console.error('Fetch staff failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchStaff();
    }, [user]);

    const handleUpdateRole = async (uid, newRole) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${uid}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                fetchStaff(); // Refresh list
            } else {
                const err = await response.json();
                alert(err.error || 'Update failed');
            }
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const handleDeleteStaff = async (uid) => {
        if (!confirm("Are you sure you want to delete this staff member? This will remove their access permanently.")) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${uid}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchStaff(); // Refresh list
            } else {
                const err = await response.json();
                alert(err.error || 'Delete failed');
            }
        } catch (err) {
            alert('Failed to delete staff member');
        }
    };

    return (
        <DashboardLayout>
            <div className="staff-table-container">
                <div className="staff-table-header">
                    <h2>Staff Management</h2>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <p>Loading staff directories...</p>
                    </div>
                ) : (
                    <div className="staff-table-wrapper">
                        <table className="staff-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email Address</th>
                                    <th>Role</th>
                                    <th>Last Signed In</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map(member => (
                                    <tr key={member.id}>
                                        <td className="staff-name">{member.name || 'N/A'}</td>
                                        <td className="staff-email">{member.email}</td>
                                        <td>
                                            <span className={`role-badge ${member.role}`}>
                                                {member.role === 'admin' ? 'Admin' : 'Staff'}
                                            </span>
                                        </td>
                                        <td className="last-signin">
                                            {member.lastLogin ? new Date(member.lastLogin).toLocaleString() : 'Never'}
                                        </td>
                                        <td>
                                            <div className="staff-actions">
                                                <button
                                                    className="action-btn promote"
                                                    onClick={() => handleUpdateRole(member.id, member.role === 'admin' ? 'staff' : 'admin')}
                                                    title={member.role === 'admin' ? 'Demote to Staff' : 'Promote to Admin'}
                                                >
                                                    {member.role === 'admin' ? '👤' : '🛡️'}
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeleteStaff(member.id)}
                                                    title="Delete User"
                                                    disabled={member.email === user.email}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {staff.length === 0 && (
                            <div className="no-data-msg">
                                <p>No staff members found in the directory.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StaffList;
