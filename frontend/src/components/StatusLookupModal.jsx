import React from 'react';

const StatusLookupModal = ({ rma, onClose, formatDate }) => {
    if (!rma) return null;

    const Section = ({ title, children }) => (
        <div className="grid-section">
            <span className="section-label">{title}</span>
            <div className="data-grid">
                {children}
            </div>
        </div>
    );

    const Field = ({ label, value }) => (
        <div className="data-item">
            <label>{label}</label>
            <div>{value || '-'}</div>
        </div>
    );

    return (
        <div className="modern-modal-overlay">
            <div className="modern-modal-container">
                <div className="modal-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: '700' }}>
                            RMA Summary: <span style={{ color: '#d30000' }}>{rma.rmaNumber}</span>
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>Case lodged on {formatDate(rma.createdAt)}</p>
                    </div>
                    <button onClick={onClose} className="modal-close-btn-public">&times;</button>
                </div>

                <div className="modal-body">
                    <Section title="Contact Info">
                        <Field label="Contact Person" value={rma.name} />
                        <Field label="Company" value={rma.companyName} />
                        <Field label="Email Address" value={rma.email} />
                        <Field label="Phone" value={rma.contactPhone} />
                        <Field label="Address" value={`${rma.address || ''}, ${rma.suburb || ''}, ${rma.state || ''} ${rma.postCode || ''}`} />
                        <Field label="Reference No" value={rma.customerReference} />
                    </Section>

                    <Section title="Product & Issue">
                        <Field label="Model Name" value={rma.modelName} />
                        <Field label="Serial Number" value={rma.serialNumber} />
                        <Field label="Fault Description" value={rma.faultDescription} />
                        <Field label="Repair Description" value={rma.repairDescription} />
                        <Field label="Package Contents" value={rma.contentsOfPackage} />
                    </Section>

                    <Section title="Email Sent Timestamps">
                        <Field label="Product Received" value={formatDate(rma.productReceivedEmailAt || (rma.productReceived ? rma.updatedAt : null))} />
                        <Field label="Investigation" value={formatDate(rma.investigationUnderwayEmailAt || (rma.investigationUnderway ? rma.updatedAt : null))} />
                        <Field label="In Progress" value={formatDate(rma.inProgressEmailAt || (rma.inProgress ? rma.updatedAt : null))} />
                        <Field label="Dispatched" value={formatDate(rma.dispatchedEmailAt || (rma.dispatched ? rma.updatedAt : null))} />
                    </Section>

                    <Section title="Logistics & Teams">
                        <Field label="Repair Status" value={rma.huntsmanRepairStatus} />
                        <Field label="Assigned Team" value={rma.assignedTo} />
                        <Field label="Tracking Number" value={rma.trackingNumber} />
                        <Field label="Dimensions" value={`${rma.length || '0'} x ${rma.width || '0'} x ${rma.height || '0'} cm (${rma.weight || '0'}kg)`} />
                    </Section>
                </div>

                <div className="modal-footer">
                    <button className="btn-close-public" onClick={onClose} style={{ padding: '0.6rem 1.5rem', background: '#334155', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>Close Details</button>
                </div>
            </div>
        </div>
    );
};

export default StatusLookupModal;
