
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as cmsService from '../../lib/cmsService';
import type { CmsPost, CmsPostType } from '../../types';

interface PostListPageProps {
    postType: CmsPostType;
}

const PostListPage: React.FC<PostListPageProps> = ({ postType }) => {
    const { siteSlug } = useParams<{ siteSlug: string }>();
    const [posts, setPosts] = useState<CmsPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        cmsService.listPosts({ postType })
            .then(data => setPosts(data.filter(p => p.status === 'Published')))
            .finally(() => setLoading(false));
    }, [postType]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="bg-white p-8 rounded-lg shadow space-y-6">
            <h1 className="text-3xl font-bold">{postType}</h1>
            
            {posts.length === 0 ? <p>No {postType.toLowerCase()} found.</p> :
            <ul className="divide-y divide-gray-200">
                {posts.map(post => (
                    <li key={post.id} className="py-4">
                        <Link to={`/${siteSlug}/${postType.toLowerCase()}/${post.slug}`} className="block hover:bg-gray-50 p-2 -m-2 rounded-md">
                            <p className="text-xs text-gray-500">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</p>
                            <h2 className="text-xl font-semibold text-gray-800">{post.title}</h2>
                            <p className="text-gray-600 mt-1">{post.excerpt}</p>
                        </Link>
                    </li>
                ))}
            </ul>
            }
        </div>
    );
};

export default PostListPage;
