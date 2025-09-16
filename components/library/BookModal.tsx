import React, { useState, useEffect } from 'react';
import type { Book, BookCopy, User } from '../../types';
import { saveBook } from '../../lib/libraryService';
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
    const [book, setBook] = useState<Omit<Book, 'id'> | Book>({ title: '', author: '', isbn: '', category: '', language: 'English', copies: [] });
    const [isSaving, setIsSaving] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);

    useEffect(() => {
        if (initialData) {
            setBook(JSON.parse(JSON.stringify(initialData))); // Deep copy
        } else {
            setBook({ title: '', author: '', isbn: '', category: '', language: 'English', copies: [] });
        }
    }, [initialData, isOpen]);

    const handleBookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBook({ ...book, [e.target.name]: e.target.value });
    };

    const handleCopyChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newCopies = [...book.copies];
        newCopies[index] = { ...newCopies[index], [e.target.name]: e.target.value } as BookCopy;
        setBook({ ...book, copies: newCopies });
    };

    const addCopy = () => {
        const newCopy: BookCopy = {
            id: `new-${Date.now()}`,
            bookId: (book as Book).id || '',
            barcode: `LIB-${Math.floor(10000 + Math.random() * 90000)}`,
            status: 'Available',
        };
        setBook({ ...book, copies: [...book.copies, newCopy] });
    };

    const handleIsbnLookup = async () => {
        const isbn = book.isbn?.replace(/-/g, '');
        if (!isbn) {
            addToast('Please enter an ISBN to look up.', 'warning');
            return;
        }
        setIsLookingUp(true);
        try {
            const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`);
            if (!response.ok) throw new Error('Network response was not ok.');
            
            const data = await response.json();
            const bookData = data[`ISBN:${isbn}`];

            if (bookData) {
                setBook(prev => ({
                    ...prev,
                    title: bookData.title || prev.title,
                    author: bookData.authors ? bookData.authors.map((a: { name: string }) => a.name).join(', ') : prev.author,
                    category: bookData.subjects ? bookData.subjects[0].name : prev.category,
                }));
                addToast('Book details populated!', 'success');
            } else {
                addToast('ISBN not found in the Open Library database.', 'warning');
            }

        } catch (error) {
            console.error("ISBN Lookup failed:", error);
            addToast('Failed to fetch book details.', 'error');
        } finally {
            setIsLookingUp(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await saveBook(book, actor);
        onSaveSuccess();
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Book' : 'Add New Book'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <input name="title" value={book.title} onChange={handleBookChange} placeholder="Title" className="w-full rounded-md" required />
                    <input name="author" value={book.author} onChange={handleBookChange} placeholder="Author" className="w-full rounded-md" required />
                    
                    <div>
                        <label htmlFor="isbn" className="sr-only">ISBN</label>
                        <div className="flex gap-2">
                            <input id="isbn" name="isbn" value={book.isbn} onChange={handleBookChange} placeholder="ISBN" className="flex-grow w-full rounded-md" />
                            <button type="button" onClick={handleIsbnLookup} disabled={isLookingUp} className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:bg-gray-200">
                                {isLookingUp ? '...' : 'Lookup'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input name="category" value={book.category} onChange={handleBookChange} placeholder="Category" className="w-full rounded-md" />
                        <input name="language" value={book.language} onChange={handleBookChange} placeholder="Language" className="w-full rounded-md" />
                    </div>

                    <div className="pt-4 mt-4 border-t">
                        <h3 className="font-semibold flex justify-between items-center">
                            Copies ({book.copies.length})
                            <button type="button" onClick={addCopy} className="text-sm text-indigo-600">+ Add Copy</button>
                        </h3>
                        <div className="space-y-3 mt-2">
                            {book.copies.map((copy, index) => (
                                <div key={copy.id} className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded-md border">
                                    <input value={copy.barcode} onChange={e => handleCopyChange(index, e)} name="barcode" placeholder="Barcode" className="text-sm col-span-2"/>
                                    <input value={copy.rack} onChange={e => handleCopyChange(index, e)} name="rack" placeholder="Rack" className="text-sm"/>
                                    <input value={copy.shelf} onChange={e => handleCopyChange(index, e)} name="shelf" placeholder="Shelf" className="text-sm"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md">{isSaving ? 'Saving...' : 'Save Book'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default BookModal;