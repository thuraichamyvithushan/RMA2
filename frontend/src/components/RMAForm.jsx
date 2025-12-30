import { useState } from 'react';
import '../styles/main.css';

const MODELS = [
    "STELLAR 3.0 - SX60L 3.0",
    "STELLAR 3.0 - SQ50L 3.0",
    "STELLAR 3.0- SQ35L 3.0",
    "STELLAR 3.0- SH50L 3.0",
    "STELLAR 3.0- SH35L 3.0",
    "STELLAR 3.0- SH35 3.0",
    "CONDOR - CQ50L 2.0",
    "CONDOR - CQ35L 2.0",
    "CONDOR- CH35L",
    "CONDOR - CH25L",
    "HABROK - HX60L 4K",
    "HABROK -HQ50L",
    "HABROK - HQ35L 4K",
    "HABROK - HH35L 4K",
    "HABROK -HE25L 4K",
    "LYNX 2.0 - LH35 2.0",
    "LYNX 2.0 - LH25 2.0",
    "LYNX 2.0 - LH19 2.0",
    "LYNX 2.0 - LH15 2.0",
    "LYNX S - LE15 S",
    "LYNX S - LE10 S",
    "LYNX S - LC06 S",
    "FALCON - FQ50L 2.0",
    "FALCON -FQ50 2.0",
    "FALCON - FQ35 2.0",
    "FALCON - FQ25",
    "FALCON - FH35",
    "FALCON - FH25",
    "PANTHER 2.0 PQ50L 2.0",
    "PANTHER 2.0 PQ35L 2.0",
    "PANTHER 2.0 PH50L 2.0",
    "PANTHER 2.0 PH35L 2.0",
    "THUNDER 2.0 TQ50 2.0",
    "THUNDER 2.0 TQ35 2.0",
    "THUNDER 2.0 TH35P 2.0",
    "THUNDER 2.0 TH25P 2.0",
    "THUNDER 2.0 TE25 2.0",
    "THUNDER 2.0 TE19 2.0",
    "THUNDER ZOOM 2.0 TQ60Z 2.0",
    "THUNDER ZOOM 2.0 TH50Z 2.0",
    "THUNDER 3.0 TQ50CL 3.0",
    "THUNDER 3.0 TQ50C 3.0",
    "THUNDER 3.0 TQ35C 3.0",
    "THUNDER 3.0 TH35C 3.0",
    "ALPEX 4K A50EL KIT",
    "ALPEX 4K A50EL",
    "ALPEX 4K A50E KIT",
    "ALPEX 4K A50E",
    "ALPEX LITE A40EL KIT",
    "ALPEX LITE A40EL",
    "ALPEX LITE A40E KIT",
    "ALPEX LITE A40E",
    "ALPEX A50T-S KIT",
    "ALPEX A50T-S",
    "CHEETAH C32FSL KIT",
    "CHEETAH C32FS KIT",
    "M15 TRAIL CAMERA",
    "M15 SP5000",
    "EXPLORER",
    "Other"
];

export default function RMAForm() {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
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
        height: '',
        width: '',
        length: ''
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const finalData = { ...formData };
        if (finalData.modelName === 'Other') {
            finalData.modelName = finalData.otherModelName;
        }

        try {
            const res = await fetch('http://127.0.0.1:5000/api/rma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
            });

            if (!res.ok) throw new Error('Submission failed');

            const data = await res.json();
            setSubmitted(true);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="container" style={{ maxWidth: '600px', paddingTop: '4rem' }}>
                <div className="card text-center">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h2>RMA Lodged Successfully</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Thank you. Your RMA has been received. You will receive an email confirmation shortly once our team processes your request.
                    </p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '2rem' }}>
                        Submit Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
            <h1 className="page-title text-center">Product Details</h1>

            <div className="card">
                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} />
                    </div>

                    {/* Name */}
                    <div className="form-group">
                        <label>Name / Company Name *</label>
                        <input name="name" required value={formData.name} onChange={handleChange} />
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label>Contact Phone Number *</label>
                        <input type="tel" name="contactPhone" required value={formData.contactPhone} onChange={handleChange} />
                    </div>

                    {/* Serial */}
                    <div className="form-group">
                        <label>Serial Number *</label>
                        <input name="serialNumber" required value={formData.serialNumber} onChange={handleChange} />
                    </div>

                    {/* Model Name */}
                    <div className="form-group">
                        <label>Model Name *</label>
                        <select name="modelName" required value={formData.modelName} onChange={handleChange} style={{ background: '#020617', color: 'white' }}>
                            <option value="">Select a Model...</option>
                            {MODELS.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                        {formData.modelName === 'Other' && (
                            <input
                                name="otherModelName"
                                placeholder="Please specify model"
                                value={formData.otherModelName}
                                onChange={handleChange}
                                style={{ marginTop: '0.5rem' }}
                                required
                            />
                        )}
                    </div>

                    {/* Fault */}
                    <div className="form-group">
                        <label>Fault Description *</label>
                        <textarea name="faultDescription" rows="4" required value={formData.faultDescription} onChange={handleChange}></textarea>
                    </div>

                    {/* Reference */}
                    <div className="form-group">
                        <label>Customer Reference</label>
                        <input name="customerReference" value={formData.customerReference} onChange={handleChange} />
                    </div>

                    {/* Label Requirement */}
                    <div className="form-group">
                        <label>Do you require a label? *</label>
                        <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
                                <input
                                    type="radio"
                                    name="requireLabel"
                                    value="Yes"
                                    checked={formData.requireLabel === 'Yes'}
                                    onChange={handleChange}
                                    style={{ width: 'auto' }}
                                />
                                Yes
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
                                <input
                                    type="radio"
                                    name="requireLabel"
                                    value="No"
                                    checked={formData.requireLabel === 'No'}
                                    onChange={handleChange}
                                    style={{ width: 'auto' }}
                                />
                                No
                            </label>
                        </div>
                    </div>

                    <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

                    {/* Address */}
                    <div className="form-group">
                        <label>Address *</label>
                        <textarea name="address" rows="2" required value={formData.address} onChange={handleChange} placeholder="Street Address"></textarea>
                    </div>

                    <div className="form-group">
                        <label>Suburb *</label>
                        <input name="suburb" required value={formData.suburb} onChange={handleChange} />
                    </div>

                    <div className="grid grid-2 gap-4">
                        <div className="form-group">
                            <label>State *</label>
                            <input name="state" required value={formData.state} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Post Code *</label>
                            <input name="postCode" required value={formData.postCode} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Contents & Dimensions */}
                    <div className="form-group">
                        <label>Contents of the package *</label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', marginTop: 0 }}>
                            ie, Complete kit/unit itself, excluding any accessories. Should a shipping label be needed, ensure to provide the package dimensions, namely Weight (Wt) x Width (W) x Height (H) x Length (L).
                        </p>
                        <textarea name="contentsOfPackage" rows="3" required value={formData.contentsOfPackage} onChange={handleChange}></textarea>
                    </div>

                    {/* Dimensions Grid */}
                    <div className="grid grid-2 gap-4">
                        <div className="form-group">
                            <label>Weight (kg)</label>
                            <input name="weight" value={formData.weight} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Height (cm) *</label>
                            <input name="height" required value={formData.height} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-2 gap-4">
                        <div className="form-group">
                            <label>Width (cm) *</label>
                            <input name="width" required value={formData.width} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Length (cm) *</label>
                            <input name="length" required value={formData.length} onChange={handleChange} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '2rem' }}>
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
}
