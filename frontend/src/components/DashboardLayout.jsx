import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    const { user, role, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <div className="nav-left">
                    <Link to="/dashboard" className="nav-logo-link">
                        <img src="/assets/topbanner.png" alt="Logo" className="nav-logo" />
                    </Link>
                </div>

                <div className="nav-right">
                    {user && role === 'admin' && (
                        <button className="nav-item-btn" onClick={() => navigate('/staff')}>Staff List</button>
                    )}
                    <div className="profile-wrapper">
                        <button
                            className="profile-trigger"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            <div className="avatar">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </button>

                        {showProfileMenu && (
                            <div className="profile-dropdown">
                                <div className="dropdown-header">
                                    <p className="user-email">{user?.email}</p>
                                </div>
                                <ul className="dropdown-list">
                                    <li onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>Edit Profile</li>
                                    <li onClick={() => { navigate('/forgot-password'); setShowProfileMenu(false); }}>Reset Password</li>
                                    <li className="logout-item" onClick={handleLogout}>Logout</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="dashboard-content">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
