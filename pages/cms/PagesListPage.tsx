
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listPages } from '../../lib/cmsService';

const PagesListPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listPages().then(setPages).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Pages</h1>
                <Link to={`/school/${siteId}/cms/pages/new`} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                    New Page
                </Link>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                {loading ? <p>Loading...</p> : pages.map(page => (
                    <div key={page.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                            <p className="font-semibold">{page.title}</p>
                            <p className="text-sm text-gray-500">{page.slug}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${page.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{page.status}</span>
                            <Link to={`/school/${siteId}/cms/pages/${page.id}`}>Edit</Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PagesListPage;
