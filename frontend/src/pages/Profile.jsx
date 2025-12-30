import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

const Profile = () => {
    const { user, updateUserDetails } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await updateUserDetails(displayName);
            setMessage('Profile updated successfully');
        } catch (err) {
            setMessage('Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="form-container">
                <h2>Edit Profile</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            autoComplete="name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email (Cannot be changed)</label>
                        <input type="email" value={user?.email} disabled autoComplete="email" />
                    </div>
                    {message && <p className={message.includes('Error') ? 'error-msg' : 'success-msg'}>{message}</p>}
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
