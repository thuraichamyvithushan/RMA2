import React, { useState, useEffect } from 'react';
import './PublicRmaForm.new.css';
import { API_BASE_URL } from '../config';
import PublicNavbar from '../components/PublicNavbar';

const MODEL_OPTIONS = [
    "STELLAR 3.0 - SX60L 3.0", "STELLAR 3.0 - SQ50L 3.0", "STELLAR 3.0- SQ35L 3.0", "STELLAR 3.0- SH50L 3.0",
    "STELLAR 3.0- SH35L 3.0", "STELLAR 3.0- SH35 3.0", "CONDOR - CQ50L 2.0", "CONDOR - CQ35L 2.0",
    "CONDOR- CH35L", "CONDOR - CH25L", "HABROK - HX60L 4K", "HABROK -HQ50L",
    "HABROK - HQ35L 4K", "HABROK - HH35L 4K", "HABROK -HE25L 4K", "LYNX 2.0 - LH35 2.0",
    "LYNX 2.0 - LH25 2.0", "LYNX 2.0 - LH19 2.0", "LYNX 2.0 - LH15 2.0", "LYNX S - LE15 S",
    "LYNX S - LE10 S", "LYNX S - LC06 S", "FALCON - FQ50L 2.0", "FALCON -FQ50 2.0",
    "FALCON - FQ35 2.0", "FALCON - FQ25", "FALCON - FH35", "FALCON - FH25",
    "PANTHER 2.0 PQ50L 2.0", "PANTHER 2.0 PQ35L 2.0", "PANTHER 2.0 PH50L 2.0", "PANTHER 2.0 PH35L 2.0",
    "THUNDER 2.0 TQ50 2.0", "THUNDER 2.0 TQ35 2.0", "THUNDER 2.0 TH35P 2.0", "THUNDER 2.0 TH25P 2.0",
    "THUNDER 2.0 TE25 2.0", "THUNDER 2.0 TE19 2.0", "THUNDER ZOOM 2.0 TQ60Z 2.0", "THUNDER ZOOM 2.0 TH50Z 2.0",
    "THUNDER 3.0 TQ50CL 3.0", "THUNDER 3.0 TQ50C 3.0", "THUNDER 3.0 TQ35C 3.0", "THUNDER 3.0 TH35C 3.0",
    "ALPEX 4K A50EL KIT", "ALPEX 4K A50EL", "ALPEX 4K A50E KIT", "ALPEX 4K A50E",
    "ALPEX LITE A40EL KIT", "ALPEX LITE A40EL", "ALPEX LITE A40E KIT", "ALPEX LITE A40E",
    "ALPEX A50T-S KIT", "ALPEX A50T-S", "CHEETAH C32FSL KIT", "CHEETAH C32FS KIT",
    "M15 TRAIL CAMERA", "M15 SP5000", "EXPLORER", "Other"
];

const STATE_OPTIONS = [
    "NSW", "Victoria", "Western Australia", "South Australia", "Tasmania",
    "Northern Territory", "Queensland", "Australian Capital Territory", "External Territories"
];

const STEPS = [
    { id: 1, title: 'Customer' },
    { id: 2, title: 'Product' },
    { id: 3, title: 'Shipping' },
    { id: 4, title: 'Package' }
];

const createInitialFormData = () => ({
    email: '',
    name: '',
    companyName: '',
    contactPhone: '',
    serialNumber: '',
    modelName: '',
    otherModelName: '',
    faultDescription: '',
    customerReference: '',
    requireLabel: 'No',
    address: '',
    suburb: '',
    state: '',
    postCode: '',
    contentsOfPackage: '',
    weight: '',
    width: '',
    height: '',
    length: '',
    isImageRelated: 'No',
    mediaLeftOnDevice: 'No',
    deviceOlderThanTwoYears: 'No'
});

const SearchableSelect = ({ name, value, options, onChange, placeholder, required }) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);

    // Sync searchable term with value if changed externally (e.g. form reset)
    React.useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputClick = () => {
        if (!isOpen) setIsOpen(true);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        setIsOpen(true);
        // Also update parent state so validation works, though we'll refine this on select
        onChange({ target: { name, value: val } });
    };

    const handleOptionSelect = (opt) => {
        setSearchTerm(opt);
        setIsOpen(false);
        onChange({ target: { name, value: opt } });
    };

    return (
        <div className="searchable-select-container">
            <input
                type="text"
                name={name}
                value={searchTerm}
                onChange={handleInputChange}
                onClick={handleInputClick}
                placeholder={placeholder}
                autoComplete="off"
                required={required}
            />
            {isOpen && (
                <div className="searchable-select-dropdown">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, index) => (
                            <div
                                key={index}
                                className="searchable-select-item"
                                onClick={() => handleOptionSelect(opt)}
                            >
                                {opt}
                            </div>
                        ))
                    ) : (
                        <div className="searchable-select-no-results">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

const PublicRmaForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(createInitialFormData);
    const [status, setStatus] = useState({ loading: false, success: false, error: null });
    const [showMediaDialog, setShowMediaDialog] = useState(false);
    const [faultMediaFiles, setFaultMediaFiles] = useState([]);
    const [proofOfPurchaseFiles, setProofOfPurchaseFiles] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const selectedFiles = Array.from(files || []);

        if (name === 'faultMedia') {
            setFaultMediaFiles(selectedFiles);
        }

        if (name === 'proofOfPurchase') {
            setProofOfPurchaseFiles(selectedFiles);
        }
    };

    const handleImageRelatedChange = (value) => {
        setFormData(prev => ({ ...prev, isImageRelated: value }));

        if (value === 'Yes') {
            setShowMediaDialog(true);
        } else {
            setShowMediaDialog(false);
        }
    };

    const appendMediaNoteToDescription = () => {
        const note = 'Image/video of the fault has been captured and left on the device.';

        setFormData(prev => ({
            ...prev,
            faultDescription: prev.faultDescription.includes(note)
                ? prev.faultDescription
                : `${prev.faultDescription}${prev.faultDescription ? '\n\n' : ''}${note}`
        }));
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                return formData.email && formData.name && formData.contactPhone;
            case 2:
                return formData.serialNumber && formData.modelName && formData.faultDescription &&
                    (formData.modelName !== 'Other' || formData.otherModelName);
            case 3:
                return formData.address && formData.suburb && formData.state && formData.postCode;
            case 4:
                return formData.contentsOfPackage && formData.weight && formData.width &&
                    formData.height && formData.length;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
            setStatus({ ...status, error: null });
            window.scrollTo(0, 0);
        } else {
            setStatus({ ...status, error: 'Please fill in all required fields.' });
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setStatus({ ...status, error: null });
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(4)) {
            setStatus({ ...status, error: 'Please fill in all required fields.' });
            return;
        }

        setStatus({ loading: true, success: false, error: null });

        const finalData = {
            ...formData,
            faultMediaAttachmentNames: faultMediaFiles.map(file => file.name).join(', '),
            proofOfPurchaseAttachmentNames: proofOfPurchaseFiles.map(file => file.name).join(', ')
        };

        if (formData.modelName === 'Other') {
            finalData.modelName = formData.otherModelName;
        }
        delete finalData.otherModelName;

        try {
            const payload = new FormData();
            Object.entries(finalData).forEach(([key, value]) => {
                payload.append(key, value ?? '');
            });
            faultMediaFiles.forEach(file => payload.append('faultMedia', file));
            proofOfPurchaseFiles.forEach(file => payload.append('proofOfPurchase', file));

            const response = await fetch(`${API_BASE_URL}/api/rma`, {
                method: 'POST',
                body: payload
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Submission failed');
            }

            setStatus({ loading: false, success: true, error: null });
            setFormData(createInitialFormData());
            setFaultMediaFiles([]);
            setProofOfPurchaseFiles([]);
            setShowMediaDialog(false);
            setCurrentStep(1);
        } catch (err) {
            setStatus({ loading: false, success: false, error: err.message });
        }
    };



    if (status.success) {
        return (
            <div className="public-rma-wrapper">
                <div className="form-max-width rma-google-card rma-header-card">
                    <div className="rma-header">
                        <h1>Booking Submitted!</h1>
                        <p className="success-msg">Your response has been recorded. We will contact you via email shortly.</p>
                        <button
                            onClick={() => setStatus({ ...status, success: false })}
                            className="btn btn-prev"
                            style={{ paddingLeft: 0, marginTop: '24px' }}
                        >
                            Submit another response
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="public-rma-wrapper">
            <PublicNavbar />

            <div className="form-max-width">

                <div className="rma-google-card rma-header-card">
                    <img src="/assets/topbanner.png" alt="Banner" style={{ width: '20%', height: 'auto', display: 'block' }} />
                    <div className="rma-header">
                        <h1>Booking Submission Form</h1>
                        <p>Please fill out the form below to initiate your return request.</p>
                    </div>
                </div>

                <div className="rma-google-card wizard-progress-card">
                    <div className="wizard-steps-container">
                        {STEPS.map((step) => (
                            <div key={step.id} className={`wizard-step-indicator ${currentStep >= step.id ? 'active' : ''}`} />
                        ))}
                    </div>
                    <div style={{ marginTop: '12px', textAlign: 'right' }} className="step-label">
                        Step {currentStep} of 4
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {currentStep === 1 && (
                        <div className="rma-google-card rma-form-section-card">
                            <h3 className="section-title">Customer Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Email Address*</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Full Name*</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Contact Phone Number*</label>
                                    <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Company Name*</label>
                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="rma-google-card rma-form-section-card">
                            <h3 className="section-title">Product Details</h3>
                            <div className="form-grid">
                                <div className="field-pair">
                                    <div className="form-group">
                                        <label>Serial Number*</label>
                                        <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} required />
                                    </div>
                                    <div className="side-prompt-card">
                                        <label>Device older than 2 years?</label>
                                        <select
                                            name="deviceOlderThanTwoYears"
                                            value={formData.deviceOlderThanTwoYears}
                                            onChange={handleChange}
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                        <p className="field-helper">Optional. If yes, proof of purchase can be attached here.</p>
                                        {formData.deviceOlderThanTwoYears === 'Yes' && (
                                            <>
                                                <input
                                                    type="file"
                                                    name="proofOfPurchase"
                                                    accept=".pdf,image/*"
                                                    multiple
                                                    onChange={handleFileChange}
                                                />
                                                <p className="field-helper">You can still submit the form without adding a file.</p>
                                                {proofOfPurchaseFiles.length > 0 && (
                                                    <p className="selected-file-list">
                                                        Selected: {proofOfPurchaseFiles.map(file => file.name).join(', ')}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Model Name*</label>
                                    <SearchableSelect
                                        name="modelName"
                                        value={formData.modelName}
                                        options={MODEL_OPTIONS}
                                        onChange={handleChange}
                                        placeholder="Type to search model..."
                                        required
                                    />
                                </div>
                                {formData.modelName === 'Other' && (
                                    <div className="form-group">
                                        <label>Please Specify Model*</label>
                                        <input type="text" name="otherModelName" value={formData.otherModelName} onChange={handleChange} required />
                                    </div>
                                )}
                                <div className="field-pair field-pair-top">
                                    <div className="form-group">
                                        <label>Fault Description*</label>
                                        <textarea name="faultDescription" value={formData.faultDescription} onChange={handleChange} required />
                                    </div>
                                    <div className="side-prompt-card">
                                        <label>Is the issue image-related?</label>
                                        <select
                                            name="isImageRelated"
                                            value={formData.isImageRelated}
                                            onChange={(e) => handleImageRelatedChange(e.target.value)}
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                        <p className="field-helper">
                                            Optional. If yes, a dialog will let you attach a picture/video or note that the media was left on the device.
                                        </p>
                                        {formData.isImageRelated === 'Yes' && (
                                            <>
                                                <div className="inline-action-row">
                                                    <button
                                                        type="button"
                                                        className="btn btn-dialog"
                                                        onClick={() => setShowMediaDialog(true)}
                                                    >
                                                        Open attachment dialog
                                                    </button>
                                                </div>
                                                {faultMediaFiles.length > 0 && (
                                                    <p className="selected-file-list">
                                                        Selected: {faultMediaFiles.map(file => file.name).join(', ')}
                                                    </p>
                                                )}
                                                {formData.mediaLeftOnDevice === 'Yes' && (
                                                    <p className="selected-file-list">
                                                        Marked as captured and left on the device.
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Customer Reference</label>
                                    <input type="text" name="customerReference" value={formData.customerReference} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Do you require a label?</label>
                                    <select name="requireLabel" value={formData.requireLabel} onChange={handleChange}>
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="rma-google-card rma-form-section-card">
                            <h3 className="section-title">Shipping Address</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Address*</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Suburb*</label>
                                    <input type="text" name="suburb" value={formData.suburb} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>State*</label>
                                    <SearchableSelect
                                        name="state"
                                        value={formData.state}
                                        options={STATE_OPTIONS}
                                        onChange={handleChange}
                                        placeholder="Type to search state..."
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Post Code*</label>
                                    <input type="text" name="postCode" value={formData.postCode} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="rma-google-card rma-form-section-card">
                            <h3 className="section-title">Package Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Contents of the package*</label>
                                    <input type="text" name="contentsOfPackage" value={formData.contentsOfPackage} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Weight (kg)*</label>
                                    <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Width (cm)*</label>
                                    <input type="number" name="width" value={formData.width} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Height (cm)*</label>
                                    <input type="number" name="height" value={formData.height} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Length (cm)*</label>
                                    <input type="number" name="length" value={formData.length} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>
                    )}

                    {status.error && (
                        <div className="rma-google-card" style={{ padding: '16px', color: '#d93025', fontSize: '14px', borderLeft: '4px solid #d93025' }}>
                            {status.error}
                        </div>
                    )}

                    <div className="form-nav-container">
                        {currentStep > 1 ? (
                            <button type="button" onClick={handlePrevious} className="btn btn-prev">
                                Previous
                            </button>
                        ) : <div />}

                        {currentStep < 4 ? (
                            <button type="button" onClick={handleNext} className="btn btn-next">
                                Next
                            </button>
                        ) : (
                            <button type="submit" disabled={status.loading} className="btn btn-next">
                                {status.loading ? 'Submitting...' : 'Submit'}
                            </button>
                        )}
                    </div>
                </form>

                {showMediaDialog && (
                    <div className="assist-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="media-dialog-title">
                        <div className="assist-modal-card">
                            <div className="assist-modal-header">
                                <h4 id="media-dialog-title">Fault image / video</h4>
                                <button
                                    type="button"
                                    className="assist-modal-close"
                                    aria-label="Close image attachment dialog"
                                    onClick={() => setShowMediaDialog(false)}
                                >
                                    x
                                </button>
                            </div>
                            <div className="assist-modal-body">
                                <div className="form-group">
                                    <label>Attach picture or video</label>
                                    <input
                                        type="file"
                                        name="faultMedia"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                    <p className="field-helper">Optional. You can continue without attaching any files.</p>
                                    {faultMediaFiles.length > 0 && (
                                        <p className="selected-file-list">
                                            Selected: {faultMediaFiles.map(file => file.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Was the fault image/video captured and left on the device?</label>
                                    <select name="mediaLeftOnDevice" value={formData.mediaLeftOnDevice} onChange={handleChange}>
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                                {formData.mediaLeftOnDevice === 'Yes' && (
                                    <div className="dialog-note-box">
                                        <p>Please mention this in the fault description so the team knows where to look.</p>
                                        <button
                                            type="button"
                                            className="btn btn-prev btn-inline-action"
                                            onClick={appendMediaNoteToDescription}
                                        >
                                            Add note to fault description
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="assist-modal-footer">
                                <button type="button" className="btn btn-next" onClick={() => setShowMediaDialog(false)}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <p className="footer-note">
                    Secure Form Submission System
                </p>
            </div>
        </div>
    );
};

export default PublicRmaForm;
