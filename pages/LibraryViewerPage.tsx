import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation, useParams } from 'react-router-dom';
import { getAsset } from '../lib/digitalLibraryService';
import { useAuth } from '../auth/AuthContext';
import type { DigitalAsset } from '../types';
import SecurePlayer from '../components/digital/SecurePlayer';

const LibraryViewerPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { user } = useAuth();

    const assetId = searchParams.get('id');
    const backSearch = new URLSearchParams(location.search);
    backSearch.delete('id');

    const [asset, setAsset] = useState<DigitalAsset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!assetId) {
            setError('No asset ID provided.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        getAsset(assetId)
            .then(data => {
                if (data) {
                    setAsset(data);
                } else {
                    setError('Asset not found.');
                }
            })
            .catch(() => setError('Failed to load asset details.'))
            .finally(() => setLoading(false));
    }, [assetId]);

    const renderViewer = () => {
        if (!asset) return null;

        switch (asset.kind) {
            case 'VIDEO':
                return <SecurePlayer src={asset.url} watermarkText={user?.name} />;
            case 'AUDIO':
                return (
                    <div className="bg-gray-800 p-8 rounded-lg">
                        <audio controls className="w-full" src={asset.url} onContextMenu={(e) => e.preventDefault()}>
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                );
            case 'EBOOK':
                return (
                    <div className="aspect-[4/5] border border-gray-200 rounded-lg overflow-hidden">
                        <iframe
                            src={asset.url}
                            title={asset.title}
                            className="w-full h-full"
                        />
                    </div>
                );
            default:
                return <p className="text-gray-500">Unsupported asset type.</p>;
        }
    };
    
    if (loading) {
        return <div className="text-center p-8 text-gray-500">Loading asset...</div>
    }

    if (error) {
         return (
            <div className="text-center p-8 bg-white rounded-lg shadow border">
                <h2 className="text-xl font-semibold text-red-600">Error</h2>
                <p className="text-gray-500 mt-2">{error}</p>
                 <Link to={`/school/${siteId}/library?${backSearch.toString()}`} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                    &larr; Back to Library
                </Link>
            </div>
        );
    }
    
    if (!asset) return null;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                 <Link to={`/school/${siteId}/library?${backSearch.toString()}`} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2">
                     &larr; Back to Library
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">{asset.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Category: <span className="font-medium text-gray-700">{asset.category}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    Published: <span className="font-medium text-gray-700">{asset.createdAt}</span>
                </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {renderViewer()}
            </div>
        </div>
    );
};

export default LibraryViewerPage;
