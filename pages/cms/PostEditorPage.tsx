
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as cmsService from '../../lib/cmsService';
import type { CmsPost, CmsPostType, PageStatus } from '../../types';

const PostEditorPage: React.FC = () => {
    const { siteId, postId } = useParams<{ siteId: string, postId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const isNew = !postId;

    const [post, setPost] = useState<Partial<CmsPost>>({ title: '', slug: '', postType: 'News', status: 'Draft', content: '', excerpt: '' });
    const [loading, setLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (postId) {
            cmsService.getPost(postId).then(setPost).finally(() => setLoading(false));
        }
    }, [postId]);

    const handleSave = async (newStatus?: PageStatus) => {
        if (!user || !post.title || !post.slug || !post.postType) {
            addToast('Title, Slug, and Type are required.', 'error');
            return;
        }
        setIsSaving(true);
        const statusToSave = newStatus || post.status || 'Draft';
        try {
            if (isNew) {
                const newPost = await cmsService.createPost({ title: post.title, slug: post.slug, postType: post.postType }, user);
                await cmsService.updatePost(newPost.id, { ...post, status: statusToSave }, user);
                addToast('Post created!', 'success');
                navigate(`/school/${siteId}/cms/posts/edit/${newPost.id}`);
            } else if (postId) {
                await cmsService.updatePost(postId, { ...post, status: statusToSave }, user);
                addToast('Post saved!', 'success');
                fetchData();
            }
        } catch {
            addToast('Failed to save post.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const fetchData = () => {
        if (postId) {
            cmsService.getPost(postId).then(setPost);
        }
    };

    if (loading) return <div>Loading post editor...</div>;

    return (
        <div className="space-y-6">
            <Link to={`/school/${siteId}/cms/posts`} className="text-sm text-indigo-600">&larr; Back to Posts</Link>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <input value={post.title || ''} onChange={e => setPost({ ...post, title: e.target.value })} placeholder="Post Title" className="w-full text-2xl font-bold p-2 border-b-2" />
                    <textarea value={post.excerpt || ''} onChange={e => setPost({ ...post, excerpt: e.target.value })} placeholder="Excerpt..." rows={2} className="w-full p-2 border rounded-md" />
                    <textarea value={post.content || ''} onChange={e => setPost({ ...post, content: e.target.value })} placeholder="Main content (Markdown supported)..." rows={15} className="w-full p-2 border rounded-md" />
                </div>
                <div className="lg:col-span-1 space-y-4 sticky top-24">
                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                        <h3 className="font-semibold">Publishing</h3>
                        <p>Status: <span className="font-bold">{post.status}</span></p>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleSave()} disabled={isSaving} className="px-4 py-2 text-sm bg-gray-200 rounded-md w-full">Save Draft</button>
                            <button onClick={() => handleSave('Published')} disabled={isSaving} className="px-4 py-2 text-sm text-white bg-green-600 rounded-md w-full">{isSaving ? 'Saving...' : 'Publish'}</button>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                        <h3 className="font-semibold">Settings</h3>
                        <div><label className="text-sm">Type</label>
                            <select value={post.postType} onChange={e => setPost({ ...post, postType: e.target.value as CmsPostType })} className="w-full p-1 border rounded-md" disabled={!isNew}>
                                <option value="News">News</option><option value="Event">Event</option>
                            </select>
                        </div>
                        <div><label className="text-sm">Slug</label><input value={post.slug || ''} onChange={e => setPost({ ...post, slug: e.target.value })} className="w-full p-1 border rounded-md" /></div>
                        <div><label className="text-sm">Featured Image</label><div className="flex gap-2"><input value={post.featuredImageId || ''} onChange={e => setPost({ ...post, featuredImageId: e.target.value })} placeholder="media-id" className="flex-grow p-1 border rounded-md" /><button className="text-xs px-2 bg-gray-100 rounded-md">Select</button></div></div>
                    </div>
                    {post.postType === 'Event' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                            <h3 className="font-semibold">Event Details</h3>
                            <div><label className="text-sm">Event Date</label><input type="date" value={post.eventDate || ''} onChange={e => setPost({ ...post, eventDate: e.target.value })} className="w-full p-1 border rounded-md" /></div>
                            <div><label className="text-sm">Event Time</label><input type="time" value={post.eventTime || ''} onChange={e => setPost({ ...post, eventTime: e.target.value })} className="w-full p-1 border rounded-md" /></div>
                            <div><label className="text-sm">Location</label><input value={post.eventLocation || ''} onChange={e => setPost({ ...post, eventLocation: e.target.value })} className="w-full p-1 border rounded-md" /></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostEditorPage;
