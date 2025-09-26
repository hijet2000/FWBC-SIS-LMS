

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import { exportToCsv } from '../../lib/exporters';
import type { CurfewRecord, CurfewSettings, CurfewStatus, HostelWithRoomsAndBeds, Student } from '../../types';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const CurfewPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [date, setDate] = useState(getTodayDateString());
    const [curfewTime, setCurfewTime] = useState('22:00');
    const [curfewId, setCurfewId] = useState<string | null>(null);
    const [settings, setSettings] = useState<CurfewSettings | null>(null);
    const [structure, setStructure] = useState<HostelWithRoomsAndBeds[]>([]);
    const [boarders, setBoarders] = useState<Student[]>([]);
    const [records, setRecords] = useState<Map<string, CurfewRecord>>(new Map());
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    // FIX: Refactor boardersByRoom to use state and effect for async operations.
    const [boardersByRoom, setBoardersByRoom] = useState<Map<string, Student[]>>(new Map());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [curfewData, settingsData, structureData, boardersData] = await Promise.all([
                hostelService.getCurfewDataForDate(date),
                hostelService.getCurfewSettings(),
                hostelService.listHostelsWithRoomsAndBeds(),
                hostelService.listBoarders(),
            ]);
            setCurfewId(curfewData.curfew.id);
            setCurfewTime(curfewData.curfew.time);
            setSettings(settingsData);
            setStructure(structureData);
            setBoarders(boardersData);

            const recordMap = new Map(curfewData.records.map(r => [r.studentId, r]));
            setRecords(recordMap);
        } catch {
            addToast('Failed to load curfew data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [date, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // FIX: Use useEffect to correctly handle the async operation of building boardersByRoom.
    useEffect(() => {
        const studentMap = new Map(boarders.map(s => [s.id, s]));
        hostelService.listAllocations().then(allocs => {
            const newMap = new Map<string, Student[]>();
            allocs.filter(a => a.status === 'CheckedIn').forEach(a => {
                if (!newMap.has(a.roomId)) newMap.set(a.roomId, []);
                const student = studentMap.get(a.studentId);
                if (student) newMap.get(a.roomId)!.push(student);
            });
            setBoardersByRoom(newMap);
        });
    }, [boarders]);

    const handleRecordChange = (studentId: string, newStatus: CurfewStatus, notes?: string) => {
        setRecords(prev => {
            // FIX: Explicitly type the new Map to preserve the value type.
            const newMap = new Map<string, CurfewRecord>(prev);
            // FIX: Provide a complete default object to satisfy the CurfewRecord type.
            const existing = newMap.get(studentId) || { id: '', curfewId: curfewId || '', studentId, status: 'In', notes: undefined };
            newMap.set(studentId, { ...existing, status: newStatus, notes });
            return newMap;
        });
    };

    const handleSave = async () => {
        if (!curfewId || !user) return;
        setIsSaving(true);
        try {
            // FIX: Correctly destructure to omit both 'id' and 'curfewId' to match the expected type.
            const recordsToSave = Array.from(records.values()).map(({ id, curfewId: cId, ...rest }) => rest);
            await hostelService.saveCurfewRecords(curfewId, recordsToSave, user);
            addToast('Curfew sheet saved.', 'success');
        } catch {
            addToast('Failed to save records.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSendAlert = async (student: Student, status: CurfewStatus) => {
        if (!user || status === 'In') return;
        addToast(`Sending mock alert for ${student.name}...`, 'info');
        await hostelService.sendCurfewAlert(student.id, status, user);
    };
    
    const handleExport = () => {
        const studentMap = new Map(boarders.map(s => [s.id, s.name]));
        const data = Array.from(records.values()).map(r => ({
            studentName: studentMap.get(r.studentId) || 'Unknown',
            status: r.status,
            notes: r.notes || '',
        }));
        exportToCsv(`curfew_sheet_${date}.csv`, [
            { key: 'studentName', label: 'Student' },
            { key: 'status', label: 'Status' },
            { key: 'notes', label: 'Notes' },
        ], data);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Curfew</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div><label className="text-sm">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-md" /></div>
                <div><label className="text-sm">Curfew Time</label><input type="time" value={curfewTime} onChange={e => setCurfewTime(e.target.value)} className="w-full rounded-md" /></div>
                <div><label className="text-sm">Alerts</label><div className="flex items-center gap-2"><input type="checkbox" checked={settings?.alertsEnabled} onChange={e => setSettings(s => s ? {...s, alertsEnabled: e.target.checked} : null)} /><span>Enabled</span></div></div>
            </div>
            
            <div className="flex justify-end gap-2">
                <button onClick={handleExport} className="px-4 py-2 bg-white border rounded-md">Export CSV</button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Sheet'}</button>
            </div>
            
            {loading ? <p>Loading...</p> :
            <div className="space-y-4">
                {structure.map(hostel => (
                    <div key={hostel.id} className="bg-white rounded-lg shadow-sm border">
                        <h2 className="p-3 text-lg font-semibold border-b">{hostel.name}</h2>
                        {hostel.rooms.map(room => (
                            <div key={room.id} className="p-3 border-b last:border-0">
                                <h3 className="font-medium">Room {room.roomNumber}</h3>
                                {(boardersByRoom.get(room.id) || []).map(student => {
                                    // FIX: The `records` map is now correctly typed, so `record` has all properties of `CurfewRecord`.
                                    const record = records.get(student.id) || { id: '', curfewId: curfewId || '', studentId: student.id, status: 'In' as CurfewStatus, notes: '' };
                                    return (
                                    <div key={student.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center py-2">
                                        <div className="font-medium">{student.name}</div>
                                        <div className="flex gap-4">
                                            {(['In', 'Late', 'Absent'] as CurfewStatus[]).map(s => (
                                                <label key={s}><input type="radio" name={`status-${student.id}`} value={s} checked={record.status === s} onChange={() => handleRecordChange(student.id, s, record.notes)} className="mr-1" />{s}</label>
                                            ))}
                                        </div>
                                        <input value={record.notes || ''} onChange={e => handleRecordChange(student.id, record.status, e.target.value)} placeholder="Notes..." className="text-sm p-1 border rounded-md" />
                                        <div className="text-right">
                                            {(record.status === 'Late' || record.status === 'Absent') && settings?.alertsEnabled &&
                                                <button onClick={() => handleSendAlert(student, record.status)} className="text-xs text-red-500 hover:underline">Send Alert</button>
                                            }
                                        </div>
                                    </div>
                                )})}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            }
        </div>
    );
};

export default CurfewPage;
