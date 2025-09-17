import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { getStudent } from '../../lib/schoolService';
import type { Homework, Submission, SubmissionStatus, Feedback, Student } from '../../types';
import FeedbackModal from '../../components/homework/FeedbackModal';

const HomeworkSubmissionsPage: React.FC = () => {
    const { siteId, homeworkId } = useParams<{ siteId: string, homeworkId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [homework, setHomework] = useState<Homework | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [students, setStudents] = useState<Map<string, Student>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    const fetchData = () => {
        if (!homeworkId) return;
        setLoading(true);
        Promise.all([
            homeworkService.getHomework(homeworkId),
            homeworkService.listSubmissionsForHomework(homeworkId)
        ]).then(async ([hwData, subData]) => {
            setHomework(hwData);
            setSubmissions(subData);
            
            // Fetch student details for the roster
            const studentMap = new Map<string, Student>();
            for (const sub of subData) {
                const studentData = await getStudent(sub.studentId);
                if (studentData) {
                    studentMap.set(sub.studentId, studentData);
                }
            }
            setStudents(studentMap);
        }).catch(() => {
            addToast('Failed to load submission data.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, [homeworkId, addToast]);

    const handleFeedbackSuccess = () => {
        setSelectedSubmission(null);
        addToast('Feedback saved successfully!', 'success');
        fetchData(); // Refresh data to show feedback status
    };

    const statusStyles: Record<SubmissionStatus, string> = {
        'On-time': 'bg-green-100 text-green-800',
        'Late': 'bg-yellow-100 text-yellow-800',
        'Not Submitted': 'bg-gray-100 text-gray-800',
    };

    if (loading) return <div className="p-8 text-center">Loading submissions...</div>;
    if (!homework) return <div className="p-8 text-center text-red-500">Homework not found.</div>;

    return (
        <div className="space-y-6">
            <div>
                <Link to={`/school/${siteId}/homework`} className="text-sm text-indigo-600 hover:text-indigo-800">&larr; Back to Homework List</Link>
                <h1 className="text-3xl font-bold text-gray-800">{homework.title}</h1>
                <p className="mt-1 text-sm text-gray-500">Due: {homework.dueDate}</p>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{homework.instructions}</p>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map(sub => {
                            const student = students.get(sub.studentId);
                            return (
                                <tr key={sub.id}>
                                    <td className="px-4 py-4 text-sm font-medium">{student?.name || 'Loading...'}</td>
                                    <td className="px-4 py-4 text-sm"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[sub.status]}`}>{sub.status}</span></td>
                                    <td className="px-4 py-4 text-sm">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}</td>
                                    <td className="px-4 py-4 text-right text-sm font-medium">
                                        {sub.status !== 'Not Submitted' && (
                                            <button onClick={() => setSelectedSubmission(sub)} className="text-indigo-600 hover:text-indigo-900">
                                                Give Feedback
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedSubmission && user && (
                <FeedbackModal
                    isOpen={!!selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    onSaveSuccess={handleFeedbackSuccess}
                    submission={selectedSubmission}
                    studentName={students.get(selectedSubmission.studentId)?.name || ''}
                    actor={user}
                />
            )}
        </div>
    );
};

export default HomeworkSubmissionsPage;
