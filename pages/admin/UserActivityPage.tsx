import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { User, UserSession, AuditEvent } from '../../types';
import * as auditService from '../../lib/auditService';
import Toast from '../../components/ui/Toast';
import { adminKeys } from '../../lib/queryKeys';

const getISODateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

const UserActivityPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [users, setUsers] = useState<Omit<User, 'scopes'>[]>([]);
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState({ users: true, activity: false });
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const filters = useMemo(() => ({
        userId: searchParams.get('userId') || '',
        from: searchParams.get('from') || getISODateDaysAgo(7),
        to: searchParams.get('to') || getISODateDaysAgo(0),
    }), [searchParams]);

    const sessionsQueryKey = adminKeys.userSessions.list(filters);
    const eventsQueryKey = adminKeys.auditEvents.list({ actorId: filters.userId, from: filters.from, to: filters.to });


    useEffect(() => {
        setLoading(p => ({...p, users: true}));
        auditService.listUsers('site_123').then(data => {
            setUsers(data);
            if (!filters.userId && data.length > 0) {
                handleFilterChange('userId', data[0].id);
            }
        }).finally(() => setLoading(p => ({...p, users: false})));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!filters.userId) return;
        setLoading(p => ({...p, activity: true}));
        
        const [,, sessionFilters] = sessionsQueryKey;
        const [,, eventFilters] = eventsQueryKey;

        Promise.all([
            auditService.listUserSessions('site_123', sessionFilters.userId, { from: sessionFilters.from, to: sessionFilters.to }),
            auditService.listUserEvents('site_123', eventFilters.actorId, { from: eventFilters.from, to: eventFilters.to })
        ]).then(([sessionsData, eventsData]) => {
            setSessions(sessionsData);
            setEvents(eventsData);
        }).finally(() => setLoading(p => ({...p, activity: false})));
    }, [sessionsQueryKey, eventsQueryKey, filters.userId]);
    
    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };
    
    const handleTerminate = async (sessionId: string) => {
        await auditService.terminateSession('site_123', sessionId);
        setToast({ message: 'Session terminated.', type: 'success' });
        // Refetch sessions
        const [,, sessionFilters] = sessionsQueryKey;
        auditService.listUserSessions('site_123', sessionFilters.userId, { from: sessionFilters.from, to: sessionFilters.to }).then(setSessions);
    };

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-gray-800">User Activity</h1>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={filters.userId} onChange={e => handleFilterChange('userId', e.target.value)} className="rounded-md border-gray-300">
                        {loading.users ? <option>Loading users...</option> : users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <input type="date" value={filters.from} onChange={e => handleFilterChange('from', e.target.value)} className="rounded-md border-gray-300" />
                    <input type="date" value={filters.to} onChange={e => handleFilterChange('to', e.target.value)} className="rounded-md border-gray-300" />
                </div>
            </div>

            {loading.activity ? <div className="text-center p-8">Loading activity...</div> :
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Sessions</h2>
                        <ul className="divide-y divide-gray-200">
                            {sessions.map(s => (
                                <li key={s.id} className="py-2 text-sm">
                                    <p><strong>Login:</strong> {new Date(s.loginISO).toLocaleString()}</p>
                                    <p><strong>Logout:</strong> {s.logoutISO ? new Date(s.logoutISO).toLocaleString() : (s.active ? <span className="text-green-600">Active</span> : 'N/A')}</p>
                                    <p className="text-xs text-gray-500 truncate" title={s.ua}>{s.ip} | {s.ua}</p>
                                    {s.active && <button onClick={() => handleTerminate(s.id)} className="text-xs text-red-500 hover:underline">Terminate</button>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Events</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead><tr>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Event</th>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Entity</th>
                                </tr></thead>
                                <tbody>
                                    {events.map(e => (
                                        <tr key={e.id}>
                                            <td className="px-2 py-2 text-sm whitespace-nowrap" title={e.tsISO}>{new Date(e.tsISO).toLocaleTimeString()}</td>
                                            <td className="px-2 py-2 text-sm"><span className="font-mono text-xs bg-gray-100 p-1 rounded">{e.module}:{e.action}</span></td>
                                            <td className="px-2 py-2 text-sm">{e.entityDisplay || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>}
        </div>
    );
};

export default UserActivityPage;