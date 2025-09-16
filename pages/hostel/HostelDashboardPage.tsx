import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';

const KpiCard: React.FC<{ title: string; value: string | number; description?: string; className?: string }> = ({ title, value, description, className = '' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-2 text-3xl font-bold ${className}`}>{value}</p>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
);

const HostelDashboardPage: React.FC = () => {
    const { addToast } = useToast();
    const [stats, setStats] = useState({ occupancyRate: 0, availableBeds: 0, visitorsIn: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        hostelService.getDashboardStats()
            .then(setStats)
            .catch(() => addToast('Failed to load dashboard stats.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);
    
    if(loading) return <p>Loading dashboard...</p>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Overall Occupancy" value={`${stats.occupancyRate.toFixed(1)}%`} className="text-indigo-600" />
                <KpiCard title="Available Beds" value={stats.availableBeds} className="text-green-600" />
                <KpiCard title="Visitors Currently In" value={stats.visitorsIn} className="text-yellow-600" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-700">Quick Actions</h2>
                <div className="mt-4 flex flex-wrap gap-4">
                    {/* In a real app, these would link to pages or open modals */}
                    <button className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md">New Allocation</button>
                    <button className="px-4 py-2 bg-green-100 text-green-800 rounded-md">Check-in Visitor</button>
                    <button className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md">Take Curfew</button>
                </div>
            </div>
        </div>
    );
};

export default HostelDashboardPage;
