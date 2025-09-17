import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as liveClassService from '../../lib/liveClassService';
import { getClasses } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
import type { LiveClassSession, SchoolClass, Subject } from '../../types';
import LiveClassSessionModal from '../../components/live/LiveClassSessionModal';
import LiveClassDetailDrawer from '../../components/live/LiveClassDetailDrawer';

const getISODateDaysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const LiveClassesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [sessions, setSessions] = useState<LiveClassSession[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<LiveClassSession | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            liveClassService.listSessions({ from: getISODateDaysFromNow(-7), to: getISODateDaysFromNow(14) }),
            getClasses(),
            listSubjects(),
        ]).then(([sessionData, classData, subjectData]) => {
            setSessions(sessionData);
            setClasses(classData);
            setSubjects(subjectData);
        }).catch(() => addToast('Failed to load live class data.', 'error'))
        .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleOpenDrawer = (session: LiveClassSession) => {
        setSelectedSession(session);
        setIsDrawerOpen(true);
    };
    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedSession(null);
        fetchData(); // Refresh list after potential changes
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        addToast('Session scheduled successfully!', 'success');
        fetchData();
    };
    
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Live Classes</h1>
                <button onClick={handleOpenModal} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">New Session</button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Upcoming & Recent Sessions</h2>
                <ul className="divide-y divide-gray-200">
                    {loading ? <li className="p-4 text-center">Loading...</li> : sessions.map(session => (
                        <li key={session.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <p className="font-semibold text-gray-800">{session.title}</p>
                                <p className="text-sm text-gray-500">{classMap.get(session.classId)} - {subjectMap.get(session.subjectId)}</p>
                                <p className="text-xs text-gray-400">{new Date(session.startTime).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${session.status === 'In Progress' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{session.status}</span>
                                <button onClick={() => handleOpenDrawer(session)} className="text-sm font-medium text-indigo-600">Manage</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {user && (
                <LiveClassSessionModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSaveSuccess={handleSaveSuccess}
                    actor={user}
                    classes={classes}
                    subjects={subjects}
                />
            )}
            {selectedSession && user && (
                <LiveClassDetailDrawer
                    isOpen={isDrawerOpen}
                    onClose={handleCloseDrawer}
                    session={selectedSession}
                    actor={user}
                    classMap={classMap}
                    subjectMap={subjectMap}
                />
            )}
        </div>
    );
};

export default LiveClassesPage;