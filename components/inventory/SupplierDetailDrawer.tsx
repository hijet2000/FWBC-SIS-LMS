import React, { useState, useEffect } from 'react';
import * as inventoryService from '../../lib/inventoryService';
import type { Supplier, StockTransaction, InventoryItem } from '../../types';
import Drawer from '../admin/Drawer';

interface SupplierDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string | null;
}

type SupplierDetails = Supplier & { transactions: (StockTransaction & { itemName: string })[] };

const SupplierDetailDrawer: React.FC<SupplierDetailDrawerProps> = ({ isOpen, onClose, supplierId }) => {
    const [details, setDetails] = useState<SupplierDetails | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (supplierId && isOpen) {
            setLoading(true);
            inventoryService.getSupplierDetails(supplierId)
                .then(setDetails)
                .finally(() => setLoading(false));
        } else {
            setDetails(null);
        }
    }, [supplierId, isOpen]);
    
    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={`Supplier Details: ${details?.name || ''}`}>
            {loading ? <div className="p-4">Loading...</div> : !details ? <div className="p-4">Could not load details.</div> : (
                <div className="p-4 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold mb-2">Contact Information</h3>
                        <p><strong>Contact Person:</strong> {details.contactPerson || 'N/A'}</p>
                        <p><strong>Phone:</strong> {details.phone || 'N/A'}</p>
                        <p><strong>Email:</strong> {details.email || 'N/A'}</p>
                        <p><strong>Address:</strong> {details.address || 'N/A'}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold mb-2">Stock-In History</h3>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2 text-left">Date</th>
                                        <th className="p-2 text-left">Item</th>
                                        <th className="p-2 text-right">Qty</th>
                                        <th className="p-2 text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.transactions.map(txn => (
                                        <tr key={txn.id} className="border-b">
                                            <td className="p-2">{new Date(txn.createdAt).toLocaleDateString()}</td>
                                            <td className="p-2">{txn.itemName}</td>
                                            <td className="p-2 text-right">{txn.quantity}</td>
                                            <td className="p-2 text-right">£{(txn.unitCost || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {details.transactions.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No transactions found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default SupplierDetailDrawer;