import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as examService from '../../lib/examService';
import * as academicsService from '../../lib/academicsService';
import * as schoolService from '../../lib/schoolService';
import type { OnlineExam, OnlineExamStatus, Subject, SchoolClass } from '../../types';
import ExamModal from '../../components/academics/ExamModal';

const statusStyles: Record<OnlineExamStatus, string> = {
    Draft: 'bg-gray-100 text-gray-800',
    Published: 'bg-green-100 text-green-800',
    Archived: 'bg-blue-100 text-blue-800',
};

const TeacherOnlineExamsPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [exams, setExams] = useState<OnlineExam[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<OnlineExam | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            examService.listAllExams(),
            academicsService.listSubjects(),
            schoolService.getClasses(),
        ]).then(([examData, subjectData, classData]) => {
            setExams(examData);
            setSubjects(subjectData);
            setClasses(classData);
        }).catch(() => addToast('Failed to load exam data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (exam: OnlineExam | null = null) => {
        setEditingExam(exam);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setEditingExam(null);
        addToast(editingExam ? 'Exam updated!' : 'Exam created!', 'success');
        fetchData();
    };
    
    const handleArchive = async (exam: OnlineExam) => {
        if(!user || exam.status === 'Archived') return;
        try {
            await examService.updateExam(exam.id, { status: 'Archived' }, user);
            addToast('Exam archived successfully.', 'success');
            fetchData();
        } catch {
            addToast('Failed to archive exam.', 'error');
        }
    }

    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Online Exams</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
                    Create Exam
                </button>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Title</th>
                            <th className="p-3 text-left text-xs uppercase">Class / Subject</th>
                            <th className="p-3 text-left text-xs uppercase">Window</th>
                            <th className="p-3 text-left text-xs uppercase">Status</th>
                            <th className="p-3 text-right text-xs uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        exams.map(exam => (
                            <tr key={exam.id}>
                                <td className="p-3 font-medium">{exam.title}</td>
                                <td className="p-3 text-sm">{classMap.get(exam.classId)}<br/>{subjectMap.get(exam.subjectId)}</td>
                                <td className="p-3 text-sm">{new Date(exam.startTime).toLocaleString()} - {new Date(exam.endTime).toLocaleString()}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${statusStyles[exam.status]}`}>{exam.status}</span></td>
                                <td className="p-3 text-right text-sm font-medium space-x-2">
                                    <Link to={`/school/${siteId}/online-exams/${exam.id}/questions`} className="text-blue-600">Manage Questions ({exam.totalMarks} marks)</Link>
                                    <Link to={`/school/${siteId}/online-exams/${exam.id}/settings`} className="text-gray-600">Settings</Link>
                                    <button onClick={() => handleOpenModal(exam)} className="text-indigo-600">Edit</button>
                                    <button onClick={() => handleArchive(exam)} disabled={exam.status === 'Archived'} className="text-red-600 disabled:text-gray-400">Archive</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {user && (
                <ExamModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaveSuccess={handleSaveSuccess}
                    initialData={editingExam}
                    actor={user}
                    subjects={subjects}
                    classes={classes}
                />
            )}
        </div>
    );
};

export default TeacherOnlineExamsPage;