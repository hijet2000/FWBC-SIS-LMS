

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { getClasses, getStudentsByClass } from '../lib/schoolService';
import { saveAttendance } from '../lib/attendanceService';
import type { SchoolClass, Student, AttendanceStatus, AttendanceEntry } from '../types';
import { useAuth } from '../auth/AuthContext';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
};

const AttendancePage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
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

    // Session Meta states
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('16:00');
    const [threshold, setThreshold] = useState(75);

    const totalSessionMinutes = useMemo(() => {
        if (!startTime || !endTime) return 0;
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const start = new Date(0, 0, 0, startH, startM);
        const end = new Date(0, 0, 0, endH, endM);
        return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
    }, [startTime, endTime]);

    // Fetch classes on mount
    useEffect(() => {
        getClasses().then(setClasses).catch(() => setError('Could not load class list.'));
    }, []);

    // Fetch student roster when classId changes
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
                const initialAttendance = new Map<string, AttendanceEntry>(roster.map(s => [
                    s.id,
                    { studentId: s.id, status: 'PRESENT', minutesAttended: totalSessionMinutes > 0 ? totalSessionMinutes : undefined }
                ]));
                setAttendance(initialAttendance);
            })
            .catch(() => setError('Failed to load student roster for this class.'))
            .finally(() => setLoading(false));
    }, [classId, date, totalSessionMinutes]); // Rerun if date or totalSessionMinutes change to reset defaults

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
            // FIX: Explicitly type the new Map to preserve the value type.
            const newMap = new Map<string, AttendanceEntry>(prev);
            const currentEntry = newMap.get(studentId) || { studentId, status: 'PRESENT' };
            newMap.set(studentId, { ...currentEntry, ...newEntry });
            return newMap;
        });
    };

    const applyThreshold = () => {
        const thresholdMinutes = totalSessionMinutes * (threshold / 100);
        // FIX: Explicitly type the new Map to preserve the value type.
        const newAttendance = new Map<string, AttendanceEntry>(attendance);
        students.forEach(student => {
            const entry = newAttendance.get(student.id);
            if (!entry) return;
            const minutes = entry.minutesAttended ?? 0;
            let newStatus: AttendanceStatus = 'ABSENT';
            if (minutes >= thresholdMinutes) {
                newStatus = 'PRESENT';
            } else if (minutes > 0) {
                newStatus = 'LATE';
            }
            newAttendance.set(student.id, { ...entry, status: newStatus });
        });
        setAttendance(newAttendance);
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
            // FIX: `Array.from(attendance.values())` was being inferred as `unknown[]`.
            // The fix in `handleAttendanceChange` ensures `attendance` retains its type,
            // so this line now correctly produces `AttendanceEntry[]`.
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
    
    const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>

            {saveStatus && (
                <div className={`${saveStatus.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded relative`} role="alert">
                    <span className="block sm:inline">{saveStatus.message}</span>
                    <button onClick={() => setSaveStatus(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                        <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </button>
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

            {classId && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                 <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Session Meta</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                     <div>
                        <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input type="time" id="start-time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                     </div>
                      <div>
                        <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">End Time</label>
                        <input type="time" id="end-time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                     </div>
                     <div>
                        <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">Threshold (%)</label>
                         <input type="number" id="threshold" value={threshold} onChange={e => setThreshold(Number(e.target.value))} min="0" max="100" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                     </div>
                     <button onClick={applyThreshold} disabled={!totalSessionMinutes} className="w-full sm:w-auto justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                        Auto-fill by threshold
                     </button>
                 </div>
                 <p className="mt-2 text-xs text-gray-500">Total Session: {totalSessionMinutes} minutes. Threshold for Present: {Math.ceil(totalSessionMinutes * (threshold / 100))} mins.</p>
            </div>
            )}

            {/* Roster Table */}
            {!classId ? (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">Select a class and date to view the roster.</div>
            ) : loading ? (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">Loading students...</div>
            ) : error ? (
                 <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg shadow-sm border border-red-200">{error}</div>
            ) : students.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">No students found in this class.</div>
            ) : (
                <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
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
                                                   <fieldset>
                                                       <legend className="sr-only">Attendance status for {student.name}</legend>
                                                       <div className="flex gap-x-4">
                                                           {STATUS_OPTIONS.map(opt => (
                                                               <div key={opt} className="flex items-center">
                                                                    <input id={`${student.id}-${opt}`} name={`status-${student.id}`} type="radio" checked={status === opt} onChange={() => handleAttendanceChange(student.id, { status: opt })} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                                                                    <label htmlFor={`${student.id}-${opt}`} className="ml-2 block text-sm text-gray-900">{opt.charAt(0) + opt.slice(1).toLowerCase()}</label>
                                                                </div>
                                                           ))}
                                                       </div>
                                                   </fieldset>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <input 
                                                      type="number" 
                                                      value={entry?.minutesAttended ?? ''}
                                                      onChange={e => handleAttendanceChange(student.id, { minutesAttended: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                                                      disabled={minutesDisabled}
                                                      min="0"
                                                      max={totalSessionMinutes || undefined}
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
