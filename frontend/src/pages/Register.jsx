import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import './AuthPages.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            await updateProfile(userCredential.user, { displayName: name });

            // Sync with backend (optional but good practice)
            const token = await userCredential.user.getIdToken();
            await fetch(`${API_BASE_URL}/api/auth/sync`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            navigate('/dashboard');
        } catch (err) {
            setError(err.message.replace('Firebase:', '').trim());
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
               <h2>Sign Up  </h2>
                <p>Hello! Let's join with us.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter your name" autoComplete="name" />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="staff@example.com" autoComplete="email" />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" autoComplete="new-password" />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                    <div className="auth-links">
                        <Link to="/login">Already have an account? Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
