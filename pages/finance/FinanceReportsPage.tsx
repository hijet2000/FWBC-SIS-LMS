import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as financeService from '../../lib/financeService';
import Modal from '../../components/ui/Modal';

const FinanceReportsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [isClosing, setIsClosing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodToClose = {
        year: lastMonth.getFullYear(),
        month: lastMonth.getMonth() + 1,
        label: lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
    };

    const handleClosePeriod = async () => {
        if (!user) return;
        setIsClosing(true);
        try {
            await financeService.closeFinancialPeriod(periodToClose.year, periodToClose.month, user);
            addToast(`Financial period for ${periodToClose.label} has been closed.`, 'success');
        } catch (err: any) {
            addToast(err.message || 'Failed to close period.', 'error');
        } finally {
            setIsClosing(false);
            setIsModalOpen(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Finance Reports & Closing</h1>

            {isModalOpen && (
                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Period Close">
                    <div className="p-4">
                        <p>Are you sure you want to close the financial period for <strong>{periodToClose.label}</strong>?</p>
                        <p className="text-sm text-red-600 mt-2">This action is irreversible and will prevent any further transactions from being recorded in this period.</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                            <button onClick={handleClosePeriod} disabled={isClosing} className="px-4 py-2 text-white bg-red-600 rounded-md disabled:bg-gray-400">
                                {isClosing ? 'Closing...' : 'Confirm & Close Period'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold mb-2">Generate Reports</h2>
                    <p className="text-sm text-gray-500 mb-4">Select a report type to generate and download.</p>
                    <div className="space-y-2">
                        <button disabled className="w-full text-left p-2 border rounded-md disabled:opacity-50">Income vs. Expense Statement</button>
                        <button disabled className="w-full text-left p-2 border rounded-md disabled:opacity-50">Expense by Category</button>
                        <button disabled className="w-full text-left p-2 border rounded-md disabled:opacity-50">Income by Source</button>
                    </div>
                </div>

                 <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
                    <h2 className="text-lg font-semibold mb-2">End of Period</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Close the financial period to lock transactions and finalize balances. This should be done at the end of each month.
                    </p>
                    <button onClick={() => setIsModalOpen(true)} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700">
                        Close Period for {periodToClose.label}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinanceReportsPage;