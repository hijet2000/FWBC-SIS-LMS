
import React, { useState, useEffect } from 'react';
import type { Book, User } from '../../types';
import * as libraryService from '../../lib/libraryService';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialData: Book | null;
  actor: User;
}

const BookModal: React.FC<BookModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, actor }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        title: '', author: '', isbn: '', category: '', publisher: '', publishedYear: new Date().getFullYear(),
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData?.title || '',
                author: initialData?.author || '',
                isbn: initialData?.isbn || '',
                category: initialData?.category || '',
                publisher: initialData?.publisher || '',
                publishedYear: initialData?.publishedYear || new Date().getFullYear(),
            });
            setError('');
        }
    }, [isOpen, initialData]);

    const handleIsbnLookup = async () => {
        if (!formData.isbn) return;
        setIsLookingUp(true);
        try {
            const data = await libraryService.lookupIsbn(formData.isbn);
            if (data) {
                setFormData(prev => ({ ...prev, ...data }));
                addToast('ISBN data populated.', 'info');
            } else {
                addToast('ISBN not found in mock database.', 'warning');
            }
        } catch {
            addToast('ISBN lookup failed.', 'error');
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.author) {
            setError('Title and Author are required.');
            return;
        }
        setIsSaving(true);
        try {
            const payload = { ...formData, publishedYear: Number(formData.publishedYear) };
            if (initialData) {
                await libraryService.updateBook(initialData.id, payload, actor);
                addToast('Book updated successfully.', 'success');
            } else {
                const newBook = await libraryService.createBook(payload, actor);
                // Automatically add the first copy for a new book
                await libraryService.createCopy(newBook.id, { rack: 'A1', shelf: '1', condition: 'New' }, actor);
                addToast('Book created with one copy.', 'success');
            }
            onSaveSuccess();
        } catch {
            setError('Failed to save book details.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Book' : 'Add New Book'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Title" required className="w-full rounded-md" />
                    <input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} placeholder="Author" required className="w-full rounded-md" />
                    <div className="flex gap-2 items-center">
                        <input value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} placeholder="ISBN (Optional)" className="flex-grow rounded-md" />
                        <button type="button" onClick={handleIsbnLookup} disabled={isLookingUp} className="px-3 py-2 text-sm bg-gray-100 border rounded-md hover:bg-gray-200 disabled:opacity-50">
                            {isLookingUp ? '...' : 'Lookup'}
                        </button>
                    </div>
                    <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Category (e.g., Fiction)" className="w-full rounded-md" />
                     <div className="grid grid-cols-2 gap-4">
                        <input value={formData.publisher} onChange={e => setFormData({ ...formData, publisher: e.target.value })} placeholder="Publisher" className="w-full rounded-md" />
                        <input type="number" value={formData.publishedYear} onChange={e => setFormData({ ...formData, publishedYear: Number(e.target.value) })} placeholder="Year" className="w-full rounded-md" />
                    </div>
                    {!initialData && <p className="text-xs text-gray-500">Note: The first copy will be automatically created with barcode and status 'Available'.</p>}
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Book'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default BookModal;
