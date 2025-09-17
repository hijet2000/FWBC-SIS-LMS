import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as admissionsService from '../../lib/admissionsService';
import { listTeachers } from '../../lib/academicsService';
import type { CallLog, Teacher, CallTopic, CallStatus, User, CallDirection, Student, Enquiry } from '../../types';
import { exportToCsv } from '../../lib/exporters';
import Drawer from '../../components/admin/Drawer';

const CallLogPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const [logs, setLogs] = useState<CallLog[]>([]);
    const [owners, setOwners] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
    const [isRedacted, setIsRedacted] = useState(true);

    const [quickLog, setQuickLog] = useState({ 
        direction: 'Inbound' as CallDirection, 
        topic: 'Enquiry' as CallTopic, 
        notes: '',
        callerName: '',
        number: '',
    });

    const filters = useMemo(() => ({
        status: searchParams.get('status') || undefined,
        direction: searchParams.get('direction') || undefined,
    }), [searchParams]);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([admissionsService.listCallLogs(), listTeachers()])
            .then(([logData, teacherData]) => {
                setLogs(logData);
                setOwners(teacherData);
            })
            .catch(() => addToast('Failed to load call logs.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if(value) newParams.set(key, value); else newParams.delete(key);
            return newParams;
        });
    };

    const handleQuickLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !quickLog.notes.trim()) return;
        
        try {
            const newLog = await admissionsService.createCallLog({
                ...quickLog,
                callAt: new Date().toISOString(),
            }, user);
            
            if (newLog.topic === 'Safeguarding') {
                addToast('SAFEGUARDING ALERT: New log created. DSL has been notified.', 'error');
            } else {
                addToast('Call logged successfully.', 'success');
            }
            setQuickLog({ direction: 'Inbound', topic: 'Enquiry', notes: '', callerName: '', number: '' });
            fetchData();
        } catch {
            addToast('Failed to log call.', 'error');
        }
    };
    
    const handleUpdateLog = async (logId: string, update: Partial<CallLog>) => {
        if(!user) return;
        try {
            await admissionsService.updateCallLog(logId, update, user);
            addToast('Log updated.', 'success');
            fetchData();
            setSelectedLog(prev => prev ? {...prev, ...update} : null);
        } catch {
             addToast('Update failed.', 'error');
        }
    }

    const handleExport = () => {
        const ownerMap = new Map(owners.map(o => [o.id, o.name]));
        const data = filteredLogs.map(log => ({
            ...log,
            callerName: isRedacted ? '[REDACTED]' : log.callerName,
            number: isRedacted ? '[REDACTED]' : log.number,
            ownerName: log.ownerUserId ? ownerMap.get(log.ownerUserId) : '',
        }));
        exportToCsv('call_log.csv', [
            { key: 'callAt', label: 'Timestamp' },
            { key: 'direction', label: 'Direction' },
            { key: 'callerName', label: 'Name' },
            { key: 'number', label: 'Number' },
            { key: 'topic', label: 'Topic' },
            { key: 'status', label: 'Status' },
            { key: 'ownerName', label: 'Owner' },
        ], data);
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(l => 
            (filters.status ? l.status === filters.status : true) &&
            (filters.direction ? l.direction === filters.direction : true)
        );
    }, [logs, filters]);

    const ownerMap = useMemo(() => new Map(owners.map(o => [o.id, o.name])), [owners]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Phone Call Log</h1>

            <form onSubmit={handleQuickLogSubmit} className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                <h2 className="text-lg font-semibold">Quick Log</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={quickLog.callerName} onChange={e => setQuickLog({...quickLog, callerName: e.target.value})} placeholder="Caller Name" className="rounded-md" />
                    <input type="tel" value={quickLog.number} onChange={e => setQuickLog({...quickLog, number: e.target.value})} placeholder="Phone Number" className="rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={quickLog.direction} onChange={e => setQuickLog({...quickLog, direction: e.target.value as CallDirection})} className="rounded-md">
                        <option value="Inbound">Inbound</option>
                        <option value="Outbound">Outbound</option>
                    </select>
                    <select value={quickLog.topic} onChange={e => setQuickLog({...quickLog, topic: e.target.value as CallTopic})} className="rounded-md">
                         {(['Enquiry', 'Complaint', 'Attendance', 'Fees', 'Safeguarding', 'Other'] as CallTopic[]).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <textarea value={quickLog.notes} onChange={e => setQuickLog({...quickLog, notes: e.target.value})} placeholder="Enter call notes here..." className="w-full rounded-md" rows={3} required />
                <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Log Call</button>
                </div>
            </form>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                <div className="flex gap-4">
                    <select value={filters.status || ''} onChange={e => handleFilterChange('status', e.target.value)} className="rounded-md">
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <select value={filters.direction || ''} onChange={e => handleFilterChange('direction', e.target.value)} className="rounded-md">
                        <option value="">All Directions</option>
                        <option value="Inbound">Inbound</option>
                        <option value="Outbound">Outbound</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input id="redact" type="checkbox" checked={isRedacted} onChange={e => setIsRedacted(e.target.checked)} className="rounded"/>
                        <label htmlFor="redact" className="text-sm">Redact PII</label>
                    </div>
                    <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md">Export CSV</button>
                </div>
            </div>

             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Timestamp</th>
                        <th className="p-3 text-left text-xs uppercase">Caller</th>
                        <th className="p-3 text-left text-xs uppercase">Topic</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-left text-xs uppercase">Owner</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        filteredLogs.map(log => (
                            <tr key={log.id} onClick={() => setSelectedLog(log)} className="cursor-pointer hover:bg-gray-50">
                                <td className="p-3 text-sm">{new Date(log.callAt).toLocaleString()}</td>
                                <td className="p-3 text-sm">{log.callerName || 'N/A'} <span className="text-gray-500">{log.number}</span></td>
                                <td className="p-3 text-sm">{log.topic === 'Safeguarding' ? <span className="text-red-600 font-bold flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> {log.topic}</span> : log.topic}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${log.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{log.status}</span></td>
                                <td className="p-3 text-sm">{log.ownerUserId ? ownerMap.get(log.ownerUserId) : <span className="text-gray-400">Unassigned</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Drawer isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Call Details">
                {selectedLog && (
                <div className="p-4 space-y-4">
                    <div>
                        <h3 className="font-semibold">Notes</h3>
                        <p className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded-md border">{selectedLog.notes || 'No notes.'}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold">Linked Entity</h3>
                        <p className="text-sm">{selectedLog.linkedEntity ? `${selectedLog.linkedEntity.type}: ${selectedLog.linkedEntity.name}` : 'None'}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Assign Owner</h3>
                        <select value={selectedLog.ownerUserId || ''} onChange={e => handleUpdateLog(selectedLog.id, { ownerUserId: e.target.value })} className="w-full rounded-md">
                            <option value="">Unassigned</option>
                            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <button onClick={() => handleUpdateLog(selectedLog.id, { status: 'Closed' })} disabled={selectedLog.status === 'Closed'} className="w-full px-4 py-2 text-white bg-green-600 rounded-md disabled:bg-gray-400">Mark as Closed</button>
                    </div>
                </div>
                )}
            </Drawer>

        </div>
    );
};

export default CallLogPage;