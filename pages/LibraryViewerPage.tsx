import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation, useParams } from 'react-router-dom';
import { getAsset } from '../lib/digitalLibraryService';
import { useAuth } from '../auth/AuthContext';
import type { DigitalAsset, Student } from '../types';
import { getStudent } from '../lib/schoolService';
import { useSignedMedia } from '../../hooks/useSignedMedia';

import SecurePlayer from '../../components/digital/SecurePlayer';
import DynamicWatermark from '../../components/digital/DynamicWatermark';
import Spinner from '../../components/ui/Spinner';

const ErrorBanner: React.FC<{ error: any; onRetry: () => void; backLink: string }> = ({ error, onRetry, backLink }) => (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" role="alert">
        <div className="flex">
            <div>
                <p className="font-bold text-red-800">Playback Error: {error.code}</p>
                <p className="text-sm text-red-700">{error.message}</p>
                <div className="mt-4 space-x-4">
                    <button onClick={onRetry} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Re-validate Session</button>
                    <Link to={backLink} className="text-sm text-gray-600 hover:underline">Back to Library</Link>
                </div>
            </div>
        </div>
    </div>
);


const LibraryViewerPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { user } = useAuth();

    const assetId = searchParams.get('id');
    const backSearch = new URLSearchParams(location.search);
    backSearch.delete('id');
    const backLink = `/school/${siteId}/library?${backSearch.toString()}`;

    const [asset, setAsset] = useState<DigitalAsset | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [metaLoading, setMetaLoading] = useState(true);

    // Fetch static asset and student metadata
    useEffect(() => {
        if (!assetId || !user) return;
        const fetchMeta = async () => {
            try {
                const [assetData, studentData] = await Promise.all([
                    getAsset(assetId),
                    user.scopes.includes('student') ? getStudent('s01') : Promise.resolve(null) // Mock: get specific student if user is student
                ]);
                setAsset(assetData);
                setStudent(studentData);
            } catch {
                // Error handled by useSignedMedia
            } finally {
                setMetaLoading(false);
            }
        };
        fetchMeta();
    }, [assetId, user]);
    
    const { signedUrl, tokenId, loading: urlLoading, error, retry } = useSignedMedia({
        contentId: assetId,
        rawUrl: asset?.url || null,
        kind: asset?.kind || 'VIDEO',
        ttlSec: 300, // 5 minute TTL
    });


    const renderViewer = () => {
        if (!asset) return null;

        if (urlLoading || !signedUrl) {
            return (
                <div className="w-full aspect-video bg-gray-200 flex items-center justify-center rounded-lg">
                    <Spinner />
                </div>
            );
        }
        
        if (error) {
            return <ErrorBanner error={error} onRetry={retry} backLink={backLink} />;
        }

        switch (asset.kind) {
            case 'VIDEO':
                return <SecurePlayer src={signedUrl} />;
            case 'AUDIO':
                return (
                    <div className="bg-gray-800 p-8 rounded-lg">
                        <audio controls className="w-full" src={signedUrl} onContextMenu={(e) => e.preventDefault()}>
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                );
            case 'EBOOK':
                return (
                    <div className="aspect-[4/5] border border-gray-200 rounded-lg overflow-hidden">
                        <iframe
                            src={signedUrl}
                            title={asset.title}
                            className="w-full h-full"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                );
            default:
                return <p className="text-gray-500">Unsupported asset type.</p>;
        }
    };
    
    if (metaLoading) {
        return <div className="text-center p-8 text-gray-500">Loading asset...</div>
    }
    
    if (!asset) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow border">
                <h2 className="text-xl font-semibold text-red-600">Error</h2>
                <p className="text-gray-500 mt-2">Asset not found.</p>
                 <Link to={backLink} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                    &larr; Back to Library
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                 <Link to={backLink} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2">
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
                <DynamicWatermark
                    userName={user?.name}
                    admissionNo={student?.admissionNo}
                    siteId={siteId}
                    tokenId={tokenId}
                >
                    {renderViewer()}
                </DynamicWatermark>
            </div>
        </div>
    );
};

export default LibraryViewerPage;
