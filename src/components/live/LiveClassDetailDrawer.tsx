import React, { useState, useEffect } from 'react';
import Drawer from '../admin/Drawer';
import { useToast } from '../../contexts/ToastContext';
import * as liveClassService from '../../lib/liveClassService';
import { getStudentsByClass } from '../../lib/schoolService';
import type { LiveClassSession, LiveClassAttendance, Student, User } from '../../types';

interface LiveClassDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    session: LiveClassSession;
    actor: User;
    classMap: Map<string, string>;
    subjectMap: Map<string, string>;
}

const LiveClassDetailDrawer: React.FC<LiveClassDetailDrawerProps> = ({ isOpen, onClose, session, actor, classMap, subjectMap }) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'attendance' | 'recording'>('attendance');
    const [attendance, setAttendance] = useState<LiveClassAttendance[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && activeTab === 'attendance' && attendance.length === 0) {
            setLoading(true);
            Promise.all([
                liveClassService.getAttendanceForSession(session.id),
                getStudentsByClass(session.classId)
            ]).then(([attData, stuData]) => {
                setAttendance(attData);
                setStudents(stuData);
            }).finally(() => setLoading(false));
        }
    }, [isOpen, activeTab, session.id, session.classId, attendance.length]);

    const handleOverride = async (studentId: string) => {
        const reason = prompt("Reason for override (e.g., parent called in):");
        if (reason) {
            await liveClassService.overrideAttendance(session.id, studentId, reason, actor);
            addToast('Attendance overridden.', 'success');
            // Refresh
            liveClassService.getAttendanceForSession(session.id).then(setAttendance);
        }
    };
    
    const handlePublish = async () => {
        await liveClassService.publishRecording(session.id, actor);
        addToast('Recording published to Catch-Up library.', 'success');
        onClose();
    };

    const studentMap = new Map(students.map(s => [s.id, s.name]));

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="Manage Session">
            <div className="p-4 border-b">
                <h3 className="font-bold text-lg">{session.title}</h3>
                <p className="text-sm text-gray-500">{classMap.get(session.classId)} - {subjectMap.get(session.subjectId)}</p>
                <div className="mt-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8"><button onClick={() => setActiveTab('attendance')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'attendance' ? 'border-indigo-500' : 'border-transparent'}`}>Attendance</button><button onClick={() => setActiveTab('recording')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'recording' ? 'border-indigo-500' : 'border-transparent'}`}>Recording</button></nav>
                </div>
            </div>

            {activeTab === 'attendance' && <div className="p-4">
                {loading ? <p>Calculating attendance...</p> :
                <ul className="divide-y divide-gray-200">
                    {attendance.map(att => (
                        <li key={att.studentId} className="py-2 flex justify-between items-center">
                            <div>
                                <p>{studentMap.get(att.studentId)}</p>
                                <p className="text-xs text-gray-500">{att.attendancePercentage}% attended ({att.minutesAttended} mins) {att.isLate && <span className="text-yellow-600">(Late)</span>}</p>
                            </div>
                            {att.isOverridden ? <span className="text-xs text-green-600">Overridden</span> : <button onClick={() => handleOverride(att.studentId)} className="text-xs text-indigo-600">Override</button>}
                        </li>
                    ))}
                </ul>}
            </div>}
            
            {activeTab === 'recording' && <div className="p-4 space-y-4">
                <p><strong>Recording URL:</strong> {session.recordingUrl || 'Not available yet.'}</p>
                {session.isRecordingPublished ? <p className="text-green-600 font-bold">Published to Catch-Up library.</p> :
                    <button onClick={handlePublish} disabled={session.status !== 'Finished'} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Publish to Catch-Up</button>
                }
            </div>}
        </Drawer>
    );
};

export default LiveClassDetailDrawer;