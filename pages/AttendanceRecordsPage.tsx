

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
// FIX: Import export functions from attendanceService, not transportService.
import { listAttendanceRecords, exportRecordsCSV, exportRecordsPDF } from '../lib/attendanceService';
import { getClasses, getStudents } from '../lib/schoolService';
import { exportToCsv } from '../lib/exporters';
import type { AttendanceRecord, SchoolClass, Student } from '../types';
import { attendanceKeys } from '../lib/queryKeys';

const getISODateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

const AttendanceRecordsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState<string | null>(null);

    const filters = useMemo(() => ({
        classId: searchParams.get('classId') || undefined,
        from: searchParams.get('from') || getISODateDaysAgo(7),
        to: searchParams.get('to') || getISODateDaysAgo(0),
    }), [searchParams]);

    const queryKey = attendanceKeys.list(filters);
    const isDateRangeValid = filters.from <= filters.to;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all students to ensure the studentMap is complete.
                const [classesData, studentsData] = await Promise.all([getClasses(), getStudents({ limit: 1000 })]);
                setClasses(classesData);
                // FIX: Pass the `students` array from the response object to setStudents.
                setStudents(studentsData.students);
            } catch {
                setError('Failed to load initial filter data.');
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!isDateRangeValid) {
            setRecords([]);
            return;
        }
        setLoading(true);
        setError(null);
        
        const [,, queryFilters] = queryKey;
        listAttendanceRecords(queryFilters)
            .then(setRecords)
            .catch(() => setError('Failed to load attendance records.'))
            .finally(() => setLoading(false));
    }, [queryKey, isDateRangeValid]);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    
    const recordsWithNames = useMemo(() => records.map(r => ({
        ...r,
        studentName: studentMap.get(r.studentId) || 'Unknown Student',
        className: classMap.get(r.classId) || 'Unknown Class',
    })), [records, studentMap, classMap]);

    const handleFilterChange = (key: 'classId' | 'from' | 'to', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };

    const setDateRange = (days: number) => {
        const to = getISODateDaysAgo(0);
        const from = getISODateDaysAgo(days - 1);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('from', from);
            newParams.set('to', to);
            return newParams;
        }, { replace: true });
    };

    const handleClientCsvExport = () => {
        const headers = [
            { key: 'id', label: 'Record ID' },
            { key: 'studentName', label: 'Student' },
            { key: 'sessionId', label: 'Session ID' },
            { key: 'className', label: 'Class' },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status' },
            { key: 'minutesAttended', label: 'Minutes Attended' },
            { key: 'createdAt', label: 'Created At' },
        ];
        exportToCsv(`attendance-records-${filters.from}-to-${filters.to}.csv`, headers, recordsWithNames);
    };
    
    const handleServerExport = async (exportFn: () => Promise<{ url: string }>, type: string) => {
        setExporting(type);
        try {
            await exportFn();
        } catch {
            alert(`Failed to generate ${type} export from server.`);
        } finally {
            setExporting(null);
        }
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Attendance Records</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                        <select id="class-filter" value={filters.classId || ''} onChange={e => handleFilterChange('classId', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="from-date" className="block text-sm font-medium text-gray-700">From</label>
                        <input type="date" id="from-date" value={filters.from} onChange={e => handleFilterChange('from', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="to-date" className="block text-sm font-medium text-gray-700">To</label>
                        <input type="date" id="to-date" value={filters.to} onChange={e => handleFilterChange('to', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setDateRange(7)} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50">Last 7 Days</button>
                    <button onClick={() => setDateRange(30)} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50">Last 30 Days</button>
                </div>
                {!isDateRangeValid && <p className="mt-2 text-sm text-red-600">"From" date cannot be after "To" date.</p>}
            </div>

             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Export Options</h2>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleClientCsvExport} disabled={!isDateRangeValid || loading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400">Export Filtered to CSV (Client)</button>
                    <button onClick={() => handleServerExport(exportRecordsCSV, 'CSV')} disabled={!isDateRangeValid || !!exporting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400">
                        {exporting === 'CSV' ? 'Generating...' : 'Export to CSV (Server)'}
                    </button>
                    <button onClick={() => handleServerExport(exportRecordsPDF, 'PDF')} disabled={!isDateRangeValid || !!exporting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400">
                         {exporting === 'PDF' ? 'Generating...' : 'Export to PDF (Server)'}
                    </button>
                </div>
            </div>

            <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Class</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Minutes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
                                        </tr>
                                        ))
                                    ) : error ? (
                                        <tr><td colSpan={5} className="py-8 text-center text-red-600">{error}</td></tr>
                                    ) : recordsWithNames.length === 0 ? (
                                         <tr><td colSpan={5} className="py-8 text-center text-gray-500">No records found for the selected filters.</td></tr>
                                    ) : (
                                        recordsWithNames.map(rec => (
                                            <tr key={rec.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{rec.studentName}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{rec.date}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{rec.status}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{rec.className}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{rec.minutesAttended ?? 'N/A'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceRecordsPage;