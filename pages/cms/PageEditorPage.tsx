
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getPage, savePage, getPageVersions } from '../../lib/cmsService';
import VersionHistoryDrawer from '../../components/cms/VersionHistoryDrawer';

const PageEditorPage: React.FC = () => {
    const { pageId } = useParams<{ pageId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [page, setPage] = useState({ title: '', slug: '', content: '', status: 'Draft' });
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        if (pageId === 'new') {
            setLoading(false);
            return;
        }
        getPage(pageId!).then(data => {
            if (data) setPage(data);
        }).finally(() => setLoading(false));
        getPageVersions(pageId!).then(setVersions);
    }, [pageId]);

    const handleSave = async () => {
        if (!user) return;
        await savePage({ id: pageId !== 'new' ? pageId : undefined, ...page }, user);
        navigate('/school/site_123/cms/pages');
    };
    
    const handleRestore = (content: string) => {
        setPage(p => ({ ...p, content }));
        setIsDrawerOpen(false);
    };

    if (loading) return <p>Loading page...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{pageId === 'new' ? 'New Page' : 'Edit Page'}</h1>
                <div className="flex gap-2">
                    <button onClick={() => setIsDrawerOpen(true)} className="px-4 py-2 bg-white border rounded-md">History ({versions.length})</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Page</button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <input value={page.title} onChange={e => setPage({...page, title: e.target.value})} placeholder="Page Title" className="w-full text-2xl font-bold"/>
                    <textarea value={page.content} onChange={e => setPage({...page, content: e.target.value})} placeholder="Page content (HTML supported)..." className="w-full h-96 font-mono"/>
                </div>
                <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border space-y-4">
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <input value={page.slug} onChange={e => setPage({...page, slug: e.target.value})} placeholder="URL Slug (e.g. /about-us)" className="w-full" />
                    <select value={page.status} onChange={e => setPage({...page, status: e.target.value})} className="w-full">
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                    </select>
                </div>
            </div>
            <VersionHistoryDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} versions={versions} onRestore={handleRestore} />
        </div>
    );
};

export default PageEditorPage;
