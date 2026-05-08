import React from 'react';

const StatusResult = ({ result, onViewDetails, formatDate }) => {
    if (!result) return null;

    const getStatusPill = (rma) => {
        if (rma.dispatched) return <span className="status-pill status-completed">Dispatched</span>;
        if (rma.inProgress) return <span className="status-pill status-active">In Progress</span>;
        if (rma.investigationUnderway) return <span className="status-pill status-investigating">Investigation</span>;
        if (rma.productReceived) return <span className="status-pill status-received">Received</span>;
        return <span className="status-pill status-pending">Yet to be actioned</span>;
    };

    // CheckIcon removed to use standard checkbox

    let rowClass = "";
    if (result.dispatched) rowClass = "row-dispatched";
    else if (result.inProgress) rowClass = "row-progress";
    else if (result.investigationUnderway) rowClass = "row-investigation";
    else if (result.productReceived) rowClass = "row-received";

    return (
        <div className="form-max-width" style={{ maxWidth: '95%', marginTop: '20px', marginBottom: '60px' }}>
            <div className="modern-card">
                <div className="table-responsive" style={{ maxHeight: '60vh' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '150px' }}>Date Lodged</th>
                                <th style={{ minWidth: '130px' }}>Status</th>
                                <th style={{ minWidth: '150px' }}>Booking Number</th>
                                <th style={{ minWidth: '180px' }}>Model Name</th>
                                <th style={{ minWidth: '200px' }}>Customer / Company</th>
                                <th style={{ minWidth: '120px' }}>Reference</th>
                                <th style={{ minWidth: '200px' }}>Email Address</th>
                                <th style={{ minWidth: '130px' }}>Contact Phone</th>
                                <th style={{ minWidth: '220px' }}>Address</th>
                                <th style={{ minWidth: '120px' }}>Suburb</th>
                                <th style={{ minWidth: '80px' }}>State</th>
                                <th style={{ minWidth: '100px' }}>Post Code</th>
                                <th style={{ minWidth: '160px' }}>Assign Team</th>
                                <th style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>Product Received</th>
                                <th style={{ minWidth: '250px' }}>Fault Description</th>
                                <th style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>Investigation</th>
                                <th style={{ minWidth: '180px' }}>Huntsman Status</th>
                                <th style={{ minWidth: '150px' }}>Serial Number</th>
                                <th style={{ minWidth: '250px' }}>Repair Notes</th>
                                <th style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>In Progress</th>
                                <th style={{ minWidth: '150px' }}>Spare Parts</th>
                                <th style={{ minWidth: '150px' }}>Return Date</th>
                                <th style={{ minWidth: '160px' }}>Tracking No</th>
                                <th style={{ textAlign: 'center', backgroundColor: '#ef4444', color: 'white' }}>Product Dispatch</th>
                                <th style={{ minWidth: '150px' }}>Received Date</th>
                                <th style={{ minWidth: '150px' }}>Investigation</th>
                                <th style={{ minWidth: '150px' }}>In Progress</th>
                                <th style={{ minWidth: '150px' }}>Update Sent</th>
                                <th style={{ minWidth: '150px' }}>Part Ordered</th>
                                <th style={{ minWidth: '150px' }}>Part Received</th>
                                <th style={{ minWidth: '100px' }}>Label Req?</th>
                                <th style={{ minWidth: '250px' }}>Package Contents</th>
                                <th style={{ minWidth: '80px' }}>Weight</th>
                                <th style={{ minWidth: '80px' }}>L (cm)</th>
                                <th style={{ minWidth: '80px' }}>W (cm)</th>
                                <th style={{ minWidth: '80px' }}>H (cm)</th>
                                <th style={{ padding: '0 1rem', position: 'sticky', right: 0, background: '#f8fafc', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)', zIndex: 11 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={rowClass}>
                                <td>{formatDate(result.createdAt)}</td>
                                <td>{getStatusPill(result)}</td>
                                <td style={{ fontWeight: '700', color: '#0f172a' }}>{result.rmaNumber}</td>
                                <td>{result.modelName}</td>
                                <td>
                                    <div style={{ fontWeight: '600' }}>{result.name}</div>
                                    {result.companyName && <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>{result.companyName}</div>}
                                </td>
                                <td>{result.customerReference || '-'}</td>
                                <td>{result.email}</td>
                                <td>{result.contactPhone}</td>
                                <td>{result.address || '-'}</td>
                                <td>{result.suburb || '-'}</td>
                                <td>{result.state || '-'}</td>
                                <td>{result.postCode || '-'}</td>
                                <td>{result.assignedTo || '-'}</td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!result.productReceived} disabled className="modern-checkbox" /></td>
                                <td>{result.faultDescription || '-'}</td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!result.investigationUnderway} disabled className="modern-checkbox" /></td>
                                <td>{result.huntsmanRepairStatus || '-'}</td>
                                <td>{result.serialNumber}</td>
                                <td>{result.repairDescription || '-'}</td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!result.inProgress} disabled className="modern-checkbox" /></td>
                                <td>{result.sparePartsUpdate || '-'}</td>
                                <td>{formatDate(result.completeDateOfReturn)}</td>
                                <td>{result.trackingNumber || '-'}</td>
                                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!result.dispatched} disabled className="modern-checkbox" /></td>
                                <td>{formatDate(result.productReceivedEmailAt || (result.productReceived ? result.updatedAt : null))}</td>
                                <td>{formatDate(result.investigationUnderwayEmailAt || (result.investigationUnderway ? result.updatedAt : null))}</td>
                                <td>{formatDate(result.inProgressEmailAt || (result.inProgress ? result.updatedAt : null))}</td>
                                <td>{formatDate(result.dispatchedEmailAt || (result.dispatched ? result.updatedAt : null))}</td>
                                <td>{formatDate(result.sparePartOrdered)}</td>
                                <td>{formatDate(result.sparePartReceived)}</td>
                                <td>{result.requireLabel || 'No'}</td>
                                <td>{result.contentsOfPackage || '-'}</td>
                                <td>{result.weight || '0'}</td>
                                <td>{result.length || '0'}</td>
                                <td>{result.width || '0'}</td>
                                <td>{result.height || '0'}</td>
                                <td style={{ position: 'sticky', right: 0, background: '#ffffff', boxShadow: '-2px 0 5px rgba(0,0,0,0.02)', zIndex: 11 }}>
                                    <button onClick={onViewDetails} className="btn-action btn-view" title="View Details">
                                        <span className="btn-icon">👁️</span>
                                        <span className="btn-text">View Summary</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StatusResult;
