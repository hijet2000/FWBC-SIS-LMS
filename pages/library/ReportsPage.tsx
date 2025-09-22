import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as libraryService from '../../lib/libraryService';
import type { OverdueLoanDetails, CirculationStats } from '../../types';
import { exportToCsv } from '../../lib/exporters';
import NoticeModal from '../../components/library/NoticeModal';

const ReportCard: React.FC<{ title: string; children: React.ReactNode; onExport?: () => void }> = ({ title, children, onExport }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
            {onExport && <button onClick={onExport} className="px-3 py-1 text-xs font-medium bg-white border rounded-md shadow-sm hover:bg-gray-50">Export CSV</button>}
        </div>
        {children}
    </div>
);

const ReportsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [overdueLoans, setOverdueLoans] = useState<OverdueLoanDetails[]>([]);
    const [stats, setStats] = useState<CirculationStats | null>(null);
    const [loading, setLoading] = useState({ loans: true, stats: true });
    const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

    const fetchData = useCallback(() => {
        setLoading({ loans: true, stats: true });
        libraryService.getOverdueLoans()
            .then(setOverdueLoans)
            .catch(() => addToast('Failed to load overdue loans.', 'error'))
            .finally(() => setLoading(prev => ({ ...prev, loans: false })));

        libraryService.getCirculationStats()
            .then(setStats)
            .catch(() => addToast('Failed to load circulation stats.', 'error'))
            .finally(() => setLoading(prev => ({ ...prev, stats: false })));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSelectLoan = (loanId: string) => {
        setSelectedLoans(prev => {
            const newSet = new Set(prev);
            if (newSet.has(loanId)) newSet.delete(loanId);
            else newSet.add(loanId);
            return newSet;
        });
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedLoans(new Set(overdueLoans.map(l => l.id)));
        } else {
            setSelectedLoans(new Set());
        }
    };
    
    const selectedLoanDetails = useMemo(() => {
        return overdueLoans.filter(l => selectedLoans.has(l.id));
    }, [overdueLoans, selectedLoans]);

    const handleSendNotices = async () => {
        if (!user || selectedLoanDetails.length === 0) return;
        try {
            await libraryService.sendOverdueNotices(Array.from(selectedLoans), user);
            addToast(`${selectedLoans.size} notice(s) sent successfully.`, 'success');
            setSelectedLoans(new Set());
            setIsNoticeModalOpen(false);
        } catch {
            addToast('Failed to send notices.', 'error');
        }
    };
    
    const handleExportOverdue = () => {
        exportToCsv('overdue_loans.csv', [
            { key: 'memberName', label: 'Member Name' },
            { key: 'bookTitle', label: 'Book Title' },
            { key: 'copyBarcode', label: 'Barcode' },
            { key: 'dueAt', label: 'Due Date' },
            { key: 'daysOverdue', label: 'Days Overdue' },
        ], overdueLoans.map(l => ({...l, dueAt: new Date(l.dueAt).toLocaleDateString() })));
    };
    
    const handleExportStats = () => {
        if (!stats) return;
        const data = [
            { metric: 'Total Loans', value: stats.totalLoans },
            { metric: 'Loans in Last 30 Days', value: stats.loansLast30Days },
            ...stats.topTitles.map(t => ({ metric: `Top Title: ${t.title}`, value: t.count })),
            ...stats.topCategories.map(c => ({ metric: `Top Category: ${c.category}`, value: c.count }))
        ];
        exportToCsv('circulation_stats.csv', [{ key: 'metric', label: 'Metric'}, {key: 'value', label: 'Value'}], data);
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Library Reports & Notices</h1>
            
            {user && <NoticeModal isOpen={isNoticeModalOpen} onClose={() => setIsNoticeModalOpen(false)} onConfirm={handleSendNotices} overdueLoans={selectedLoanDetails} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <ReportCard title="Overdue Loans" onExport={handleExportOverdue}>
                        <div className="flex justify-end mb-2">
                            <button onClick={() => setIsNoticeModalOpen(true)} disabled={selectedLoans.size === 0} className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                                Send Notices ({selectedLoans.size})
                            </button>
                        </div>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50"><tr>
                                    <th className="p-2"><input type="checkbox" onChange={handleSelectAll} /></th>
                                    <th className="p-2 text-left">Member</th>
                                    <th className="p-2 text-left">Book</th>
                                    <th className="p-2 text-left">Due Date</th>
                                    <th className="p-2 text-left">Days Overdue</th>
                                </tr></thead>
                                <tbody className="divide-y">
                                    {loading.loans ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                                    overdueLoans.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-gray-500">No overdue loans.</td></tr> :
                                    overdueLoans.map(loan => (
                                        <tr key={loan.id} className={selectedLoans.has(loan.id) ? 'bg-indigo-50' : ''}>
                                            <td className="p-2"><input type="checkbox" checked={selectedLoans.has(loan.id)} onChange={() => handleSelectLoan(loan.id)} /></td>
                                            <td className="p-2 font-medium">{loan.memberName}</td>
                                            <td className="p-2">{loan.bookTitle}</td>
                                            <td className="p-2">{new Date(loan.dueAt).toLocaleDateString()}</td>
                                            <td className="p-2 text-red-600 font-bold">{loan.daysOverdue}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ReportCard>
                </div>
                <div className="lg:col-span-1">
                    <ReportCard title="Circulation Statistics" onExport={handleExportStats}>
                        {loading.stats || !stats ? <p>Loading stats...</p> : (
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Volume</h4>
                                <p className="text-sm">Total Loans: {stats.totalLoans}</p>
                                <p className="text-sm">Last 30 Days: {stats.loansLast30Days}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Top Borrowed Titles</h4>
                                <ul className="list-decimal list-inside text-sm">{stats.topTitles.map(t => <li key={t.title}>{t.title} ({t.count})</li>)}</ul>
                            </div>
                            <div>
                                <h4 className="font-semibold">Top Categories</h4>
                                <ul className="list-decimal list-inside text-sm">{stats.topCategories.map(c => <li key={c.category}>{c.category} ({c.count})</li>)}</ul>
                            </div>
                        </div>
                        )}
                    </ReportCard>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
