import React, { useState } from 'react';

const PublicNavbar = ({ onLookup, loading }) => {
    const [searchEmail, setSearchEmail] = useState('');
    const [searchRmaNumber, setSearchRmaNumber] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLookup(searchEmail, searchRmaNumber);
    };

    return (
        <div className="public-navbar">
            <div className="navbar-content">
                <div className="navbar-brand-group">
                    <div className="navbar-brand">
                        <span className="brand-dot"></span>
                        TRACK RMA
                    </div>
                    <div className="navbar-guidance">Enter your RMA number & email to see your status</div>
                </div>
                <form onSubmit={handleSubmit} className="navbar-search-form">
                    <input
                        placeholder="RMA Number"
                        value={searchRmaNumber}
                        onChange={(e) => setSearchRmaNumber(e.target.value)}
                        className="nav-search-input"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="nav-search-input"
                        required
                    />
                    <button type="submit" className="nav-search-btn" disabled={loading}>
                        {loading ? 'Searching...' : 'Find Status'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PublicNavbar;
