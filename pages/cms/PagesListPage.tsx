import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as cmsService from '../../lib/cmsService';
import type { CmsPage, PageStatus } from '../../types';

const statusStyles: Record<PageStatus, string> = {
    Draft: 'bg-gray-100 text-gray-800',
    InReview: 'bg-yellow-100 text-yellow-800',
    Published: 'bg-green-100 text-green-800',
    Archived: 'bg-red-100 text-red-800',
};

const PagesListPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { addToast } = useToast();
    const [pages, setPages] = useState<CmsPage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        cmsService.listPages()
            .then(setPages)
            .catch(() => addToast('Failed to load pages.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Website Pages</h1>
                <Link to={`/school/${siteId}/cms/pages/new`} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
                    New Page
                </Link>
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-medium uppercase">Title</th>
                            <th className="p-3 text-left text-xs font-medium uppercase">Slug</th>
                            <th className="p-3 text-left text-xs font-medium uppercase">Status</th>
                            <th className="p-3 text-left text-xs font-medium uppercase">Last Updated</th>
                            <th className="p-3 text-right text-xs font-medium uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading pages...</td></tr> :
                        pages.map(page => (
                            <tr key={page.id}>
                                <td className="p-3 font-medium">{page.title}</td>
                                <td className="p-3 text-sm font-mono text-gray-500">/{page.slug}</td>
                                <td className="p-3 text-sm">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[page.status]}`}>
                                        {page.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-500">{new Date(page.updatedAt).toLocaleString()}</td>
                                <td className="p-3 text-right text-sm font-medium space-x-2">
                                    <a href={`/fwbc/p/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">Preview</a>
                                    <Link to={`/school/${siteId}/cms/pages/edit/${page.id}`} className="text-indigo-600">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PagesListPage;
