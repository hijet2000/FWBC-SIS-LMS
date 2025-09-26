import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as examService from '../../lib/examService';
import * as academicsService from '../../lib/academicsService';
import type { OnlineExam, StudentExamSubmission, Subject } from '../../types';

interface ExamCardProps {
    exam: OnlineExam;
    submission?: StudentExamSubmission;
    subjectName: string;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, submission, subjectName }) => {
    const { siteId } = useParams<{ siteId: string }>();

    const getStatus = (): { text: string; actionText: string; link: string; disabled: boolean; className: string } => {
        const now = new Date().getTime();
        const startTime = new Date(exam.startTime).getTime();
        const endTime = new Date(exam.endTime).getTime();

        if (submission?.status === 'Submitted') {
            if (exam.resultsPublishedAt) {
                return { text: 'Completed', actionText: 'View Results', link: `/school/${siteId}/student/online-exams/${exam.id}/results`, disabled: false, className: 'border-green-500' };
            } else {
                return { text: 'Submitted', actionText: 'Results Pending', link: '#', disabled: true, className: 'border-blue-500' };
            }
        }
        if (now < startTime) {
            return { text: 'Upcoming', actionText: 'Not Started', link: '#', disabled: true, className: 'border-gray-300' };
        }
        if (now >= startTime && now <= endTime) {
            return { text: 'Active', actionText: 'Start Exam', link: `/school/${siteId}/take-exam/${exam.id}`, disabled: false, className: 'border-blue-500 animate-pulse' };
        }
        return { text: 'Expired', actionText: 'Window Closed', link: '#', disabled: true, className: 'border-red-500' };
    };

    const { text, actionText, link, disabled, className } = getStatus();

    return (
        <div className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${className}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500">{subjectName}</p>
                    <h3 className="font-semibold text-lg text-gray-800">{exam.title}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-full">{text}</span>
            </div>
            <div className="mt-4 text-xs text-gray-600">
                <p><strong>Window:</strong> {new Date(exam.startTime).toLocaleString()} to {new Date(exam.endTime).toLocaleString()}</p>
                <p><strong>Duration:</strong> {exam.durationMinutes} minutes</p>
                <p><strong>Marks:</strong> {exam.totalMarks}</p>
            </div>
            <Link to={link} aria-disabled={disabled} onClick={(e) => { if (disabled) e.preventDefault(); }}
                className="mt-4 w-full text-center inline-block px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed aria-disabled:bg-gray-400 aria-disabled:cursor-not-allowed"
            >
                {actionText}
            </Link>
        </div>
    );
};


const StudentOnlineExamsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    // HACK: Hardcoding studentId and classId for demo purposes.
    const studentId = 's01';
    const classId = 'c1';

    const [exams, setExams] = useState<{exam: OnlineExam, submission?: StudentExamSubmission}[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        if (!studentId || !classId) return;
        setLoading(true);
        Promise.all([
            examService.listExamsForStudent(studentId, classId),
            academicsService.listSubjects(),
        ]).then(([examData, subjectData]) => {
            setExams(examData);
            setSubjects(subjectData);
        }).catch(() => {
            addToast('Failed to load exams.', 'error');
        }).finally(() => setLoading(false));
    }, [studentId, classId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Online Exams</h1>

            {loading ? <p>Loading exams...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.length > 0 ? (
                        exams.map(({ exam, submission }) => (
                            <ExamCard key={exam.id} exam={exam} submission={submission} subjectName={subjectMap.get(exam.subjectId) || 'Unknown Subject'} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 p-8 bg-gray-50 rounded-lg">No online exams have been assigned to you.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentOnlineExamsPage;