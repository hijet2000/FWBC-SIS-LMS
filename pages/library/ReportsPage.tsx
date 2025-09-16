import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { listOverdueItems, listBooks } from '../../lib/libraryService';
import type { EnrichedLoan, Book } from '../../types';

const KpiCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-800">{value}</p>
    </div>
);

const ReportsPage: React.FC = () => {
    const { addToast } = useToast();
    const [overdue, setOverdue] = useState<EnrichedLoan[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([listOverdueItems(), listBooks()])
            .then(([overdueData, bookData]) => {
                setOverdue(overdueData);
                setBooks(bookData);
            })
            .catch(() => addToast('Failed to load report data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    const stats = useMemo(() => {
        const totalFines = overdue.reduce((acc, loan) => acc + loan.fine, 0);
        const totalCopies = books.reduce((acc, book) => acc + book.copies.length, 0);
        return {
            overdueCount: overdue.length,
            totalFines: `£${totalFines.toFixed(2)}`,
            totalBooks: books.length,
            totalCopies,
        };
    }, [overdue, books]);
    
    const sendNotices = () => {
        addToast(`Sending ${overdue.length} overdue notices (mock)...`, 'info');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Library Reports</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Overdue Items" value={stats.overdueCount} />
                <KpiCard title="Total Fines Due" value={stats.totalFines} />
                <KpiCard title="Total Unique Titles" value={stats.totalBooks} />
                <KpiCard title="Total Copies" value={stats.totalCopies} />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center">
                     <h2 className="text-xl font-semibold">Overdue Items</h2>
                     <button onClick={sendNotices} disabled={overdue.length === 0} className="px-4 py-2 bg-yellow-500 text-white rounded-md disabled:bg-gray-400">Send Notices</button>
                </div>
                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr>
                            <th className="p-3 text-left text-xs uppercase">Member</th>
                            <th className="p-3 text-left text-xs uppercase">Book</th>
                            <th className="p-3 text-left text-xs uppercase">Due Date</th>
                            <th className="p-3 text-left text-xs uppercase">Fine</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                            overdue.map(loan => (
                                <tr key={loan.id}>
                                    <td className="p-3 text-sm">{loan.memberName}</td>
                                    <td className="p-3 text-sm">{loan.bookTitle}</td>
                                    <td className="p-3 text-sm">{loan.dueAt}</td>
                                    <td className="p-3 text-sm font-bold text-red-600">£{loan.fine.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;