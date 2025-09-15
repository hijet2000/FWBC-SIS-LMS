import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AuditEvent, AuditModule, AuditAction, User } from '../../types';
import * as auditService from '../../lib/auditService';
import Drawer from '../../components/admin/Drawer';
import JsonDiffViewer from '../../components/admin/JsonDiffViewer';

const getISODateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

const AuditTrailPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [users, setUsers] = useState<Omit<User, 'scopes'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

    const filters = useMemo(() => ({
        from: searchParams.get('from') || getISODateDaysAgo(7),
        to: searchParams.get('to') || getISODateDaysAgo(0),
        actorId: searchParams.get('actorId') || '',
        // FIX: Correctly cast the search param to ensure the type is not widened to 'string'.
        module: (searchParams.get('module') || '') as AuditModule | '',
        action: (searchParams.get('action') || '') as AuditAction | '',
        q: searchParams.get('q') || '',
    }), [searchParams]);

    useEffect(() => {
        auditService.listUsers('site_123').then(setUsers);
    }, []);

    useEffect(() => {
        setLoading(true);
        setError(null);
        // FIX: The 'action' filter can be an empty string, which is not assignable to 'AuditAction | undefined'.
        // Coalesce the empty string to 'undefined' to match the expected type.
        auditService.listAuditEvents('site_123', {
            ...filters,
            action: filters.action || undefined,
        })
            .then(setEvents)
            .catch(() => setError('Failed to load audit trail.'))
            .finally(() => setLoading(false));
    }, [filters]);

    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };

    const modules: AuditModule[] = ['STUDENTS', 'ATTENDANCE', 'ACADEMICS', 'FEES', 'AUTH', 'SYSTEM'];
    const actions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'PAYMENT', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE'];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Audit Trail</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="date" value={filters.from} onChange={e => handleFilterChange('from', e.target.value)} className="rounded-md border-gray-300" />
                    <input type="date" value={filters.to} onChange={e => handleFilterChange('to', e.target.value)} className="rounded-md border-gray-300" />
                    <input type="search" placeholder="Search entity or actor..." value={filters.q} onChange={e => handleFilterChange('q', e.target.value)} className="rounded-md border-gray-300" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={filters.actorId} onChange={e => handleFilterChange('actorId', e.target.value)} className="rounded-md border-gray-300"><option value="">All Actors</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                    <select value={filters.module} onChange={e => handleFilterChange('module', e.target.value)} className="rounded-md border-gray-300"><option value="">All Modules</option>{modules.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    <select value={filters.action} onChange={e => handleFilterChange('action', e.target.value)} className="rounded-md border-gray-300"><option value="">All Actions</option>{actions.map(a => <option key={a} value={a}>{a}</option>)}</select>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module:Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        error ? <tr><td colSpan={5} className="p-4 text-center text-red-500">{error}</td></tr> :
                        events.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-gray-500">No events found.</td></tr> :
                        events.map(event => (
                            <tr key={event.id} onClick={() => setSelectedEvent(event)} className="cursor-pointer hover:bg-gray-50">
                                <td className="px-4 py-4 text-sm text-gray-500" title={event.tsISO}>{new Date(event.tsISO).toLocaleString()}</td>
                                <td className="px-4 py-4 text-sm font-medium text-gray-800">{event.actorName}</td>
                                <td className="px-4 py-4 text-sm"><span className="font-mono text-xs bg-gray-100 p-1 rounded">{event.module}:{event.action}</span></td>
                                <td className="px-4 py-4 text-sm text-gray-600">{event.entityDisplay || 'N/A'}</td>
                                <td className="px-4 py-4 text-sm font-mono text-gray-500">{event.ip}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Drawer isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Audit Event Details">
                {selectedEvent && (
                    <div className="p-4 space-y-4">
                        <JsonDiffViewer before={selectedEvent.before} after={selectedEvent.after} />
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Full Event Data</h3>
                            <pre className="text-xs bg-gray-900 text-white p-3 rounded-md overflow-x-auto">
                                {JSON.stringify(selectedEvent, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default AuditTrailPage;
