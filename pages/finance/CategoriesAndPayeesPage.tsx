import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as financeService from '../../lib/financeService';
import type { FinanceCategory, Payee } from '../../types';

const CategoriesAndPayeesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [payees, setPayees] = useState<Payee[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            financeService.listCategories(),
            financeService.listPayees(),
        ]).then(([catData, payeeData]) => {
            setCategories(catData);
            setPayees(payeeData);
        }).catch(() => addToast('Failed to load data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Finance Configuration</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Categories */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Categories</h2>
                        <button className="text-sm text-indigo-600 font-medium">Add Category</button>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Type</th></tr></thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td className="p-2">{cat.name}</td>
                                    <td className="p-2"><span className={`px-2 py-1 text-xs rounded-full ${cat.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{cat.type}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Payees */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Payees</h2>
                        <button className="text-sm text-indigo-600 font-medium">Add Payee</button>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Type</th></tr></thead>
                        <tbody>
                            {payees.map(payee => (
                                <tr key={payee.id}>
                                    <td className="p-2">{payee.name}</td>
                                    <td className="p-2 text-xs bg-gray-100 rounded-full inline-block">{payee.type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CategoriesAndPayeesPage;