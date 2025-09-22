
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as cmsService from '../../lib/cmsService';
import type { MediaAsset } from '../../types';

const MediaCard: React.FC<{ asset: MediaAsset }> = ({ asset }) => (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <img src={asset.url} alt={asset.altText || asset.fileName} className="w-full h-32 object-cover bg-gray-100" />
        <div className="p-2 text-xs">
            <p className="font-semibold truncate">{asset.fileName}</p>
            <p className="text-gray-500">{asset.mimeType} - {(asset.sizeBytes / 1024).toFixed(1)} KB</p>
        </div>
    </div>
);

const MediaLibraryPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        cmsService.listMediaAssets()
            .then(setAssets)
            .catch(() => addToast('Failed to load media.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpload = async () => {
        if (!user) return;
        const mockFile = { name: `new_image_${Date.now()}.jpg`, type: 'image/jpeg', size: 150000 };
        try {
            await cmsService.uploadMediaAsset(mockFile, user);
            addToast('Mock file uploaded!', 'success');
            fetchData();
        } catch {
            addToast('Upload failed.', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Media Library</h1>
                <button onClick={handleUpload} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Upload Media (Mock)</button>
            </div>

            {loading ? <p>Loading media...</p> : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {assets.map(asset => <MediaCard key={asset.id} asset={asset} />)}
                </div>
            )}
        </div>
    );
};

export default MediaLibraryPage;
