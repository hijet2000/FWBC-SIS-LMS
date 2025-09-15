import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { listAssets } from '../lib/digitalLibraryService';
import type { DigitalAsset, AssetKind } from '../types';

const AssetCard: React.FC<{ asset: DigitalAsset; search: string }> = ({ asset, search }) => {
    const { siteId } = useParams<{ siteId: string }>();

    const kindStyles: Record<AssetKind, string> = {
        VIDEO: 'bg-blue-100 text-blue-800',
        AUDIO: 'bg-purple-100 text-purple-800',
        EBOOK: 'bg-green-100 text-green-800',
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col transition-shadow hover:shadow-md">
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${kindStyles[asset.kind]}`}>{asset.kind}</span>
                    {asset.createdAt && <span className="text-xs text-gray-400">{asset.createdAt}</span>}
                </div>
                <h3 className="font-semibold text-gray-800">{asset.title}</h3>
                {asset.category && <p className="text-sm text-gray-500 mt-1">{asset.category}</p>}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <Link 
                    to={`/school/${siteId}/library/digital/view?id=${asset.id}&${search}`}
                    className="w-full text-center inline-block px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Open
                </Link>
            </div>
        </div>
    );
};

const LibraryPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [assets, setAssets] = useState<DigitalAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const q = searchParams.get('q') || '';
    const kind = searchParams.get('kind') || '';
    const category = searchParams.get('category') || '';

    useEffect(() => {
        setLoading(true);
        setError(null);
        listAssets()
            .then(setAssets)
            .catch(() => setError('Failed to load digital assets. Please try again.'))
            .finally(() => setLoading(false));
    }, []);

    const categories = useMemo(() => {
        const uniqueCategories = new Set(assets.map(a => a.category).filter(Boolean));
        return Array.from(uniqueCategories).sort();
    }, [assets]);

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesQuery = q ? asset.title.toLowerCase().includes(q.toLowerCase()) : true;
            const matchesKind = kind ? asset.kind === kind : true;
            const matchesCategory = category ? asset.category === category : true;
            return matchesQuery && matchesKind && matchesCategory;
        });
    }, [assets, q, kind, category]);

    const handleFilterChange = (key: 'q' | 'kind' | 'category', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };

    const renderGrid = () => {
        if (loading) {
            return [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="mt-4 h-10 bg-gray-100 rounded"></div>
                </div>
            ));
        }
        if (error) {
            return <div className="col-span-full text-center p-8 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>;
        }
        if (filteredAssets.length === 0) {
            return (
                <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800">No Assets Found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting or clearing your filters to see more content.</p>
                </div>
            );
        }
        return filteredAssets.map(asset => (
            <AssetCard key={asset.id} asset={asset} search={searchParams.toString()} />
        ));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Digital Library</h1>
                <p className="mt-1 text-sm text-gray-500">Manage and view course media, including videos, audio, and documents.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="search" className="sr-only">Search by title</label>
                        <input
                            type="search"
                            id="search"
                            placeholder="Search by title..."
                            value={q}
                            onChange={e => handleFilterChange('q', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="category-filter" className="sr-only">Filter by category</label>
                        <select
                            id="category-filter"
                            value={category}
                            onChange={e => handleFilterChange('category', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Kind:</label>
                    <div className="mt-2 flex items-center space-x-2">
                        {(['', 'VIDEO', 'AUDIO', 'EBOOK'] as const).map(k => (
                            <button
                                key={k || 'ALL'}
                                onClick={() => handleFilterChange('kind', k)}
                                className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    kind === k ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                            >
                                {k === '' ? 'All' : k.charAt(0) + k.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {renderGrid()}
            </div>
        </div>
    );
};

export default LibraryPage;
