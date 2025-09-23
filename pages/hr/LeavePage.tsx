import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hrService from '../../lib/hrService';
import type { LeaveApplication, Employee, LeaveStatus } from '../../types';

const statusStyles: Record<LeaveStatus, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
};

const LeavePage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            hrService.listLeaveApplications(),
            hrService.listEmployees()
        ]).then(([leaveData, employeeData]) => {
            setApplications(leaveData);
            setEmployees(employeeData);
        }).catch(() => addToast('Failed to load leave data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
        if (!user) return;
        try {
            await hrService.updateLeaveApplicationStatus(id, status, user);
            addToast(`Leave application ${status.toLowerCase()}.`, 'success');
            fetchData();
        } catch {
            addToast('Failed to update leave status.', 'error');
        }
    };

    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.fullName])), [employees]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Leave Management</h1>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Employee</th>
                            <th className="p-3 text-left text-xs uppercase">Type</th>
                            <th className="p-3 text-left text-xs uppercase">Dates</th>
                            <th className="p-3 text-left text-xs uppercase">Reason</th>
                            <th className="p-3 text-left text-xs uppercase">Status</th>
                            <th className="p-3 text-right text-xs uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> :
                        applications.map(app => (
                            <tr key={app.id}>
                                <td className="p-3 font-medium">{employeeMap.get(app.employeeId) || app.employeeId}</td>
                                <td className="p-3 text-sm">{app.leaveType}</td>
                                <td className="p-3 text-sm">{app.startDate} to {app.endDate}</td>
                                <td className="p-3 text-sm">{app.reason}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${statusStyles[app.status]}`}>{app.status}</span></td>
                                <td className="p-3 text-right text-sm font-medium space-x-2">
                                    {app.status === 'Pending' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(app.id, 'Approved')} className="text-green-600">Approve</button>
                                            <button onClick={() => handleUpdateStatus(app.id, 'Rejected')} className="text-red-600">Reject</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeavePage;
