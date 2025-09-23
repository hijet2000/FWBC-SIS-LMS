import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hrService from '../../lib/hrService';
import type { Employee, Payslip } from '../../types';

const KpiCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className = '' }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-1 text-3xl font-bold ${className}`}>{value}</p>
    </div>
);

const PayrollPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [summary, setSummary] = useState<{ payslipCount: number; totalGross: number; totalNet: number } | null>(null);
    const [loading, setLoading] = useState({ employees: true, payslips: false });
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
        return `${year}-${month}`;
    });

    // Fix: Changed `e.name` to `e.fullName` to match the Employee type definition.
    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.fullName])), [employees]);

    useEffect(() => {
        hrService.listEmployees()
            .then(setEmployees)
            .finally(() => setLoading(prev => ({ ...prev, employees: false })));
    }, []);

    const fetchPayslips = useCallback(async () => {
        setLoading(prev => ({ ...prev, payslips: true }));
        setSummary(null);
        try {
            const data = await hrService.listPayslips(selectedPeriod);
            setPayslips(data);
            if (data.length > 0) {
                const totalGross = data.reduce((sum, p) => sum + p.grossSalary, 0);
                const totalNet = data.reduce((sum, p) => sum + p.netSalary, 0);
                setSummary({ payslipCount: data.length, totalGross, totalNet });
            }
        } catch {
            addToast('Failed to load existing payslips.', 'error');
        } finally {
            setLoading(prev => ({ ...prev, payslips: false }));
        }
    }, [selectedPeriod, addToast]);

    useEffect(() => {
        fetchPayslips();
    }, [fetchPayslips]);

    const handleRunPayroll = async () => {
        if (!user || payslips.length > 0) {
            addToast(payslips.length > 0 ? 'Payroll has already been run for this period.' : 'Authentication error.', 'warning');
            return;
        }
        setIsProcessing(true);
        try {
            const result = await hrService.runPayrollForPeriod(selectedPeriod, user);
            addToast(`Payroll run successfully for ${result.payslipCount} employees.`, 'success');
            await fetchPayslips(); // Refresh the list
        } catch (err: any) {
            addToast(err.message || 'Failed to run payroll.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Run Payroll</h1>

            <div className="bg-white p-4 rounded-lg shadow-sm border grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="period" className="text-sm font-medium">Select Period</label>
                    <input type="month" id="period" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full mt-1 rounded-md" />
                </div>
                <div className="md:col-span-2">
                    <button onClick={handleRunPayroll} disabled={isProcessing || loading.payslips || payslips.length > 0} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isProcessing ? 'Processing...' : payslips.length > 0 ? 'Payroll Run for this Period' : 'Run Payroll'}
                    </button>
                </div>
            </div>

            {loading.payslips && <p className="text-center">Loading payslip data...</p>}
            
            {!loading.payslips && payslips.length === 0 && (
                <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p className="text-gray-500">No payroll has been run for {selectedPeriod}.</p>
                    <p className="text-sm text-gray-400">Select a period and click "Run Payroll" to generate payslips.</p>
                </div>
            )}

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard title="Payslips Generated" value={summary.payslipCount.toString()} />
                    <KpiCard title="Total Gross Salary" value={formatCurrency(summary.totalGross)} className="text-blue-600" />
                    <KpiCard title="Total Net Pay" value={formatCurrency(summary.totalNet)} className="text-green-600" />
                </div>
            )}
            
            {!loading.payslips && payslips.length > 0 && (
                 <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left text-xs uppercase">Employee</th>
                                <th className="p-3 text-right text-xs uppercase">Gross Salary</th>
                                <th className="p-3 text-right text-xs uppercase">Deductions</th>
                                <th className="p-3 text-right text-xs uppercase">Net Salary</th>
                                <th className="p-3 text-right text-xs uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payslips.map(p => {
                                const deductions = p.deductions.reduce((sum, d) => sum + d.amount, 0);
                                return (
                                <tr key={p.id}>
                                    <td className="p-3 font-medium">{employeeMap.get(p.employeeId)}</td>
                                    <td className="p-3 text-sm text-right">{formatCurrency(p.grossSalary)}</td>
                                    <td className="p-3 text-sm text-right text-red-500">{formatCurrency(deductions)}</td>
                                    <td className="p-3 text-sm text-right font-semibold">{formatCurrency(p.netSalary)}</td>
                                    <td className="p-3 text-right"><button className="text-indigo-600 text-sm">View</button></td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PayrollPage;