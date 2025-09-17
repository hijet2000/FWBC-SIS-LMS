import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import type { Hostel } from '../../types';

const KpiCard: React.FC<{ title: string; value: string | number; description?: string; className?: string }> = ({ title, value, description, className = '' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-2 text-3xl font-bold ${className}`}>{value}</p>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
);

interface DashboardStats {
    occupancyRate: number;
    availableBeds: number;
    visitorsIn: number;
    occupancyByHostel: { hostel: Hostel, occupied: number, capacity: number }[];
    curfewSummary: { date: string, absent: number, total: number };
    alerts: { overCapacity: number, blockedBeds: number };
}

const HostelDashboardPage: React.FC = () => {
    const { addToast } = useToast();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // FIX: The service now returns the full DashboardStats object, so the .then() can directly use setStats.
        hostelService.getDashboardStats()
            .then(setStats)
            .catch(() => addToast('Failed to load dashboard stats.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);
    
    if(loading || !stats) return <p>Loading dashboard...</p>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Overall Occupancy" value={`${stats.occupancyRate.toFixed(1)}%`} className="text-indigo-600" />
                <KpiCard title="Available Beds" value={stats.availableBeds} className="text-green-600" />
                <KpiCard title="Visitors Currently In" value={stats.visitorsIn} className="text-yellow-600" />
                 <KpiCard title="Curfew Absentees" value={stats.curfewSummary.absent} description={`on ${stats.curfewSummary.date}`} className={stats.curfewSummary.absent > 0 ? 'text-red-600' : 'text-gray-800'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Occupancy by Hostel</h2>
                    <div className="space-y-4">
                        {stats.occupancyByHostel.map(item => {
                            const rate = item.capacity > 0 ? (item.occupied / item.capacity) * 100 : 0;
                            return (
                                <div key={item.hostel.id}>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>{item.hostel.name} ({item.hostel.type})</span>
                                        <span>{item.occupied} / {item.capacity}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${rate}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                 <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">System Alerts</h2>
                     <div className="space-y-3">
                        <div className={`p-3 rounded-md ${stats.alerts.overCapacity > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            <strong>{stats.alerts.overCapacity}</strong> rooms over capacity
                        </div>
                         <div className={`p-3 rounded-md ${stats.alerts.blockedBeds > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>
                            <strong>{stats.alerts.blockedBeds}</strong> beds blocked for maintenance
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostelDashboardPage;