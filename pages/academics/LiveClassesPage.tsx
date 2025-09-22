import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as liveClassService from '../../lib/liveClassService';
import * as schoolService from '../../lib/schoolService';
import * as academicsService from '../../lib/academicsService';
import type { LiveClass, LiveClassStatus, SchoolClass, Subject, Teacher } from '../../types';

const statusStyles: Record<LiveClassStatus, string> = {
    Scheduled: 'bg-gray-100 text-gray-800',
    Live: 'bg-green-100 text-green-800 animate-pulse',
    Finished: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-red-100 text-red-800',
};

const LiveClassesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [meta, setMeta] = useState<{ classes: SchoolClass[], subjects: Subject[], teachers: Teacher[] }>({ classes: [], subjects: [], teachers: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            liveClassService.listLiveClasses({}),
            schoolService.getClasses(),
            academicsService.listSubjects(),
            academicsService.listTeachers(),
        ]).then(([lcData, classData, subjectData, teacherData]) => {
            setLiveClasses(lcData);
            setMeta({ classes: classData, subjects: subjectData, teachers: teacherData });
        }).catch(() => addToast('Failed to load data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleStatusChange = async (lc: LiveClass, status: LiveClassStatus) => {
        if (!user) return;
        try {
            await liveClassService.updateLiveClassStatus(lc.id, status, user);
            addToast(`Class '${lc.topic}' is now ${status}.`, 'success');
            fetchData();
        } catch {
            addToast('Failed to update status.', 'error');
        }
    };
    
    const handleAddToCatchup = async (lc: LiveClass) => {
        if (!user) return;
        const recordedUrl = prompt("Enter the recording URL:", lc.recordedUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        if (recordedUrl) {
            try {
                await liveClassService.addRecordingToCatchUp(lc.id, recordedUrl, user);
                addToast('Recording added to Catch-Up module.', 'success');
                fetchData();
            } catch {
                addToast('Failed to add recording.', 'error');
            }
        }
    };
    
    const metaMaps = useMemo(() => ({
        classes: new Map(meta.classes.map(c => [c.id, c.name])),
        subjects: new Map(meta.subjects.map(s => [s.id, s.name])),
        teachers: new Map(meta.teachers.map(t => [t.id, t.name])),
    }), [meta]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Live Classes</h1>
                <button className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Schedule New Class</button>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Topic</th>
                        <th className="p-3 text-left text-xs uppercase">Class & Subject</th>
                        <th className="p-3 text-left text-xs uppercase">Time (Duration)</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        liveClasses.map(lc => (
                            <tr key={lc.id}>
                                <td className="p-3 font-medium">{lc.topic}</td>
                                <td className="p-3 text-sm">{metaMaps.classes.get(lc.classId)} / {metaMaps.subjects.get(lc.subjectId)}</td>
                                <td className="p-3 text-sm">{new Date(lc.startTime).toLocaleString()} ({lc.durationMinutes}m)</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${statusStyles[lc.status]}`}>{lc.status}</span></td>
                                <td className="p-3 text-right text-sm font-medium space-x-2">
                                    {lc.status === 'Scheduled' && <button onClick={() => handleStatusChange(lc, 'Live')} className="text-green-600">Start</button>}
                                    {lc.status === 'Live' && <button onClick={() => handleStatusChange(lc, 'Finished')} className="text-red-600">End</button>}
                                    {lc.status === 'Finished' && <button onClick={() => handleAddToCatchup(lc)} className="text-blue-600">Add to Catch-Up</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LiveClassesPage;
