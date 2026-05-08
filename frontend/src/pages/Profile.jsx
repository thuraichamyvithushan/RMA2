import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import './Profile.css';

const Profile = () => {
    const { user, role, updateUserDetails } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);
        try {
            await updateUserDetails(displayName);
            setMessage('Your profile has been updated successfully.');
            setIsError(false);
        } catch (err) {
            setMessage('Failed to update profile. Please try again.');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="profile-page-container">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2>{user?.displayName || 'User Profile'}</h2>
                        <p>{role?.charAt(0).toUpperCase() + role?.slice(1)} Account</p>
                    </div>

                    <div className="profile-body">
                        <form onSubmit={handleSubmit} className="profile-form-grid">
                            <div className="profile-field-group">
                                <label>Display Name</label>
                                <div className="profile-input-wrapper">
                                    <input
                                        className="profile-input"
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Enter your name"
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            <div className="profile-field-group">
                                <label>Email Address</label>
                                <div className="profile-input-wrapper">
                                    <input
                                        className="profile-input"
                                        type="email"
                                        value={user?.email}
                                        disabled
                                        autoComplete="email"
                                    />
                                    <span className="profile-info-badge">LOCKED</span>
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button type="submit" className="profile-submit-btn" disabled={loading}>
                                    {loading ? 'Saving Changes...' : 'Update Profile'}
                                </button>
                            </div>
                        </form>

                        {message && (
                            <div className={`notification-area ${isError ? 'notification-error' : 'notification-success'}`}>
                                <span>{isError ? '⚠️' : '✓'}</span>
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
