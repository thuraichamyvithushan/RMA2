const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const getCloudinaryConfig = () => ({
    cloudName: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    apiKey: (process.env.CLOUDINARY_API_KEY || '').trim(),
    apiSecret: (process.env.CLOUDINARY_API_SECRET || '').trim()
});

const isCloudinaryConfigured = () => {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    return Boolean(cloudName && apiKey && apiSecret);
};

const buildSignature = (params, apiSecret) => {
    const serialized = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');

    return crypto
        .createHash('sha1')
        .update(`${serialized}${apiSecret}`)
        .digest('hex');
};

const uploadFileToCloudinary = async (file, { folder } = {}) => {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Cloudinary environment variables are not configured.');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const uploadParams = { timestamp };

    if (folder) {
        uploadParams.folder = folder;
    }

    const signature = buildSignature(uploadParams, apiSecret);
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const buffer = await fs.promises.readFile(file.path);

    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: file.mimetype || 'application/octet-stream' }), file.originalname);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    if (folder) {
        formData.append('folder', folder);
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
    });

    const responseBody = await response.json();

    if (!response.ok) {
        throw new Error(responseBody.error?.message || 'Cloudinary upload failed.');
    }

    return {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageProvider: 'cloudinary',
        publicId: responseBody.public_id,
        resourceType: responseBody.resource_type,
        format: responseBody.format,
        url: responseBody.url,
        secureUrl: responseBody.secure_url,
        bytes: responseBody.bytes,
        width: responseBody.width || null,
        height: responseBody.height || null,
        duration: responseBody.duration || null,
        folder: responseBody.folder || folder || '',
        createdAt: responseBody.created_at
    };
};

const uploadFilesToCloudinary = async (files = [], options = {}) => {
    return Promise.all(files.map((file) => uploadFileToCloudinary(file, options)));
};

const deleteCloudinaryAsset = async (asset) => {
    if (!asset?.publicId || !asset?.resourceType) return;

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

    if (!cloudName || !apiKey || !apiSecret) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const destroyParams = {
        public_id: asset.publicId,
        timestamp
    };

    const signature = buildSignature(destroyParams, apiSecret);
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${asset.resourceType}/destroy`;
    const formData = new FormData();

    formData.append('public_id', asset.publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`Failed to delete Cloudinary asset ${asset.publicId}: ${responseBody}`);
    }
};

const deleteCloudinaryAssets = async (assets = []) => {
    const deletableAssets = assets.filter((asset) => asset?.publicId && asset?.resourceType);
    await Promise.all(deletableAssets.map(deleteCloudinaryAsset));
};

module.exports = {
    deleteCloudinaryAssets,
    isCloudinaryConfigured,
    uploadFilesToCloudinary
};
