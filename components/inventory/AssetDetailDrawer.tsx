import React, { useState, useEffect } from 'react';
import * as inventoryService from '../../lib/inventoryService';
import type { Asset, InventoryItem } from '../../types';
import Drawer from '../admin/Drawer';

interface AssetDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string | null;
  item?: InventoryItem;
}

const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({ isOpen, onClose, assetId, item }) => {
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (assetId && isOpen) {
            setLoading(true);
            inventoryService.getAssetDetails(assetId)
                .then(setAsset)
                .finally(() => setLoading(false));
        }
    }, [assetId, isOpen]);
    
    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={`Asset Details: ${asset?.id || ''}`}>
            {loading ? <div className="p-4">Loading...</div> : !asset ? <div className="p-4">Could not load asset details.</div> : (
                <div className="p-4 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">{item?.name}</h3>
                                <p className="text-sm text-gray-500 font-mono">{asset.id}</p>
                            </div>
                            <button className="px-3 py-1 text-xs bg-gray-200 rounded">Print Tag (Mock)</button>
                        </div>
                        <div className="mt-2 text-sm">
                            <p><strong>S/N:</strong> {asset.serialNumber || 'N/A'}</p>
                            <p><strong>Status:</strong> {asset.status}</p>
                            <p><strong>Assigned To:</strong> {asset.assignedToName || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold mb-2">History</h3>
                        <div className="space-y-3">
                            {asset.history.slice().reverse().map((log, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-1 h-full bg-gray-200 rounded-full"></div>
                                    <div className="text-sm">
                                        <p><strong>{log.status}</strong></p>
                                        <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                        {log.notes && <p className="italic">"{log.notes}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default AssetDetailDrawer;