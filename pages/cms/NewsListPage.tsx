
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listNews } from '../../lib/cmsService';
import NewsModal from '../../components/cms/NewsModal';

const NewsListPage: React.FC = () => {
    const { user } = useAuth();
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);

    const fetchData = () => {
        listNews().then(setArticles).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (article: any = null) => {
        setEditingArticle(article);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">News</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md">New Article</button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                {loading ? <p>Loading...</p> : articles.map(article => (
                    <div key={article.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                            <p className="font-semibold">{article.title}</p>
                            <p className="text-sm text-gray-500">{new Date(article.publishedAt).toLocaleDateString()} - {article.status}</p>
                        </div>
                        <button onClick={() => handleOpenModal(article)}>Edit</button>
                    </div>
                ))}
            </div>

            {user && <NewsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingArticle} actor={user} />}
        </div>
    );
};

export default NewsListPage;
