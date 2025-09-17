
import React from 'react';
import { Link, useParams } from 'react-router-dom';

// This is a placeholder for a page that would fetch and list all news articles
const PublicNewsIndexPage: React.FC = () => {
    const { siteId } = useParams();
    // Mock data
    const mockArticles = [
        { slug: 'sports-day-2025', title: 'Sports Day Success!', excerpt: 'A fantastic day of competition...' },
    ];
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold">News & Announcements</h1>
            <div className="mt-8 space-y-6">
                {mockArticles.map(article => (
                    <div key={article.slug} className="p-4 border rounded-lg">
                        <Link to={`/site/${siteId}/news/${article.slug}`} className="text-2xl font-semibold hover:text-indigo-600">{article.title}</Link>
                        <p className="mt-2 text-gray-600">{article.excerpt}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PublicNewsIndexPage;
