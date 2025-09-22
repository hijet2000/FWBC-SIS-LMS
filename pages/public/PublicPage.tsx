import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as cmsService from '../../lib/cmsService';
import type { CmsPage, PageBlock } from '../../types';

const BlockRenderer: React.FC<{ block: PageBlock }> = ({ block }) => {
    switch (block.type) {
        case 'text':
            return <p className="text-gray-700 leading-relaxed my-4">{block.content.text}</p>;
        case 'image':
            return (
                <figure className="my-6">
                    <img src={`https://placehold.co/800x400/EBF4FF/7F8A9A?text=Image+Placeholder`} alt={block.content.caption || 'CMS Image'} className="rounded-lg shadow-md" />
                    {block.content.caption && <figcaption className="text-center text-sm text-gray-500 mt-2">{block.content.caption}</figcaption>}
                </figure>
            );
        default:
            return null;
    }
};

interface PublicPageProps {
    isHomepage?: boolean;
}

const PublicPage: React.FC<PublicPageProps> = ({ isHomepage = false }) => {
    const { pageSlug } = useParams<{ pageSlug: string }>();
    const [page, setPage] = useState<CmsPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const slug = isHomepage ? 'homepage' : pageSlug;
        if (!slug) {
            setError(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(false);
        cmsService.getPageBySlug(slug)
            .then(data => {
                if (data) {
                    setPage(data);
                    document.title = data.seo.title || data.title;
                } else {
                    setError(true);
                }
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));

    }, [pageSlug, isHomepage]);

    if (loading) {
        return <div className="text-center p-12">Loading...</div>;
    }

    if (error || !page) {
        return (
            <div className="text-center p-12 bg-white rounded-lg shadow">
                <h1 className="text-4xl font-bold text-red-600">404</h1>
                <p className="text-xl text-gray-700 mt-2">Page Not Found</p>
                <p className="text-gray-500 mt-4">The page you are looking for does not exist or may have been moved.</p>
            </div>
        );
    }
    
    return (
        <article className="prose lg:prose-xl max-w-none bg-white p-8 rounded-lg shadow">
            <h1>{page.title}</h1>
            <div>
                {page.blocks.sort((a, b) => a.order - b.order).map(block => (
                    <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
        </article>
    );
};

export default PublicPage;