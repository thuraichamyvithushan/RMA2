import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="landing-wrapper">
            <PublicNavbar />

            <div className="landing-hero">
                <h1 className="hero-title">RMA Management Portal</h1>
                <p className="hero-subtitle">Streamlined warranty claims and returns for Huntsman Optics products</p>
            </div>

            <div className="landing-cards-container">
                <div className="landing-card submit-card" onClick={() => navigate('/submit-rma')}>
                    <div className="card-icon submit-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <h2 className="card-title">Submit RMA Request</h2>
                    <p className="card-description">Initiate a new warranty claim or return request. Complete the form with your product details and shipping information.</p>
                    <div className="card-action">
                        <span>Get Started</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </div>

                <div className="landing-card track-card" onClick={() => navigate('/check-rma')}>
                    <div className="card-icon track-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>
                    <h2 className="card-title">Track RMA Status</h2>
                    <p className="card-description">Check the progress of your existing RMA request. View real-time updates on your claim status and estimated completion.</p>
                    <div className="card-action">
                        <span>Track Now</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="landing-footer">
                <p>Secure RMA Management System • Huntsman Optics</p>
            </div>
        </div>
    );
};

export default LandingPage;
