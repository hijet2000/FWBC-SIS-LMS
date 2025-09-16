import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listBooks } from '../../lib/libraryService';
import type { Book } from '../../types';
import BookModal from '../../components/library/BookModal';

const CatalogPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = () => {
        setLoading(true);
        listBooks()
            .then(setBooks)
            .catch(() => addToast('Failed to load library catalog.', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [addToast]);
    
    const handleOpenModal = (book: Book | null = null) => {
        setEditingBook(book);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        fetchData();
        addToast('Book saved successfully!', 'success');
    };

    const filteredBooks = useMemo(() => {
        if (!searchTerm) return books;
        const q = searchTerm.toLowerCase();
        return books.filter(b => 
            b.title.toLowerCase().includes(q) || 
            b.author.toLowerCase().includes(q) || 
            b.isbn?.includes(q)
        );
    }, [books, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Library Catalog</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">Add Book</button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <input 
                    type="search" 
                    placeholder="Search by title, author, or ISBN..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 rounded-md border-gray-300"
                />
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Title</th>
                        <th className="p-3 text-left text-xs uppercase">Author</th>
                        <th className="p-3 text-left text-xs uppercase">ISBN</th>
                        <th className="p-3 text-center text-xs uppercase">Copies (Available)</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading books...</td></tr> :
                        filteredBooks.map(book => {
                            const availableCopies = book.copies.filter(c => c.status === 'Available').length;
                            return (
                                <tr key={book.id}>
                                    <td className="p-3 font-medium">{book.title}</td>
                                    <td className="p-3 text-sm">{book.author}</td>
                                    <td className="p-3 text-sm font-mono">{book.isbn}</td>
                                    <td className="p-3 text-sm text-center">{book.copies.length} ({availableCopies})</td>
                                    <td className="p-3 text-right text-sm">
                                        <button onClick={() => handleOpenModal(book)} className="text-indigo-600 hover:underline">Manage</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {user && <BookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} initialData={editingBook} actor={user} />}
        </div>
    );
};

export default CatalogPage;