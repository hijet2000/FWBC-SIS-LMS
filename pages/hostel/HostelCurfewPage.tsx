import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import type { CurfewCheck, Student, CurfewException } from '../../types';
import ExceptionModal from '../../components/hostel/ExceptionModal';
import { exportToCsv } from '../../lib/exporters';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const HostelCurfewPage: React.FC = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [date, setDate] = useState(getTodayDateString());
    const [students, setStudents] = useState<Student[]>([]);
    const [checks, setChecks] = useState<Map<string, 'Present' | 'Absent'>>(new Map());
    const [exceptions, setExceptions] = useState<CurfewException[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [allocations, existingChecks, allExceptions] = await Promise.all([
                hostelService.listAllocations(),
                hostelService.listCurfewChecks(date),
                hostelService.listCurfewExceptions()
            ]);
            
            const residentStudents = allocations
                .filter(a => !a.checkOutDate)
                .map(a => ({ id: a.studentId, name: a.studentName })) as Student[];

            setStudents(residentStudents);
            setExceptions(allExceptions);
            
            const newChecks = new Map(existingChecks.map(c => [c.studentId, c.status]));
            residentStudents.forEach(s => {
                if (!newChecks.has(s.id)) {
                    newChecks.set(s.id, 'Present');
                }
            });
            setChecks(newChecks);
            
        } catch {
            addToast('Failed to load curfew data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [date, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeExceptionsForDate = useMemo(() => {
        const exceptionMap = new Map<string, string>(); // studentId -> reason
        const selectedDate = new Date(date);
        selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());

        exceptions.forEach(ex => {
            const from = new Date(ex.fromDate);
            from.setMinutes(from.getMinutes() + from.getTimezoneOffset());
            const to = new Date(ex.toDate);
            to.setMinutes(to.getMinutes() + to.getTimezoneOffset());
            
            if (selectedDate >= from && selectedDate <= to) {
                exceptionMap.set(ex.studentId, ex.reason);
            }
        });
        return exceptionMap;
    }, [exceptions, date]);
    
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

    const handleSaveException = () => {
        setIsModalOpen(false);
        addToast('Exception saved.', 'success');
        fetchData();
    };

    const handleDeleteException = async (exceptionId: string) => {
        if (!user) return;
        await hostelService.deleteCurfewException(exceptionId, user);
        addToast('Exception deleted.', 'success');
        fetchData();
    };
    
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    
    const handleExport = () => {
        const dataToExport = students.map(student => {
            const status = checks.get(student.id) || 'N/A';
            const exceptionReason = activeExceptionsForDate.get(student.id);
            return {
                studentName: student.name,
                status: exceptionReason ? 'Excused' : status,
                notes: exceptionReason || '',
            };
        });
        exportToCsv(`curfew_sheet_${date}.csv`, [
            { key: 'studentName', label: 'Student' },
            { key: 'status', label: 'Status' },
            { key: 'notes', label: 'Notes' }
        ], dataToExport);
    };


    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Hostel Curfew Check</h1>
                <div className="flex items-center gap-4">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-md border-gray-300"/>
                    <button onClick={handleExport} className="px-4 py-2 bg-white text-gray-700 border rounded-md shadow-sm">Export Daily Sheet</button>
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
                        {students.map(student => {
                            const exceptionReason = activeExceptionsForDate.get(student.id);
                            return (
                            <tr key={student.id} className={exceptionReason ? 'bg-blue-50' : ''}>
                                <td className="p-3 font-medium">
                                    {student.name}
                                    {exceptionReason && (
                                        <span className="ml-2 text-xs font-normal text-blue-600" title={exceptionReason}>
                                            (Excused)
                                        </span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-4">
                                        <label className="flex items-center"><input type="radio" name={`status-${student.id}`} checked={checks.get(student.id) === 'Present'} onChange={() => handleStatusChange(student.id, 'Present')} className="mr-2"/> Present</label>
                                        <label className="flex items-center"><input type="radio" name={`status-${student.id}`} checked={checks.get(student.id) === 'Absent'} onChange={() => handleStatusChange(student.id, 'Absent')} className="mr-2"/> Absent</label>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            }

            <div className="space-y-4 pt-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Curfew Exceptions</h2>
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md shadow-sm">Grant Exception</button>
                </div>

                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                         <thead className="bg-gray-50"><tr>
                            <th className="p-3 text-left text-xs uppercase">Student</th>
                            <th className="p-3 text-left text-xs uppercase">From</th>
                            <th className="p-3 text-left text-xs uppercase">To</th>
                            <th className="p-3 text-left text-xs uppercase">Reason</th>
                            <th className="p-3 text-right text-xs uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                             {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                             exceptions.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-gray-500">No exceptions granted.</td></tr> :
                             exceptions.map(ex => (
                                <tr key={ex.id}>
                                    <td className="p-3 font-medium">{studentMap.get(ex.studentId) || ex.studentId}</td>
                                    <td className="p-3 text-sm">{ex.fromDate}</td>
                                    <td className="p-3 text-sm">{ex.toDate}</td>
                                    <td className="p-3 text-sm">{ex.reason}</td>
                                    <td className="p-3 text-right text-sm">
                                        <button onClick={() => handleDeleteException(ex.id)} className="text-red-600 hover:underline">Revoke</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {user && (
                <ExceptionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveException}
                    actor={user}
                    students={students}
                />
            )}
        </div>
    );
};

export default HostelCurfewPage;