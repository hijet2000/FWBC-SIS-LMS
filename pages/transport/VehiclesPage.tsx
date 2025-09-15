import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Vehicle } from '../../types';
import { listVehicles, toggleVehicle } from '../../lib/transportService';
import Toast from '../../components/ui/Toast';
import VehicleModal from '../../components/transport/VehicleModal';

const VehiclesPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    
    const filters = useMemo(() => ({
        status: searchParams.get('status') || 'all',
        q: searchParams.get('q') || '',
    }), [searchParams]);

    const fetchData = () => {
        setLoading(true);
        setError(null);
        listVehicles('site_123')
            .then(setVehicles)
            .catch(() => setError('Failed to load vehicles.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleFilterChange = (key: 'status' | 'q', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value && value !== 'all') newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };

    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v => {
            const matchesStatus = filters.status === 'all' || (filters.status === 'active' ? v.active : !v.active);
            const searchHaystack = `${v.regNo} ${v.make} ${v.model}`.toLowerCase();
            const matchesQuery = filters.q ? searchHaystack.includes(filters.q.toLowerCase()) : true;
            return matchesStatus && matchesQuery;
        });
    }, [vehicles, filters]);
    
    const handleOpenModal = (vehicle: Vehicle | null = null) => {
        setEditingVehicle(vehicle);
        setIsModalOpen(true);
    };
    
    const handleSaveSuccess = (message: string) => {
        setIsModalOpen(false);
        fetchData();
        setToast({ message, type: 'success' });
    };
    
    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await toggleVehicle('site_123', id, !currentStatus);
            setToast({ message: 'Vehicle status updated.', type: 'success' });
            fetchData();
        } catch {
            setToast({ message: 'Failed to update status.', type: 'error' });
        }
    };

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Transport — Vehicles</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Add Vehicle</button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="search" placeholder="Search Reg No, Make, Model..." value={filters.q} onChange={e => handleFilterChange('q', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm" />
                    <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm">
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Make & Model</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="p-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>)
                        : error ? <tr><td colSpan={6} className="p-4 text-center text-red-500">{error}</td></tr>
                        : filteredVehicles.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-gray-500">No vehicles found.</td></tr>
                        : filteredVehicles.map(v => (
                            <tr key={v.id}>
                                <td className="px-4 py-4 text-sm font-mono text-gray-800">{v.regNo}</td>
                                <td className="px-4 py-4 text-sm text-gray-600">{v.make} {v.model}</td>
                                <td className="px-4 py-4 text-sm text-gray-600">{v.capacity ?? 'N/A'}</td>
                                <td className="px-4 py-4 text-sm"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${v.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v.active ? 'Active' : 'Inactive'}</span></td>
                                <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-xs">{v.notes}</td>
                                <td className="px-4 py-4 text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenModal(v)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    <button onClick={() => handleToggle(v.id, v.active)} className="text-gray-500 hover:text-gray-800">{v.active ? 'Deactivate' : 'Activate'}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <VehicleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} initialData={editingVehicle} />}
        </div>
    );
};

export default VehiclesPage;
