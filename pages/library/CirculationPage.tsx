import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as libraryService from '../../lib/libraryService';
import type { LibraryMember, BookCopy, EnrichedLoan, Book } from '../../types';

const CirculationPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const memberInputRef = useRef<HTMLInputElement>(null);
    const bookInputRef = useRef<HTMLInputElement>(null);

    const [memberBarcode, setMemberBarcode] = useState('');
    const [bookBarcode, setBookBarcode] = useState('');
    
    const [currentMember, setCurrentMember] = useState<LibraryMember | null>(null);
    const [currentLoans, setCurrentLoans] = useState<EnrichedLoan[]>([]);
    
    const [transaction, setTransaction] = useState<{
        type: 'issue' | 'return';
        copy: BookCopy & { book: Book | null };
        details: string;
        fine?: number;
    } | null>(null);

    const reset = () => {
        setMemberBarcode('');
        setBookBarcode('');
        setCurrentMember(null);
        setCurrentLoans([]);
        setTransaction(null);
        memberInputRef.current?.focus();
    };

    const handleMemberScan = useCallback(async () => {
        if (!memberBarcode) return;
        const member = await libraryService.getMemberByBarcode(memberBarcode);
        if (member) {
            setCurrentMember(member);
            const loans = await libraryService.listLoansForMember(member.id);
            setCurrentLoans(loans.filter(l => !l.returnedAt));
            bookInputRef.current?.focus();
        } else {
            addToast('Member not found.', 'error');
            setMemberBarcode('');
        }
    }, [memberBarcode, addToast]);
    
    const handleBookScan = useCallback(async () => {
        if (!bookBarcode) return;
        const copy = await libraryService.getCopyByBarcode(bookBarcode);
        if (!copy) {
            addToast('Book copy not found.', 'error');
            setBookBarcode('');
            return;
        }
        
        const books = await libraryService.listBooks();
        const book = books.find(b => b.id === copy.bookId) || null;
        
        if (copy.status === 'Available') {
            if (!currentMember) {
                addToast('Scan a member card first to issue a book.', 'warning');
                return;
            }
            setTransaction({ type: 'issue', copy: {...copy, book}, details: `Issuing to ${currentMember.name}` });
        } else if (copy.status === 'On Loan') {
            const allLoans = await libraryService.listOverdueItems(); // Broad search as we don't know the member yet
            const loan = allLoans.find(l=>l.copyId === copy.id && !l.returnedAt);
            setTransaction({ type: 'return', copy: {...copy, book}, details: `Returning from ${loan?.memberName || 'unknown'}`, fine: loan?.fine || 0 });
        } else {
             addToast(`Copy is ${copy.status} and cannot be circulated.`, 'warning');
        }
        setBookBarcode('');
    }, [bookBarcode, currentMember, addToast]);
    
    const confirmTransaction = async () => {
        if (!transaction || !user) return;
        try {
            if (transaction.type === 'issue' && currentMember) {
                await libraryService.issueBook(transaction.copy.id, currentMember.id, user);
                addToast('Book issued successfully!', 'success');
            } else {
                const { fine } = await libraryService.returnBook(transaction.copy.id, user);
                addToast(`Book returned. Fine of £${fine.toFixed(2)} applied.`, 'success');
            }
            reset();
        } catch (e) {
            addToast('Transaction failed.', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Circulation Desk</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Scan & Transaction Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <form onSubmit={e => { e.preventDefault(); handleMemberScan(); }}>
                            <label htmlFor="member-scan" className="font-bold">1. Scan Member Card</label>
                            <input id="member-scan" ref={memberInputRef} value={memberBarcode} onChange={e => setMemberBarcode(e.target.value)} placeholder="MEM-..." className="w-full font-mono rounded-md mt-1"/>
                        </form>
                    </div>
                     <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <form onSubmit={e => { e.preventDefault(); handleBookScan(); }}>
                            <label htmlFor="book-scan" className="font-bold">2. Scan Book Barcode</label>
                            <input id="book-scan" ref={bookInputRef} value={bookBarcode} onChange={e => setBookBarcode(e.target.value)} placeholder="LIB-..." className="w-full font-mono rounded-md mt-1"/>
                        </form>
                    </div>
                     {transaction && (
                        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 text-center space-y-3">
                            <h3 className="font-bold text-lg capitalize">{transaction.type}</h3>
                            <p>{transaction.copy.book?.title}</p>
                            <p className="text-sm">{transaction.details}</p>
                            {transaction.fine !== undefined && <p className="font-bold text-xl text-red-600">Fine: £{transaction.fine.toFixed(2)}</p>}
                            <div className="flex gap-4 justify-center">
                                <button onClick={reset} className="px-4 py-2 border rounded-md">Cancel</button>
                                <button onClick={confirmTransaction} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Confirm</button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Right: Member Info Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-4 rounded-lg shadow-sm border min-h-[300px]">
                        <h2 className="text-xl font-semibold mb-4">Member Details</h2>
                        {currentMember ? (
                            <div>
                                <p><strong>Name:</strong> {currentMember.name}</p>
                                <p><strong>Type:</strong> {currentMember.memberType}</p>
                                <h3 className="font-semibold mt-4">Current Loans ({currentLoans.length}/{currentMember.maxConcurrentLoans})</h3>
                                <ul className="text-sm list-disc list-inside">
                                    {currentLoans.map(loan => <li key={loan.id}>{loan.bookTitle} (Due: {loan.dueAt})</li>)}
                                </ul>
                            </div>
                        ) : <p className="text-gray-500">Scan a member card to see details.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CirculationPage;