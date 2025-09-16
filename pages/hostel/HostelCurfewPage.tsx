import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import type { CurfewCheck, Student } from '../../types';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const HostelCurfewPage: React.FC = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [date, setDate] = useState(getTodayDateString());
    const [students, setStudents] = useState<Student[]>([]);
    const [checks, setChecks] = useState<Map<string, 'Present' | 'Absent'>>(new Map());
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        // Get all allocated students
        const allAllocations = await hostelService.listAllocations();
        const currentAllocations = allAllocations.filter(a => !a.checkOutDate);
        const studentIds = currentAllocations.map(a => a.studentId);
        
        // This is inefficient; a real backend would have a dedicated endpoint
        const allStudents = (await hostelService.listAllocations()).map(a => ({ id: a.studentId, name: a.studentName }));
        const hostelStudents = allStudents.filter(s => studentIds.includes(s.id as string));
        
        // Remove duplicates
        const uniqueStudents = Array.from(new Map(hostelStudents.map(item => [item['id'], item])).values());
        
        setStudents(uniqueStudents as Student[]);

        // Fetch checks for the selected date
        const existingChecks = await hostelService.listCurfewChecks(date);
        const newChecks = new Map(existingChecks.map(c => [c.studentId, c.status]));
        
        // Set default status to 'Present' for those not in the checks
        uniqueStudents.forEach(s => {
            if (!newChecks.has(s.id)) {
                newChecks.set(s.id, 'Present');
            }
        });

        setChecks(newChecks);
        setLoading(false);
    }, [date]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleStatusChange = (studentId: string, status: 'Present' | 'Absent') => {
        setChecks(prev => new Map(prev).set(studentId, status));
    };
    
    const handleSave = async () => {
        if (!user) return;
        const payload = Array.from(checks.entries()).map(([studentId, status]) => ({
            date,
            studentId,
            status,
            checkedByUserId: user.id,
        }));
        await hostelService.saveCurfewChecks(payload, user);
        addToast('Curfew checks saved.', 'success');
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Hostel Curfew Check</h1>
                <div className="flex items-center gap-4">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-md border-gray-300"/>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">Save Checks</button>
                </div>
            </div>
            
            {loading ? <p>Loading students...</p> :
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Student</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map(student => (
                            <tr key={student.id}>
                                <td className="p-3 font-medium">{student.name}</td>
                                <td className="p-3">
                                    <div className="flex gap-4">
                                        <label className="flex items-center"><input type="radio" name={`status-${student.id}`} checked={checks.get(student.id) === 'Present'} onChange={() => handleStatusChange(student.id, 'Present')} className="mr-2"/> Present</label>
                                        <label className="flex items-center"><input type="radio" name={`status-${student.id}`} checked={checks.get(student.id) === 'Absent'} onChange={() => handleStatusChange(student.id, 'Absent')} className="mr-2"/> Absent</label>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            }
        </div>
    );
};

export default HostelCurfewPage;
