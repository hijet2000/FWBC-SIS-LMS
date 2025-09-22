
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as cmsService from '../../lib/cmsService';
import type { CmsPost, CmsPostType, PageStatus } from '../../types';

const statusStyles: Record<PageStatus, string> = {
    Draft: 'bg-gray-100 text-gray-800',
    InReview: 'bg-yellow-100 text-yellow-800',
    Published: 'bg-green-100 text-green-800',
    Archived: 'bg-red-100 text-red-800',
};

const PostsListPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();
    const [posts, setPosts] = useState<CmsPost[]>([]);
    const [loading, setLoading] = useState(true);

    const filter = searchParams.get('type') || 'all';

    const fetchData = useCallback(() => {
        setLoading(true);
        cmsService.listPosts()
            .then(setPosts)
            .catch(() => addToast('Failed to load posts.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredPosts = useMemo(() => {
        if (filter === 'all') return posts;
        return posts.filter(p => p.postType === filter);
    }, [posts, filter]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">News & Events</h1>
                <Link to={`/school/${siteId}/cms/posts/new`} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">New Post</Link>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <select value={filter} onChange={e => setSearchParams({ type: e.target.value })} className="rounded-md">
                    <option value="all">All Types</option>
                    <option value="News">News</option>
                    <option value="Event">Event</option>
                </select>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Title</th>
                        <th className="p-3 text-left text-xs uppercase">Type</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-left text-xs uppercase">Last Updated</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        filteredPosts.map(post => (
                            <tr key={post.id}>
                                <td className="p-3 font-medium">{post.title}</td>
                                <td className="p-3 text-sm">{post.postType}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${statusStyles[post.status]}`}>{post.status}</span></td>
                                <td className="p-3 text-sm">{new Date(post.updatedAt).toLocaleString()}</td>
                                <td className="p-3 text-right text-sm font-medium">
                                    <Link to={`/school/${siteId}/cms/posts/edit/${post.id}`} className="text-indigo-600">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PostsListPage;
