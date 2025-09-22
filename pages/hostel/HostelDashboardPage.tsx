import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import type { HostelDashboardSummary } from '../../types';

const KpiCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-800">{value}</p>
    </div>
);

const HostelDashboardPage: React.FC = () => {
    const { addToast } = useToast();
    const [summary, setSummary] = useState<HostelDashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        hostelService.getHostelDashboardSummary()
            .then(setSummary)
            .catch(() => addToast('Failed to load dashboard data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !summary) {
        return <div className="p-8 text-center">Loading hostel dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Dashboard</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <KpiCard title="Total Capacity" value={summary.kpis.totalCapacity} />
                <KpiCard title="Total Occupied" value={summary.kpis.totalOccupied} />
                <KpiCard title="Occupancy Rate" value={`${summary.kpis.occupancyRate.toFixed(1)}%`} />
                <KpiCard title="Available Beds" value={summary.kpis.totalAvailable} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold mb-4">Occupancy by Hostel</h2>
                        <div className="space-y-4">
                            {summary.occupancyByHostel.map(hostel => {
                                const rate = hostel.capacity > 0 ? (hostel.occupied / hostel.capacity) * 100 : 0;
                                return (
                                <div key={hostel.id}>
                                    <h3 className="font-semibold">{hostel.name} <span className="text-sm font-normal text-gray-500">({hostel.type})</span></h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="w-full bg-gray-200 rounded-full h-4">
                                            <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${rate}%` }}></div>
                                        </div>
                                        <span className="text-sm font-bold w-20 text-right">{rate.toFixed(1)}%</span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                                        <span>Occupied: {hostel.occupied}/{hostel.capacity}</span>
                                        <span>Available: {hostel.available}</span>
                                        <span>Blocked: {hostel.blocked}</span>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold mb-4">Curfew Snapshot (Mock)</h2>
                         <div className="p-4 bg-green-100 text-green-800 text-center rounded-lg">
                            <p className="font-bold">All Students Accounted For</p>
                            <p className="text-xs">as of {new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                     <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold mb-4 text-amber-600">Alerts</h2>
                        <ul className="space-y-2 text-sm">
                            {summary.alerts.overcapacityRooms.map((alert, i) => (
                                <li key={i} className="p-2 bg-red-100 text-red-800 rounded-md">
                                    <strong>Overcapacity:</strong> Room {alert.roomNumber} in {alert.hostelName} has {alert.occupied} occupants (Capacity: {alert.capacity}).
                                </li>
                            ))}
                            {summary.alerts.totalBlockedBeds > 0 && (
                                <li className="p-2 bg-yellow-100 text-yellow-800 rounded-md">
                                    <strong>Maintenance:</strong> {summary.alerts.totalBlockedBeds} bed(s) are currently blocked.
                                </li>
                            )}
                             {summary.alerts.overcapacityRooms.length === 0 && summary.alerts.totalBlockedBeds === 0 && (
                                <p className="text-sm text-gray-500">No active alerts.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostelDashboardPage;