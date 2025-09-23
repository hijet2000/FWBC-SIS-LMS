import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hrService from '../../lib/hrService';
import type { Employee, EmployeeStatus } from '../../types';

const statusStyles: Record<EmployeeStatus, string> = {
    Active: 'bg-green-100 text-green-800',
    'On Leave': 'bg-yellow-100 text-yellow-800',
    Terminated: 'bg-red-100 text-red-800',
};

const EmployeesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');

    const fetchData = useCallback(() => {
        setLoading(true);
        hrService.listEmployees()
            .then(setEmployees)
            .catch(() => addToast('Failed to load employees.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredEmployees = useMemo(() => {
        const q = filterQuery.toLowerCase();
        if (!q) return employees;
        return employees.filter(e =>
            e.fullName.toLowerCase().includes(q) ||
            e.role.toLowerCase().includes(q) ||
            e.staffId.toLowerCase().includes(q)
        );
    }, [employees, filterQuery]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
                <button className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Add Employee</button>
            </div>

             <div className="bg-white p-4 rounded-lg shadow-sm border">
                <input 
                    type="search" 
                    value={filterQuery} 
                    onChange={e => setFilterQuery(e.target.value)}
                    placeholder="Search by name, role, staff ID..."
                    className="w-full p-2 border rounded-md"
                />
            </div>

             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Name</th>
                            <th className="p-3 text-left text-xs uppercase">Role</th>
                            <th className="p-3 text-left text-xs uppercase">Department</th>
                            <th className="p-3 text-left text-xs uppercase">Status</th>
                            <th className="p-3 text-right text-xs uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        filteredEmployees.map(emp => (
                            <tr key={emp.id}>
                                <td className="p-3 font-medium">{emp.fullName} <span className="font-normal text-gray-500">({emp.staffId})</span></td>
                                <td className="p-3 text-sm">{emp.role}</td>
                                <td className="p-3 text-sm">{emp.department}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${statusStyles[emp.status]}`}>{emp.status}</span></td>
                                <td className="p-3 text-right text-sm font-medium">
                                    <button className="text-indigo-600">View/Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeesPage;
