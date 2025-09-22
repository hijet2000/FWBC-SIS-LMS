import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as inventoryService from '../../lib/inventoryService';
import type { Asset, InventoryItem, AssetStatus } from '../../types';
import { exportToCsv } from '../../lib/exporters';
import MintModal from '../../components/inventory/MintModal';
import AssetDetailDrawer from '../../components/inventory/AssetDetailDrawer';
import AssignAssetModal from '../../components/inventory/AssignAssetModal';
import UpdateAssetStatusModal from '../../components/inventory/UpdateAssetStatusModal';

const statusStyles: Record<AssetStatus, string> = {
    'In Stock': 'bg-green-100 text-green-800',
    'Assigned': 'bg-blue-100 text-blue-800',
    'In Repair': 'bg-yellow-100 text-yellow-800',
    'Lost': 'bg-red-100 text-red-800',
    'Disposed': 'bg-gray-100 text-gray-800',
};

const AssetsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modals & Drawers State
    const [isMintModalOpen, setIsMintModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const [filters, setFilters] = useState({ q: '', status: 'all', itemId: 'all' });

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([inventoryService.listAssets(), inventoryService.listItems()])
            .then(([assetData, itemData]) => {
                setAssets(assetData);
                setItems(itemData);
            })
            .catch(() => addToast('Failed to load assets data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (type: 'mint' | 'assign' | 'status', asset: Asset | null = null) => {
        setSelectedAsset(asset);
        if (type === 'mint') setIsMintModalOpen(true);
        if (type === 'assign') setIsAssignModalOpen(true);
        if (type === 'status') setIsStatusModalOpen(true);
    };
    
    const handleViewDetails = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsDrawerOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsMintModalOpen(false);
        setIsAssignModalOpen(false);
        setIsStatusModalOpen(false);
        fetchData();
    };

    const handleExport = () => {
        const data = filteredAssets.map(asset => ({
            assetId: asset.id,
            itemName: itemMap.get(asset.itemId)?.name || 'N/A',
            status: asset.status,
            assignedTo: asset.assignedToName || 'N/A',
            serialNumber: asset.serialNumber || 'N/A',
        }));
        exportToCsv('trackable_assets.csv', [
            { key: 'assetId', label: 'Asset Tag' }, { key: 'itemName', label: 'Item' },
            { key: 'status', label: 'Status' }, { key: 'assignedTo', label: 'Assigned To' },
            { key: 'serialNumber', label: 'Serial Number' }
        ], data);
    };

    const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
    const trackableItems = useMemo(() => items.filter(i => i.trackAsset), [items]);

    const filteredAssets = useMemo(() => {
        const q = filters.q.toLowerCase();
        return assets.filter(asset => {
            const item = itemMap.get(asset.itemId);
            return (
                (filters.q ? asset.id.toLowerCase().includes(q) || asset.serialNumber?.toLowerCase().includes(q) || asset.assignedToName?.toLowerCase().includes(q) : true) &&
                (filters.status === 'all' ? true : asset.status === filters.status) &&
                (filters.itemId === 'all' ? true : asset.itemId === filters.itemId)
            );
        });
    }, [assets, filters, itemMap]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Trackable Assets</h1>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md">Export CSV</button>
                    <button onClick={() => handleOpenModal('mint')} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Mint Assets</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                <input type="search" placeholder="Search by Asset Tag, S/N, or Assignee..." value={filters.q} onChange={e => setFilters({...filters, q: e.target.value})} className="w-full rounded-md border-gray-300" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="rounded-md"><option value="all">All Statuses</option>{Object.keys(statusStyles).map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <select value={filters.itemId} onChange={e => setFilters({...filters, itemId: e.target.value})} className="rounded-md"><option value="all">All Item Types</option>{trackableItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Asset Tag</th>
                        <th className="p-3 text-left text-xs uppercase">Item</th>
                        <th className="p-3 text-left text-xs uppercase">Assigned To</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        filteredAssets.map(asset => (
                            <tr key={asset.id}>
                                <td className="p-3 font-mono"><button onClick={() => handleViewDetails(asset)} className="text-indigo-600 hover:underline">{asset.id}</button></td>
                                <td className="p-3 text-sm">{itemMap.get(asset.itemId)?.name || 'N/A'}</td>
                                <td className="p-3 text-sm">{asset.assignedToName || <span className="text-gray-400">Not Assigned</span>}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${statusStyles[asset.status]}`}>{asset.status}</span></td>
                                <td className="p-3 text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenModal('assign', asset)} className="text-blue-600">Assign</button>
                                    <button onClick={() => handleOpenModal('status', asset)} className="text-gray-600">Update Status</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {user && <>
                <MintModal isOpen={isMintModalOpen} onClose={() => setIsMintModalOpen(false)} onSaveSuccess={handleSaveSuccess} actor={user} trackableItems={trackableItems} />
                {selectedAsset && <>
                    <AssignAssetModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onSaveSuccess={handleSaveSuccess} actor={user} asset={selectedAsset} />
                    <UpdateAssetStatusModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} onSaveSuccess={handleSaveSuccess} actor={user} asset={selectedAsset} />
                    <AssetDetailDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} assetId={selectedAsset.id} item={itemMap.get(selectedAsset.itemId)} />
                </>}
            </>}
        </div>
    );
};

export default AssetsPage;