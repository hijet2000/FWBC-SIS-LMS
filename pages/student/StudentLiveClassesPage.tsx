import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as liveClassService from '../../lib/liveClassService';
import * as academicsService from '../../lib/academicsService';
import type { LiveClass, LiveClassStatus, Teacher } from '../../types';

const statusStyles: Record<LiveClassStatus, string> = {
    Scheduled: 'bg-gray-100 text-gray-800',
    Live: 'bg-green-100 text-green-800',
    Finished: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-red-100 text-red-800',
};

const LiveClassCard: React.FC<{ lc: LiveClass, teacherName?: string }> = ({ lc, teacherName }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const studentId = 's01'; // HACK
    
    const handleJoin = async () => {
        if (!user) return;
        try {
            await liveClassService.joinLiveClass(lc.id, studentId);
            addToast('Attendance marked! Joining class...', 'success');
            window.open(lc.joinUrl, '_blank');
        } catch {
            addToast('Failed to join class.', 'error');
        }
    };

    const isJoinable = useMemo(() => {
        if (lc.status !== 'Scheduled' && lc.status !== 'Live') return false;
        const now = new Date().getTime();
        const startTime = new Date(lc.startTime).getTime();
        const tenMinutes = 10 * 60 * 1000;
        return now >= (startTime - tenMinutes);
    }, [lc.status, lc.startTime]);
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[lc.status]}`}>{lc.status}</span>
                    <span className="text-sm font-medium">{new Date(lc.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
                </div>
                <h3 className="font-semibold text-lg mt-1">{lc.topic}</h3>
                <p className="text-sm text-gray-500">{teacherName}</p>
            </div>
            {(lc.status === 'Scheduled' || lc.status === 'Live') && (
                <button onClick={handleJoin} disabled={!isJoinable} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {lc.status === 'Live' ? 'Join Now' : 'Join'}
                </button>
            )}
        </div>
    );
};

const StudentLiveClassesPage: React.FC = () => {
    const { addToast } = useToast();
    const studentId = 's01'; // HACK
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            liveClassService.listLiveClasses({ studentId }),
            academicsService.listTeachers(),
        ]).then(([lcData, teacherData]) => {
            setLiveClasses(lcData);
            setTeachers(teacherData);
        }).catch(() => addToast('Failed to load data.', 'error'))
          .finally(() => setLoading(false));
    }, [studentId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Live Classes</h1>
            {loading ? <p>Loading schedule...</p> : (
                <div className="space-y-4">
                    {liveClasses.length === 0 ? <p>No live classes scheduled.</p> : liveClasses.map(lc => (
                        <LiveClassCard key={lc.id} lc={lc} teacherName={teacherMap.get(lc.teacherId)} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentLiveClassesPage;
