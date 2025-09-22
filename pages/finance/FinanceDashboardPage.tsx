import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as financeService from '../../lib/financeService';
import { useAuth } from '../../auth/AuthContext';

const KpiCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className = '' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-2 text-3xl font-bold ${className}`}>{value}</p>
    </div>
);

const FinanceDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, net: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        financeService.getFinanceDashboardSummary()
            .then(setSummary)
            .catch(() => addToast('Failed to load dashboard data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
    };

    if (loading) {
        return <div className="text-center p-8">Loading financial dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Finance Dashboard</h1>
            <p className="text-sm text-gray-500">Summary for the current month.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Income" value={formatCurrency(summary.totalIncome)} className="text-green-600" />
                <KpiCard title="Total Expense" value={formatCurrency(summary.totalExpense)} className="text-red-600" />
                <KpiCard 
                    title="Net Profit / Loss" 
                    value={formatCurrency(summary.net)} 
                    className={summary.net >= 0 ? 'text-gray-800' : 'text-red-600'}
                />
            </div>

            {/* In a real app, charts and recent activity would go here */}
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Coming Soon</h2>
                <p className="text-gray-500">Charts for expense breakdowns and recent transaction lists will be added here.</p>
            </div>
        </div>
    );
};

export default FinanceDashboardPage;