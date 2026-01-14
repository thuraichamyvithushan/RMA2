import React, { useState } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    const { user, role, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <div className="nav-left">
                    <Link to="/dashboard" className="nav-logo-link" onClick={closeMenu}>
                        <img src="/assets/topbanner.png" alt="Logo" className="nav-logo" />
                    </Link>
                </div>

                <div className="hamburger" onClick={toggleMenu}>
                    <span className={isMenuOpen ? 'bar active' : 'bar'}></span>
                    <span className={isMenuOpen ? 'bar active' : 'bar'}></span>
                    <span className={isMenuOpen ? 'bar active' : 'bar'}></span>
                </div>

                <div className={`nav-right ${isMenuOpen ? 'open' : ''}`}>
                    <div className="nav-links">
                        {user && (role === 'admin' || role === 'representative') && (
                            <Link to="/dashboard/analytics" className="nav-link" onClick={closeMenu}>Analytics</Link>
                        )}
                        {user && (role === 'admin' || role === 'representative') && (
                            <Link to="/dashboard/email-analytics" className="nav-link" onClick={closeMenu}>Email Summary</Link>
                        )}
                        {user && (role === 'admin' || role === 'representative') && (
                            <Link to="/dashboard/huntsman-analytics" className="nav-link" onClick={closeMenu}>Huntsman Status</Link>
                        )}
                        {user && role === 'admin' && (
                            <Link to="/dashboard/staff-list" className="nav-link" onClick={closeMenu}>Staff List</Link>
                        )}
                    </div>
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
                                    <li onClick={() => { navigate('/profile'); setShowProfileMenu(false); closeMenu(); }}>Edit Profile</li>
                                    <li onClick={() => { navigate('/forgot-password'); setShowProfileMenu(false); closeMenu(); }}>Reset Password</li>
                                    <li className="logout-item" onClick={handleLogout}>Logout</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="dashboard-content">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
