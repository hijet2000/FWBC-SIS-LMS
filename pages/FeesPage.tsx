import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { listFeeItems, assignFeeToClass, assignFeeToStudent, toggleFeeItem } from '../lib/feesService';
import { getClasses, getStudentsByClass } from '../lib/schoolService';
import type { FeeItem, SchoolClass, Student, FeeFrequency } from '../types';
import Toast from '../components/ui/Toast';
import FeeItemModal from '../components/fees/FeeItemModal';

const FeesPage: React.FC = () => {
    const { user } = useAuth();
    const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState({ items: true, assignments: true });
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FeeItem | null>(null);

    // Filter state for catalog
    const [filters, setFilters] = useState({ status: 'all', frequency: 'all', q: '' });
    
    // Assignment state
    const [assignment, setAssignment] = useState({
        classId: '',
        studentId: '',
        feeItemIds: [] as string[],
        target: 'class' as 'class' | 'student'
    });

    const fetchData = () => {
        setLoading(prev => ({ ...prev, items: true }));
        listFeeItems()
            .then(setFeeItems)
            .catch(() => setError('Failed to load fee items.'))
            .finally(() => setLoading(prev => ({ ...prev, items: false })));
    };

    useEffect(() => {
        fetchData();
        getClasses()
            .then(setClasses)
            .catch(() => setError('Failed to load classes'))
            .finally(() => setLoading(prev => ({...prev, assignments: false})));
    }, []);
    
    useEffect(() => {
        if (assignment.target === 'student' && assignment.classId) {
            getStudentsByClass(assignment.classId).then(setStudents);
        } else {
            setStudents([]);
        }
    }, [assignment.classId, assignment.target]);

    const filteredFeeItems = useMemo(() => {
        return feeItems.filter(item => {
            const matchesStatus = filters.status === 'all' || (filters.status === 'active' ? item.active : !item.active);
            const matchesFreq = filters.frequency === 'all' || item.frequency === filters.frequency;
            const matchesQuery = filters.q ? item.name.toLowerCase().includes(filters.q.toLowerCase()) || item.code?.toLowerCase().includes(filters.q.toLowerCase()) : true;
            return matchesStatus && matchesFreq && matchesQuery;
        });
    }, [feeItems, filters]);

    const handleOpenModal = (item: FeeItem | null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };
    
    const handleSaveSuccess = (message: string) => {
        setIsModalOpen(false);
        setEditingItem(null);
        fetchData();
        setToast({ message, type: 'success' });
    };

    const handleToggleActive = async (id: string, active: boolean) => {
        try {
            await toggleFeeItem(id, !active);
            setToast({ message: `Fee item ${!active ? 'activated' : 'deactivated'}.`, type: 'success' });
            fetchData();
        } catch {
            setToast({ message: 'Failed to update status.', type: 'error' });
        }
    };
    
    const handleAssignmentChange = (field: keyof typeof assignment, value: any) => {
        setAssignment(prev => {
            const newState = {...prev, [field]: value};
            if(field === 'target') {
                newState.classId = '';
                newState.studentId = '';
                newState.feeItemIds = [];
            }
            if(field === 'classId') {
                newState.studentId = '';
            }
            return newState;
        })
    };
    
    const handleAssign = async () => {
        if (assignment.feeItemIds.length === 0) return;
        try {
            if (assignment.target === 'class' && assignment.classId) {
                await assignFeeToClass(assignment.feeItemIds, assignment.classId);
                setToast({ message: `Fees assigned to class.`, type: 'success' });
            } else if (assignment.target === 'student' && assignment.studentId) {
                await assignFeeToStudent(assignment.feeItemIds, assignment.studentId);
                setToast({ message: `Fees assigned to student.`, type: 'success' });
            }
        } catch {
            setToast({ message: 'Assignment failed.', type: 'error' });
        } finally {
            setAssignment(prev => ({ ...prev, feeItemIds: [] }));
        }
    };


    if (!user?.scopes.includes('school:admin')) {
        return <div className="text-center p-8 bg-red-50 text-red-700">Access Denied.</div>;
    }

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Fees — Structures & Billing</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage fee items and assign them to classes or students.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Catalog */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Fee Item Catalog</h2>
                            <button onClick={() => handleOpenModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Add Fee Item</button>
                        </div>
                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <input type="search" placeholder="Search name/code" value={filters.q} onChange={e => setFilters({...filters, q: e.target.value})} className="rounded-md border-gray-300 shadow-sm" />
                            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="rounded-md border-gray-300 shadow-sm">
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <select value={filters.frequency} onChange={e => setFilters({...filters, frequency: e.target.value})} className="rounded-md border-gray-300 shadow-sm">
                                <option value="all">All Frequencies</option>
                                {(['Once', 'Monthly', 'Termly', 'Annually'] as FeeFrequency[]).map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name/Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading.items ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                                    filteredFeeItems.map(item => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name} {item.code && <span className="text-gray-500">({item.code})</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{item.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.frequency}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.active ? 'Active' : 'Inactive'}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                                <button onClick={() => handleToggleActive(item.id, item.active)} className="text-gray-500 hover:text-gray-800">{item.active ? 'Deactivate' : 'Activate'}</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Assignments */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Assignments</h2>
                         <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <label><input type="radio" name="target" value="class" checked={assignment.target === 'class'} onChange={() => handleAssignmentChange('target','class')} className="mr-1" /> Class</label>
                                <label><input type="radio" name="target" value="student" checked={assignment.target === 'student'} onChange={() => handleAssignmentChange('target','student')} className="mr-1" /> Student</label>
                            </div>
                             <select value={assignment.classId} onChange={e => handleAssignmentChange('classId', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm">
                                <option value="">-- Select a Class --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                             {assignment.target === 'student' && (
                                <select value={assignment.studentId} onChange={e => handleAssignmentChange('studentId', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm" disabled={!assignment.classId}>
                                    <option value="">-- Select a Student --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            )}
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Items to Assign</label>
                                <div className="p-2 border rounded-md max-h-48 overflow-y-auto space-y-1">
                                    {feeItems.filter(i=>i.active).map(item => (
                                        <div key={item.id}><label className="flex items-center text-sm"><input type="checkbox" value={item.id} checked={assignment.feeItemIds.includes(item.id)} onChange={e => { const id = e.target.value; handleAssignmentChange('feeItemIds', assignment.feeItemIds.includes(id) ? assignment.feeItemIds.filter(i => i !== id) : [...assignment.feeItemIds, id])}} className="mr-2 rounded" /> {item.name}</label></div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleAssign} disabled={(!assignment.classId && !assignment.studentId) || assignment.feeItemIds.length === 0} className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">Assign Selected Fees</button>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && <FeeItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} initialData={editingItem} />}
        </div>
    );
};

export default FeesPage;
