

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as libraryService from '../../lib/libraryService';
import type { BookWithCopies, BookCopy, BookCopyStatus } from '../../types';
import BookModal from '../../components/library/BookModal';
import { exportToCsv } from '../../lib/exporters';

const statusStyles: Record<BookCopyStatus, string> = {
    Available: 'bg-green-100 text-green-800',
    'On Loan': 'bg-blue-100 text-blue-800',
    Reserved: 'bg-yellow-100 text-yellow-800',
    Maintenance: 'bg-orange-100 text-orange-800',
    Lost: 'bg-red-100 text-red-800',
};

const BookRow: React.FC<{ book: BookWithCopies; onEdit: (book: BookWithCopies) => void; onAddCopy: (bookId: string) => void; }> = ({ book, onEdit, onAddCopy }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const availableCopies = book.copies.filter(c => c.status === 'Available').length;

    return (
        <>
            <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-indigo-600 w-6 h-6 rounded-full hover:bg-indigo-100 flex items-center justify-center">
                        {isExpanded ? '-' : '+'}
                    </button>
                </td>
                <td className="px-4 py-3 font-medium">{book.title}</td>
                <td className="px-4 py-3 text-gray-600">{book.author}</td>
                <td className="px-4 py-3 text-gray-600">{book.category}</td>
                <td className="px-4 py-3 font-mono text-sm">{book.isbn}</td>
                <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {availableCopies} / {book.copies.length}
                    </span>
                </td>
                <td className="px-4 py-3 text-right">
                    <button onClick={() => onEdit(book)} className="text-indigo-600 font-medium">Edit</button>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={7} className="p-4 bg-gray-50">
                        <h4 className="font-semibold mb-2">Copies</h4>
                        <table className="min-w-full bg-white text-sm">
                            <thead className="bg-gray-100 text-xs"><tr>
                                <th className="p-2 text-left">Barcode</th>
                                <th className="p-2 text-left">Status</th>
                                <th className="p-2 text-left">Location (Rack/Shelf)</th>
                                <th className="p-2 text-left">Condition</th>
                            </tr></thead>
                            <tbody>
                                {book.copies.map(copy => (
                                    <tr key={copy.id}>
                                        <td className="p-2 font-mono">{copy.barcode}</td>
                                        <td className="p-2"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[copy.status]}`}>{copy.status}</span></td>
                                        <td className="p-2">{copy.rack}/{copy.shelf}</td>
                                        <td className="p-2">{copy.condition}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={4} className="p-2">
                                        <button onClick={() => onAddCopy(book.id)} className="text-xs text-indigo-600 hover:underline">+ Add New Copy</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            )}
        </>
    );
};


const CatalogPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [books, setBooks] = useState<BookWithCopies[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<BookWithCopies | null>(null);
    const [filterQuery, setFilterQuery] = useState('');

    const fetchData = useCallback(() => {
        setLoading(true);
        libraryService.listBooksWithCopies()
            .then(setBooks)
            .catch(() => addToast('Failed to load catalog.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (book: BookWithCopies | null = null) => {
        setEditingBook(book);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setEditingBook(null);
        fetchData();
    };

    const handleAddCopy = async (bookId: string) => {
        if (!user) return;
        try {
            // For simplicity, we add with default values. A more complex UI could prompt for these.
            await libraryService.createCopy(bookId, { rack: 'New', shelf: '1', condition: 'Good' }, user);
            addToast('New copy added successfully.', 'success');
            fetchData();
        } catch {
            addToast('Failed to add copy.', 'error');
        }
    };

    const handleExport = () => {
        const flatData = books.flatMap(book => 
            book.copies.map(copy => ({
                bookTitle: book.title,
                author: book.author,
                isbn: book.isbn,
                category: book.category,
                barcode: copy.barcode,
                status: copy.status,
                location: `${copy.rack || 'N/A'}/${copy.shelf || 'N/A'}`,
                condition: copy.condition,
            }))
        );
        exportToCsv('library_catalog_all_copies.csv', [
            { key: 'barcode', label: 'Barcode' },
            { key: 'status', label: 'Status' },
            { key: 'bookTitle', label: 'Title' },
            { key: 'author', label: 'Author' },
            { key: 'isbn', label: 'ISBN' },
            { key: 'category', label: 'Category' },
            { key: 'location', label: 'Location' },
            { key: 'condition', label: 'Condition' },
        ], flatData);
    };

    const filteredBooks = useMemo(() => {
        if (!filterQuery) return books;
        const q = filterQuery.toLowerCase();
        return books.filter(book => 
            book.title.toLowerCase().includes(q) ||
            book.author.toLowerCase().includes(q) ||
            book.isbn?.includes(q)
        );
    }, [books, filterQuery]);


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Library Catalog</h1>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md">Export CSV</button>
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Add Book</button>
                </div>
            </div>
            
             <div className="bg-white p-4 rounded-lg shadow-sm border">
                <input 
                    type="search" 
                    placeholder="Search by title, author, or ISBN..." 
                    value={filterQuery}
                    onChange={e => setFilterQuery(e.target.value)}
                    className="w-full rounded-md border-gray-300" 
                />
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 text-sm">
                    <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-3 w-12"></th>
                        <th className="px-4 py-3 text-left text-xs uppercase">Title</th>
                        <th className="px-4 py-3 text-left text-xs uppercase">Author</th>
                        <th className="px-4 py-3 text-left text-xs uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs uppercase">ISBN</th>
                        <th className="px-4 py-3 text-left text-xs uppercase">Copies Available</th>
                        <th className="px-4 py-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={7} className="p-4 text-center">Loading catalog...</td></tr> :
                        filteredBooks.map(book => <BookRow key={book.id} book={book} onEdit={handleOpenModal} onAddCopy={handleAddCopy} />)}
                    </tbody>
                </table>
            </div>

            {isModalOpen && user && (
                <BookModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaveSuccess={handleSaveSuccess}
                    initialData={editingBook}
                    actor={user}
                />
            )}
        </div>
    );
};

export default CatalogPage;
