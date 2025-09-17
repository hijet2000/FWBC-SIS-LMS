import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Trip, Vehicle, Driver, TransportRoute, TripStatus } from '../../types';
import { listTrips, listVehicles, listDrivers, listRoutes, updateTrip } from '../../lib/transportService';
// FIX: Use the global toast context instead of local state for notifications.
import { useToast } from '../../contexts/ToastContext';
import TripModal from '../../components/transport/TripModal';
import { transportKeys } from '../../lib/queryKeys';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const TripsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Data
    const [trips, setTrips] = useState<Trip[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [routes, setRoutes] = useState<TransportRoute[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // FIX: Use the global toast context.
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    
    const clientFilters = useMemo(() => ({
        status: searchParams.get('status') || 'all',
        vehicleId: searchParams.get('vehicleId') || 'all',
        driverId: searchParams.get('driverId') || 'all',
        routeId: searchParams.get('routeId') || 'all',
    }), [searchParams]);

    const dateFilter = searchParams.get('date') || getTodayDateString();
    const queryKey = transportKeys.trips.list({ date: dateFilter });


    const fetchData = async (shouldFetchTrips: boolean) => {
        setLoading(true);
        setError(null);
        try {
            // FIX: Explicitly type the promises array to allow different promise types.
            const promises: Promise<any>[] = [
                listVehicles('site_123'),
                listDrivers('site_123'),
                listRoutes('site_123'),
            ];
            
            if (shouldFetchTrips) {
                const [,, filters] = queryKey;
                promises.unshift(listTrips('site_123', { date: filters.date }));
            }

            const [tripsData, vehiclesData, driversData, routesData] = shouldFetchTrips 
                ? await Promise.all(promises) as [Trip[], Vehicle[], Driver[], TransportRoute[]]
                : [trips, ...await Promise.all(promises.slice(0))] as [Trip[], Vehicle[], Driver[], TransportRoute[]];

            if (shouldFetchTrips) setTrips(tripsData);
            setVehicles(vehiclesData);
            setDrivers(driversData);
            setRoutes(routesData);
        } catch {
            setError('Failed to load trip data.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData(true);
    }, [queryKey]);

    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value && value !== 'all') newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };

    const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
    const driverMap = useMemo(() => new Map(drivers.map(d => [d.id, d])), [drivers]);
    const routeMap = useMemo(() => new Map(routes.map(r => [r.id, r])), [routes]);

    const filteredTrips = useMemo(() => {
        return trips.filter(t => 
            (clientFilters.status === 'all' || t.status === clientFilters.status) &&
            (clientFilters.vehicleId === 'all' || t.vehicleId === clientFilters.vehicleId) &&
            (clientFilters.driverId === 'all' || t.driverId === clientFilters.driverId) &&
            (clientFilters.routeId === 'all' || t.routeId === clientFilters.routeId)
        );
    }, [trips, clientFilters]);

    const handleOpenModal = (trip: Trip | null = null) => {
        setEditingTrip(trip);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = (message: string) => {
        setIsModalOpen(false);
        fetchData(true);
        // FIX: Use addToast instead of setToast.
        addToast(message, 'success');
    };

    const handleStatusChange = async (trip: Trip, newStatus: TripStatus) => {
        try {
            let updatePayload: Partial<Trip> = { status: newStatus };
            if (newStatus === 'In Progress' && !trip.startTime) {
                updatePayload.startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            }
            if (newStatus === 'Completed' && !trip.endTime) {
                updatePayload.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            }
            await updateTrip('site_123', trip.id, updatePayload);
            // FIX: Use addToast instead of setToast.
            addToast(`Trip status updated to ${newStatus}.`, 'success');
            fetchData(true);
        } catch {
            // FIX: Use addToast instead of setToast.
            addToast('Failed to update trip status.', 'error');
        }
    };
    
    const getStatusActions = (trip: Trip): { label: string, action: () => void, className: string }[] => {
        const actions = [];
        if (trip.status === 'Planned') {
            actions.push({ label: 'Start', action: () => handleStatusChange(trip, 'In Progress'), className: 'text-green-600' });
        }
        if (trip.status === 'In Progress') {
            actions.push({ label: 'Complete', action: () => handleStatusChange(trip, 'Completed'), className: 'text-blue-600' });
        }
        if (trip.status === 'Planned' || trip.status === 'In Progress') {
            actions.push({ label: 'Cancel', action: () => handleStatusChange(trip, 'Cancelled'), className: 'text-red-600' });
        }
        return actions;
    };

    const statusStyles: Record<TripStatus, string> = {
        'Planned': 'bg-gray-100 text-gray-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Completed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-red-100 text-red-800',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Transport — Trips</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Add Trip</button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <input type="date" value={dateFilter} onChange={e => handleFilterChange('date', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm"/>
                    <select value={clientFilters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm">
                        <option value="all">All Statuses</option>
                        {(['Planned', 'In Progress', 'Completed', 'Cancelled'] as TripStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={clientFilters.vehicleId} onChange={e => handleFilterChange('vehicleId', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm"><option value="all">All Vehicles</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.regNo}</option>)}</select>
                    <select value={clientFilters.driverId} onChange={e => handleFilterChange('driverId', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm"><option value="all">All Drivers</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                    <select value={clientFilters.routeId} onChange={e => handleFilterChange('routeId', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm"><option value="all">All Routes</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (Start/End)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={6} className="p-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>)
                        : error ? <tr><td colSpan={6} className="p-4 text-center text-red-500">{error}</td></tr>
                        : filteredTrips.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-gray-500">No trips found for this date.</td></tr>
                        : filteredTrips.map(t => (
                            <tr key={t.id}>
                                <td className="px-4 py-4 text-sm font-mono text-gray-800">{vehicleMap.get(t.vehicleId)?.regNo}</td>
                                <td className="px-4 py-4 text-sm text-gray-600">{driverMap.get(t.driverId)?.name}</td>
                                <td className="px-4 py-4 text-sm text-gray-600">{routeMap.get(t.routeId)?.name}</td>
                                <td className="px-4 py-4 text-sm font-mono text-gray-600">{t.startTime ?? '--:--'} / {t.endTime ?? '--:--'}</td>
                                <td className="px-4 py-4 text-sm"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[t.status]}`}>{t.status}</span></td>
                                <td className="px-4 py-4 text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenModal(t)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    {getStatusActions(t).map(action => (
                                        <button key={action.label} onClick={action.action} className={`${action.className} hover:underline`}>{action.label}</button>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <TripModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} initialData={editingTrip} vehicles={vehicles} drivers={drivers} routes={routes} />}
        </div>
    );
};

export default TripsPage;