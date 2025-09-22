import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as alumniService from '../../lib/alumniService';
import type { Donation } from '../../types';

const KpiCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-green-600">{value}</p>
    </div>
);

const AlumniDonationsPage: React.FC = () => {
    const { addToast } = useToast();
    const [donations, setDonations] = useState<(Donation & { alumniName?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        alumniService.listDonations()
            .then(setDonations)
            .catch(() => addToast('Failed to load donations.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const summary = useMemo(() => {
        const total = donations.reduce((sum, d) => sum + d.amount, 0);
        const count = donations.length;
        return { total, count };
    }, [donations]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Alumni Donations</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KpiCard title="Total Raised" value={formatCurrency(summary.total)} />
                <KpiCard title="Total Donations" value={summary.count.toString()} />
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Donor</th>
                            <th className="p-3 text-right text-xs uppercase">Amount</th>
                            <th className="p-3 text-left text-xs uppercase">Campaign</th>
                            <th className="p-3 text-left text-xs uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        donations.map(don => (
                            <tr key={don.id}>
                                <td className="p-3 font-medium">{don.alumniName}</td>
                                <td className="p-3 text-sm text-right font-semibold">{formatCurrency(don.amount)}</td>
                                <td className="p-3 text-sm">{don.campaign || 'General Fund'}</td>
                                <td className="p-3 text-sm">{don.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AlumniDonationsPage;
