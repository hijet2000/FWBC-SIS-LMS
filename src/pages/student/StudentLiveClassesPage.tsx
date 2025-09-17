import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as liveClassService from '../../lib/liveClassService';
import { getClasses } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
import type { LiveClassSession, SchoolClass, Subject } from '../../types';
import { Link, useParams } from 'react-router-dom';

const StudentLiveClassesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { siteId } = useParams();
    const [sessions, setSessions] = useState<LiveClassSession[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            liveClassService.listSessions({ from: new Date(0).toISOString(), to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }),
            getClasses(),
            listSubjects(),
        ]).then(([sessionData, classData, subjectData]) => {
            setSessions(sessionData);
            setClasses(classData);
            setSubjects(subjectData);
        }).catch(() => addToast('Failed to load live class data.', 'error'))
        .finally(() => setLoading(false));
    }, [addToast]);
    
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const upcomingSessions = sessions.filter(s => new Date(s.startTime) > new Date());
    const pastSessions = sessions.filter(s => new Date(s.startTime) <= new Date());

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Live Classes</h1>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
                 <ul className="divide-y divide-gray-200">
                    {loading ? <li className="p-4 text-center">Loading...</li> : 
                    upcomingSessions.length === 0 ? <li className="p-4 text-center text-gray-500">No upcoming sessions.</li> :
                    upcomingSessions.map(session => (
                        <li key={session.id} className="p-3 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{session.title}</p>
                                <p className="text-sm text-gray-500">{subjectMap.get(session.subjectId)}</p>
                                <p className="text-xs text-gray-400">{new Date(session.startTime).toLocaleString()}</p>
                            </div>
                            <a href={session.joinUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-green-600 text-white rounded-md">Join</a>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Past Sessions & Recordings</h2>
                 <ul className="divide-y divide-gray-200">
                    {loading ? <li className="p-4 text-center">Loading...</li> : 
                    pastSessions.map(session => (
                        <li key={session.id} className="p-3 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{session.title}</p>
                                <p className="text-sm text-gray-500">{subjectMap.get(session.subjectId)}</p>
                            </div>
                            {session.isRecordingPublished && session.catchupId ?
                                <Link to={`/school/${siteId}/library/catchup/view/${session.catchupId}`} className="px-4 py-2 bg-indigo-600 text-white rounded-md">View Recording</Link> :
                                <span className="text-sm text-gray-400">Recording not available</span>
                            }
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
};

export default StudentLiveClassesPage;