import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as cmsService from '../../lib/cmsService';
import type { CmsPage, PageBlock, PageStatus, SeoData } from '../../types';

// Simple Block Editor Component
const PageBlockEditor: React.FC<{ block: PageBlock, onUpdate: (id: string, content: any) => void }> = ({ block, onUpdate }) => {
    if (block.type === 'text') {
        return (
            <textarea
                value={block.content.text}
                onChange={(e) => onUpdate(block.id, { text: e.target.value })}
                className="w-full p-2 border rounded-md"
                rows={5}
            />
        );
    }
    if (block.type === 'image') {
        return (
             <div className="flex gap-2">
                <input
                    value={block.content.mediaId}
                    onChange={(e) => onUpdate(block.id, { ...block.content, mediaId: e.target.value })}
                    placeholder="Media ID (e.g., media-1)"
                    className="flex-grow p-2 border rounded-md"
                />
                <input
                    value={block.content.caption}
                    onChange={(e) => onUpdate(block.id, { ...block.content, caption: e.target.value })}
                    placeholder="Caption"
                    className="flex-grow p-2 border rounded-md"
                />
             </div>
        )
    }
    return <div className="p-2 bg-gray-100">Unsupported block type.</div>;
};


const PageEditorPage: React.FC = () => {
    const { siteId, pageId } = useParams<{ siteId: string, pageId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const isNew = !pageId;

    const [page, setPage] = useState<Partial<CmsPage>>({
        title: '', slug: '', blocks: [], seo: { title: '', description: '', keywords: '' }, status: 'Draft'
    });
    const [loading, setLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isNew && pageId) {
            setLoading(true);
            cmsService.getPage(pageId).then(data => {
                if (data) setPage(data);
                else addToast('Page not found.', 'error');
            }).finally(() => setLoading(false));
        }
    }, [pageId, isNew, addToast]);

    const handleFieldChange = (field: keyof CmsPage, value: any) => {
        setPage(p => ({ ...p, [field]: value }));
    };

    const handleSeoChange = (field: keyof SeoData, value: string) => {
        setPage(p => ({ ...p, seo: { ...p.seo!, [field]: value } }));
    };

    const handleBlockUpdate = (blockId: string, content: any) => {
        setPage(p => ({
            ...p,
            blocks: p.blocks?.map(b => b.id === blockId ? { ...b, content } : b)
        }));
    };

    const addBlock = (type: 'text' | 'image') => {
        const newBlock: PageBlock = {
            id: `block-${Date.now()}`,
            type,
            order: (page.blocks?.length || 0) + 1,
            content: type === 'text' ? { text: '' } : { mediaId: '', caption: '' },
        };
        setPage(p => ({ ...p, blocks: [...(p.blocks || []), newBlock] }));
    };

    const handleSave = async (newStatus?: PageStatus) => {
        if (!user) return;
        setIsSaving(true);
        const currentStatus = newStatus || page.status || 'Draft';
        
        try {
            if (isNew) {
                const newPage = await cmsService.createPage({ title: page.title!, slug: page.slug!, blocks: page.blocks!, seo: page.seo! }, user);
                if (currentStatus !== 'Draft') {
                    await cmsService.updatePageStatus(newPage.id, currentStatus, user);
                }
                addToast('Page created successfully!', 'success');
                navigate(`/school/${siteId}/cms/pages/edit/${newPage.id}`);
            } else {
                await cmsService.updatePage(pageId, { title: page.title, slug: page.slug, blocks: page.blocks, seo: page.seo }, user);
                if (newStatus) {
                    await cmsService.updatePageStatus(pageId, newStatus, user);
                    setPage(p => ({...p, status: newStatus}));
                }
                addToast('Page saved successfully!', 'success');
            }
        } catch {
            addToast('Failed to save page.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>Loading editor...</div>;

    return (
        <div className="space-y-6">
            <Link to={`/school/${siteId}/cms/pages`} className="text-sm text-indigo-600">&larr; Back to Pages</Link>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <input value={page.title} onChange={e => handleFieldChange('title', e.target.value)} placeholder="Page Title" className="w-full text-2xl font-bold p-2 border-b-2" />
                    
                    {page.blocks?.map(block => (
                        <div key={block.id} className="bg-white p-4 rounded-lg shadow-sm border">
                           <h3 className="text-sm font-medium text-gray-500 capitalize mb-2">{block.type} Block</h3>
                           <PageBlockEditor block={block} onUpdate={handleBlockUpdate} />
                        </div>
                    ))}
                     <div className="flex gap-2">
                        <button onClick={() => addBlock('text')} className="px-3 py-1 text-sm bg-gray-200 rounded-md">+ Text</button>
                        <button onClick={() => addBlock('image')} className="px-3 py-1 text-sm bg-gray-200 rounded-md">+ Image</button>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                        <h3 className="font-semibold">Publishing</h3>
                        <p>Status: <span className="font-bold">{page.status}</span></p>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleSave('Draft')} disabled={isSaving} className="px-4 py-2 text-sm bg-gray-200 rounded-md w-full">Save Draft</button>
                            <button onClick={() => handleSave('Published')} disabled={isSaving} className="px-4 py-2 text-sm text-white bg-green-600 rounded-md w-full">{isSaving ? 'Saving...' : 'Publish'}</button>
                            {page.status === 'Published' && <button onClick={() => handleSave('Draft')} disabled={isSaving} className="px-4 py-2 text-sm text-white bg-yellow-600 rounded-md w-full">Revert to Draft</button>}
                        </div>
                    </div>
                     <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                        <h3 className="font-semibold">Settings</h3>
                        <div><label className="text-sm">Slug</label><input value={page.slug} onChange={e => handleFieldChange('slug', e.target.value)} className="w-full p-1 border rounded-md" /></div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                        <h3 className="font-semibold">SEO</h3>
                        <div><label className="text-sm">Meta Title</label><input value={page.seo?.title} onChange={e => handleSeoChange('title', e.target.value)} className="w-full p-1 border rounded-md" /></div>
                        <div><label className="text-sm">Meta Description</label><textarea value={page.seo?.description} onChange={e => handleSeoChange('description', e.target.value)} className="w-full p-1 border rounded-md" rows={3}/></div>
                        <div><label className="text-sm">Keywords</label><input value={page.seo?.keywords} onChange={e => handleSeoChange('keywords', e.target.value)} className="w-full p-1 border rounded-md" /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageEditorPage;
