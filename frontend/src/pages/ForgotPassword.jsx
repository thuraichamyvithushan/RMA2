import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const ForgotPassword = () => {
    const { user, resetPassword } = useAuth();
    const [email, setEmail] = useState(user?.email || '');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        try {
            await resetPassword(email);
            setMessage('Check your inbox for further instructions');
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your registered email"
                            autoComplete="email"
                            disabled={!!user}
                        />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    {message && <p className="auth-success">{message}</p>}
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Processing...' : 'Send Reset Email'}
                    </button>
                    <div className="auth-links">
                        {user ? (
                            <button
                                type="button"
                                className="link-btn"
                                onClick={() => navigate(-1)}
                                style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: 0, font: 'inherit' }}
                            >
                                Go Back
                            </button>
                        ) : (
                            <Link to="/login">Back to Login</Link>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
