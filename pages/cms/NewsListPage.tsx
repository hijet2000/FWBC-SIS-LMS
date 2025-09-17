
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listNews } from '../../lib/cmsService';
import NewsModal from '../../components/cms/NewsModal';
import { NewsArticle } from '../../types';

const NewsListPage: React.FC = () => {
    const { user } = useAuth();
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

    const fetchData = () => {
        listNews().then(setArticles).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (article: NewsArticle | null = null) => {
        setEditingArticle(article);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingArticle(null);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">News</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">New Article</button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border">
                <ul className="divide-y divide-gray-200">
                {loading ? <li className="p-4 text-center">Loading...</li> : articles.map(article => (
                    <li key={article.id} className="flex justify-between items-center p-4">
                        <div>
                            <p className="font-semibold">{article.title}</p>
                            <p className="text-sm text-gray-500">{new Date(article.publishedAt).toLocaleDateString()} - {article.status}</p>
                        </div>
                        <button onClick={() => handleOpenModal(article)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                    </div>
                ))}
                </ul>
            </div>

            {user && <NewsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingArticle} actor={user} />}
        </div>
    );
};

export default NewsListPage;
