
import React, { useState, useEffect } from 'react';
import type { User, NewsArticle } from '../../types';
import { saveNews } from '../../lib/cmsService';
import Modal from '../ui/Modal';

const NewsModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: () => void, initialData: NewsArticle | null, actor: User }> = ({ isOpen, onClose, onSave, initialData, actor }) => {
    const [article, setArticle] = useState({ title: '', content: '', status: 'Draft' as NewsArticle['status'] });

    useEffect(() => {
        if (initialData) {
            setArticle(initialData);
        } else {
            setArticle({ title: '', content: '', status: 'Draft' });
        }
    }, [initialData, isOpen]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveNews({ id: initialData?.id, ...article }, actor);
        onSave();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit News Article' : 'New News Article'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <input value={article.title} onChange={e => setArticle({...article, title: e.target.value})} placeholder="Title" className="w-full rounded-md border-gray-300" required/>
                    <textarea value={article.content} onChange={e => setArticle({...article, content: e.target.value})} placeholder="Content (HTML supported)" className="w-full rounded-md border-gray-300" rows={10}/>
                    <select value={article.status} onChange={e => setArticle({...article, status: e.target.value as NewsArticle['status']})} className="w-full rounded-md border-gray-300">
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                    </select>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Article</button>
                </div>
            </form>
        </Modal>
    );
};

export default NewsModal;
