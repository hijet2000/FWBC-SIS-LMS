import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { getClasses, getStudentsByClass } from '../lib/schoolService';
import { saveAttendance } from '../lib/attendanceService';
import type { SchoolClass, Student, AttendanceStatus, AttendanceEntry } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
};

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

const STATUS_STYLES: Record<AttendanceStatus, { base: string, selected: string }> = {
    PRESENT: { base: 'bg-green-100 text-green-800 hover:bg-green-200', selected: 'bg-green-600 text-white ring-2 ring-offset-1 ring-green-600' },
    ABSENT: { base: 'bg-red-100 text-red-800 hover:bg-red-200', selected: 'bg-red-600 text-white ring-2 ring-offset-1 ring-red-600' },
    LATE: { base: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', selected: 'bg-yellow-500 text-white ring-2 ring-offset-1 ring-yellow-500' },
    EXCUSED: { base: 'bg-blue-100 text-blue-800 hover:bg-blue-200', selected: 'bg-blue-600 text-white ring-2 ring-offset-1 ring-blue-600' },
};


const AttendancePage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { addToast } = useToast();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data states
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Map<string, AttendanceEntry>>(new Map());

    // UI & Filter states
    const classId = searchParams.get('classId') || '';
    const date = searchParams.get('date') || getTodayDateString();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Fetch classes on mount
    useEffect(() => {
        getClasses().then(setClasses).catch(() => setError('Could not load class list.'));
    }, []);

    // Fetch student roster when classId or date changes
    useEffect(() => {
        if (!classId) {
            setStudents([]);
            setAttendance(new Map());
            return;
        }
        setLoading(true);
        setError(null);
        getStudentsByClass(classId)
            .then(roster => {
                setStudents(roster);
                // Default all students to PRESENT
                const initialAttendance = new Map<string, AttendanceEntry>(roster.map(s => [
                    s.id,
                    { studentId: s.id, status: 'PRESENT' }
                ]));
                setAttendance(initialAttendance);
            })
            .catch(() => setError('Failed to load student roster for this class.'))
            .finally(() => setLoading(false));
    }, [classId, date]); 

    const handleFilterChange = (key: 'classId' | 'date', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };

    const handleAttendanceChange = (studentId: string, newEntry: Partial<AttendanceEntry>) => {
        setAttendance(prev => {
            const newMap = new Map(prev);
            const currentEntry = newMap.get(studentId) || { studentId, status: 'PRESENT' };
            newMap.set(studentId, { ...currentEntry, ...newEntry });
            return newMap;
        });
    };
    
    const handleMarkAll = (status: AttendanceStatus) => {
        const newAttendance = new Map<string, AttendanceEntry>();
        students.forEach(student => {
            newAttendance.set(student.id, { studentId: student.id, status: status, minutesAttended: status !== 'PRESENT' ? 0 : undefined });
        });
        setAttendance(newAttendance);
        addToast(`All students marked as ${status.toLowerCase()}.`, 'info');
    };


    const handleSave = async () => {
        if (!classId || !date || !siteId || !user) return;
        setSaving(true);
        setSaveStatus(null);

        const className = classes.find(c => c.id === classId)?.name || 'Unknown Class';

        const payload = {
            siteId,
            classId,
            date,
            entries: Array.from(attendance.values()),
            actor: { id: user.id, name: user.name },
            className,
        };

        try {
            await saveAttendance(payload);
            setSaveStatus({ type: 'success', message: `Attendance saved for ${className} on ${date}.` });
        } catch (err) {
            setSaveStatus({ type: 'error', message: 'Failed to save attendance. Please try again.' });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus(null), 5000); // Auto-hide toast
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Real-time Attendance</h1>

            {saveStatus && (
                <div className={`${saveStatus.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded relative`} role="alert">
                    <span className="block sm:inline">{saveStatus.message}</span>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                        <select id="class-filter" value={classId} onChange={e => handleFilterChange('classId', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option value="">-- Select a Class --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" id="date-filter" value={date} onChange={e => handleFilterChange('date', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                </div>
            </div>

            {/* Roster Table */}
            {!classId ? (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">Select a class and date to begin marking attendance.</div>
            ) : loading ? (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">Loading students...</div>
            ) : error ? (
                 <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg shadow-sm border border-red-200">{error}</div>
            ) : students.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">No students found in this class.</div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-medium text-gray-600">Quick Actions:</span>
                        <button onClick={() => handleMarkAll('PRESENT')} className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md hover:bg-green-200">Mark All Present</button>
                        <button onClick={() => handleMarkAll('ABSENT')} className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md hover:bg-red-200">Mark All Absent</button>
                    </div>
                    <div className="flow-root">
                        <div className="-my-2 overflow-x-auto">
                            <div className="inline-block min-w-full py-2 align-middle">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Minutes Attended</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {students.map(student => {
                                            const entry = attendance.get(student.id);
                                            const status = entry?.status || 'PRESENT';
                                            const minutesDisabled = status === 'ABSENT' || status === 'EXCUSED';
                                            return (
                                                <tr key={student.id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                        <div className="font-medium text-gray-900">{student.name}</div>
                                                        {student.roll && <div className="text-gray-500">Roll: {student.roll}</div>}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                       <div className="flex items-center gap-2">
                                                            {STATUS_OPTIONS.map(opt => (
                                                                <button
                                                                    type="button"
                                                                    key={opt}
                                                                    onClick={() => handleAttendanceChange(student.id, { status: opt })}
                                                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${status === opt ? STATUS_STYLES[opt].selected : STATUS_STYLES[opt].base}`}
                                                                >
                                                                    {opt.charAt(0) + opt.slice(1).toLowerCase()}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        <input 
                                                          type="number" 
                                                          value={entry?.minutesAttended ?? ''}
                                                          onChange={e => handleAttendanceChange(student.id, { minutesAttended: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                                                          disabled={minutesDisabled}
                                                          min="0"
                                                          placeholder="mins"
                                                          className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                 <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
                                    <button onClick={handleSave} disabled={saving || !classId || !date} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-wait">
                                        {saving ? 'Saving...' : 'Save Attendance'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
