
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as cmsService from '../../lib/cmsService';
import type { CmsPost } from '../../types';

const PostDetailPage: React.FC = () => {
    const { postSlug } = useParams<{ postSlug: string }>();
    const [post, setPost] = useState<CmsPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (postSlug) {
            setLoading(true);
            cmsService.getPostBySlug(postSlug)
                .then(setPost)
                .finally(() => setLoading(false));
        }
    }, [postSlug]);

    if (loading) return <div>Loading...</div>;
    if (!post) return <div>Post not found.</div>;

    return (
        <article className="prose lg:prose-xl max-w-none bg-white p-8 rounded-lg shadow">
            <p className="text-sm text-gray-500">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</p>
            <h1>{post.title}</h1>
            
            {post.postType === 'Event' && (
                <div className="p-4 bg-gray-100 rounded-md mb-6 not-prose">
                    <p><strong>Date:</strong> {post.eventDate}</p>
                    <p><strong>Time:</strong> {post.eventTime}</p>
                    <p><strong>Location:</strong> {post.eventLocation}</p>
                </div>
            )}
            
            <div>{post.content}</div>
        </article>
    );
};

export default PostDetailPage;
