import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listInvoices } from '../lib/feesService';
import { getClasses, getStudents } from '../lib/schoolService';
import type { Invoice, SchoolClass, Student, InvoiceStatus } from '../types';
import Toast from '../components/ui/Toast';
import RecordPaymentModal from '../components/fees/RecordPaymentModal';
import { useAuth } from '../auth/AuthContext';

const statusStyles: Record<InvoiceStatus, string> = {
    Paid: 'bg-green-100 text-green-800',
    Partial: 'bg-yellow-100 text-yellow-800',
    Unpaid: 'bg-gray-100 text-gray-800',
    Overdue: 'bg-red-100 text-red-800',
};

const FeesPaymentsPage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Data
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    
    // UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);

    // Filters
    const filters = useMemo(() => ({
        classId: searchParams.get('classId') || '',
        studentId: searchParams.get('studentId') || '',
        status: searchParams.get('status') || 'all',
    }), [searchParams]);

    // Initial data load for filters
    useEffect(() => {
        Promise.all([
            getClasses(),
            getStudents({ limit: 1000 })
        ]).then(([classesData, studentsData]) => {
            setClasses(classesData);
            setStudents(studentsData.students);
        }).catch(() => setError("Failed to load filter data."));
    }, []);

    // Fetch invoices when filters change
    useEffect(() => {
        setLoading(true);
        setError(null);
        listInvoices(filters)
            .then(setInvoices)
            .catch(() => setError("Failed to load invoices."))
            .finally(() => setLoading(false));
    }, [filters]);

    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value && value !== 'all') newParams.set(key, value);
            else newParams.delete(key);
            if (key === 'classId') newParams.delete('studentId'); // Reset student if class changes
            return newParams;
        }, { replace: true });
    };

    const handlePaymentSuccess = (receiptNo: string) => {
        setPaymentModalInvoice(null);
        setToast({ message: `Payment recorded successfully (Receipt: ${receiptNo})`, type: 'success' });
        // Refetch invoices
        listInvoices(filters).then(setInvoices);
    };

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const filteredStudents = useMemo(() => filters.classId ? students.filter(s => s.classId === filters.classId) : [], [students, filters.classId]);

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-gray-800">Fees — Payments</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={filters.classId} onChange={e => handleFilterChange('classId', e.target.value)} className="rounded-md border-gray-300">
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filters.studentId} onChange={e => handleFilterChange('studentId', e.target.value)} className="rounded-md border-gray-300" disabled={!filters.classId}>
                        <option value="">All Students in Class</option>
                        {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="rounded-md border-gray-300">
                        <option value="all">All Statuses</option>
                        {(['Unpaid', 'Partial', 'Paid', 'Overdue'] as InvoiceStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={8} className="p-4 text-center">Loading invoices...</td></tr> :
                        error ? <tr><td colSpan={8} className="p-4 text-center text-red-500">{error}</td></tr> :
                        invoices.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-gray-500">No invoices found.</td></tr> :
                        invoices.map(inv => {
                            const outstanding = inv.total - inv.paid;
                            return (
                            <tr key={inv.id}>
                                <td className="px-4 py-4 text-sm font-mono">{inv.invoiceNo}</td>
                                <td className="px-4 py-4 text-sm font-medium">{studentMap.get(inv.studentId)}</td>
                                <td className="px-4 py-4 text-sm">{inv.dueAt}</td>
                                <td className="px-4 py-4 text-sm">£{inv.total.toFixed(2)}</td>
                                <td className="px-4 py-4 text-sm">£{inv.paid.toFixed(2)}</td>
                                <td className={`px-4 py-4 text-sm font-medium ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>£{outstanding.toFixed(2)}</td>
                                <td className="px-4 py-4 text-sm"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[inv.status]}`}>{inv.status}</span></td>
                                <td className="px-4 py-4 text-right text-sm font-medium">
                                    {outstanding > 0 && <button onClick={() => setPaymentModalInvoice(inv)} className="text-indigo-600 hover:text-indigo-900">Record Payment</button>}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            
            {paymentModalInvoice && user && (
                <RecordPaymentModal 
                    isOpen={!!paymentModalInvoice} 
                    onClose={() => setPaymentModalInvoice(null)}
                    onSaveSuccess={handlePaymentSuccess}
                    invoice={paymentModalInvoice}
                    actor={user}
                />
            )}
        </div>
    );
};

export default FeesPaymentsPage;