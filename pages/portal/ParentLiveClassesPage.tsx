import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as liveClassService from '../../lib/liveClassService';
import * as academicsService from '../../lib/academicsService';
import { getStudent } from '../../lib/schoolService';
import type { LiveClass, LiveClassStatus, Teacher, Student } from '../../types';

const statusStyles: Record<LiveClassStatus, string> = {
    Scheduled: 'bg-gray-100 text-gray-800',
    Live: 'bg-green-100 text-green-800',
    Finished: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-red-100 text-red-800',
};

const ParentLiveClassesPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const { addToast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        if (!studentId) return;
        setLoading(true);
        Promise.all([
            getStudent(studentId),
            liveClassService.listLiveClasses({ studentId }),
            academicsService.listTeachers(),
        ]).then(([studentData, lcData, teacherData]) => {
            setStudent(studentData);
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
            <h1 className="text-3xl font-bold text-gray-800">My Child's Live Classes</h1>
            {student && <p className="text-gray-600">Viewing schedule for: <span className="font-semibold">{student.name}</span></p>}
            
            {loading ? <p>Loading schedule...</p> : (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <ul className="divide-y divide-gray-200">
                        {liveClasses.length === 0 ? <li className="py-4 text-center text-gray-500">No live classes scheduled.</li> : 
                        liveClasses.map(lc => (
                            <li key={lc.id} className="py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{lc.topic}</p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(lc.startTime).toLocaleString()} ({lc.durationMinutes} mins)
                                        </p>
                                        <p className="text-xs text-gray-500">with {teacherMap.get(lc.teacherId)}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[lc.status]}`}>{lc.status}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ParentLiveClassesPage;
