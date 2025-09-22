import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as inventoryService from '../../lib/inventoryService';
import * as academicsService from '../../lib/academicsService';
import type { IssueRequest, InventoryItem, Teacher, IssueRequestStatus } from '../../types';
import RequestModal from '../../components/inventory/RequestModal';
import FulfillRequestModal from '../../components/inventory/FulfilRequestModal';

const statusStyles: Record<IssueRequestStatus, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-blue-100 text-blue-800',
    Rejected: 'bg-red-100 text-red-800',
    Fulfilled: 'bg-green-100 text-green-800',
    Cancelled: 'bg-gray-100 text-gray-800',
};

const RequestsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [requests, setRequests] = useState<IssueRequest[]>([]);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [requesters, setRequesters] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<IssueRequest | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            inventoryService.listIssueRequests(),
            inventoryService.listItems(),
            academicsService.listTeachers(),
        ]).then(([reqData, itemData, teacherData]) => {
            setRequests(reqData);
            setItems(itemData);
            setRequesters(teacherData);
        }).catch(() => addToast('Failed to load data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateStatus = async (request: IssueRequest, status: 'Approved' | 'Rejected' | 'Cancelled') => {
        if (!user) return;
        try {
            await inventoryService.updateIssueRequestStatus(request.id, status, user);
            addToast(`Request ${status.toLowerCase()}.`, 'success');
            fetchData();
        } catch {
            addToast('Failed to update status.', 'error');
        }
    };

    const handleFulfill = (request: IssueRequest) => {
        setSelectedRequest(request);
        setIsFulfillModalOpen(true);
    };

    const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
    const requesterMap = useMemo(() => new Map(requesters.map(r => [r.id, r.name])), [requesters]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Issue Requests</h1>
                <button onClick={() => setIsRequestModalOpen(true)} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">New Request</button>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Item</th>
                        <th className="p-3 text-left text-xs uppercase">Qty</th>
                        <th className="p-3 text-left text-xs uppercase">Requester</th>
                        <th className="p-3 text-left text-xs uppercase">Date</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> :
                        requests.map(req => (
                            <tr key={req.id}>
                                <td className="p-3 font-medium">{itemMap.get(req.itemId)?.name || 'Unknown'}</td>
                                <td className="p-3 text-sm">{req.quantity}</td>
                                <td className="p-3 text-sm">{requesterMap.get(req.requesterId) || 'Unknown'}</td>
                                <td className="p-3 text-sm">{new Date(req.requestedAt).toLocaleDateString()}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${statusStyles[req.status]}`}>{req.status}</span></td>
                                <td className="p-3 text-right text-sm font-medium space-x-2">
                                    {req.status === 'Pending' && <>
                                        <button onClick={() => handleUpdateStatus(req, 'Approved')} className="text-green-600">Approve</button>
                                        <button onClick={() => handleUpdateStatus(req, 'Rejected')} className="text-red-600">Reject</button>
                                    </>}
                                    {req.status === 'Approved' && <button onClick={() => handleFulfill(req)} className="text-blue-600">Fulfil</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {user && (
                <>
                    <RequestModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} onSaveSuccess={fetchData} actor={user} items={items} />
                    {selectedRequest && (
                         <FulfillRequestModal isOpen={isFulfillModalOpen} onClose={() => setIsFulfillModalOpen(false)} onSaveSuccess={fetchData} actor={user} request={selectedRequest} item={itemMap.get(selectedRequest.itemId)} />
                    )}
                </>
            )}
        </div>
    );
};

export default RequestsPage;