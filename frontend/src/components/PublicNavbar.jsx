import React from 'react';
import { useNavigate } from 'react-router-dom';

const PublicNavbar = () => {
    const navigate = useNavigate();

    return (
        <div className="public-navbar">
            <div className="navbar-content" style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '100%', paddingLeft: '2%' }}>
                <div className="navbar-brand-group" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
                    <img
                        src="/assets/topbanner.png"
                        alt="Huntsman Optics"
                        style={{ height: '40px', width: 'auto' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PublicNavbar;
