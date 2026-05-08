import React, { useState, useEffect } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import StatusResult from '../components/StatusResult';
import StatusLookupModal from '../components/StatusLookupModal';
import { API_BASE_URL } from '../config';
import './CheckRMA.css';

const CheckRMA = () => {
    const [searchEmail, setSearchEmail] = useState('');
    const [searchIdentifier, setSearchIdentifier] = useState('');
    const [status, setStatus] = useState({ loading: false, error: null });
    const [lookupResult, setLookupResult] = useState(null);
    const [showLookupModal, setShowLookupModal] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!searchEmail || !searchIdentifier) return;

        setStatus({ loading: true, error: null });
        setLookupResult(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/rma/lookup?email=${encodeURIComponent(searchEmail)}&identifier=${encodeURIComponent(searchIdentifier)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Lookup failed');
            setLookupResult(data);
            setStatus({ loading: false, error: null });
        } catch (err) {
            setStatus({ loading: false, error: err.message });
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
            return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
        } catch (e) {
            return '-';
        }
    };

    return (
        <div className="check-rma-wrapper">
            <PublicNavbar />

            <div className="check-rma-container">
                <div className="check-rma-hero">
                    <div className="hero-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>
                    <h1 className="check-rma-title">Track Your Booking</h1>
                    <p className="check-rma-subtitle">Enter your Booking number or Serial number and email address to view the current status of your return request</p>
                </div>

                <div className="check-rma-form-card">
                    <form onSubmit={handleLookup} className="check-rma-form">
                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor="identifier">Booking Number or Serial Number</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                    </svg>
                                    <input
                                        id="identifier"
                                        type="text"
                                        value={searchIdentifier}
                                        onChange={(e) => setSearchIdentifier(e.target.value)}
                                        placeholder="e.g., BKN-20240101-1234 or SN12345678"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                    </svg>
                                    <input
                                        id="email"
                                        type="email"
                                        value={searchEmail}
                                        onChange={(e) => setSearchEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {status.error && (
                            <div className="error-message">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                {status.error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={status.loading}
                        >
                            {status.loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                    Find My Booking
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Results Modal */}
            {lookupResult && (
                <div className="results-modal-overlay" onClick={() => setLookupResult(null)}>
                    <div className="results-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="results-modal-header">
                            <h2>Booking Details</h2>
                            <button className="modal-close-btn" onClick={() => setLookupResult(null)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="results-modal-body">
                            <StatusResult result={lookupResult} onViewDetails={() => setShowLookupModal(true)} formatDate={formatDate} />
                        </div>
                    </div>
                </div>
            )}

            {showLookupModal && <StatusLookupModal rma={lookupResult} onClose={() => setShowLookupModal(false)} formatDate={formatDate} />}
        </div>
    );
};

export default CheckRMA;
