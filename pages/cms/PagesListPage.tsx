
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listPages } from '../../lib/cmsService';
import { Page } from '../../types';

const PagesListPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listPages().then(setPages).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Pages</h1>
                <Link to={`/school/${siteId}/cms/pages/new`} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">
                    New Page
                </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border">
                <ul className="divide-y divide-gray-200">
                {loading ? <li className="p-4 text-center">Loading...</li> : pages.map(page => (
                    <li key={page.id} className="flex justify-between items-center p-4">
                        <div>
                            <p className="font-semibold text-gray-800">{page.title}</p>
                            <p className="text-sm text-gray-500 font-mono">{page.slug}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${page.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{page.status}</span>
                            <Link to={`/school/${siteId}/cms/pages/${page.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</Link>
                        </div>
                    </li>
                ))}
                </ul>
            </div>
        </div>
    );
};

export default PagesListPage;
