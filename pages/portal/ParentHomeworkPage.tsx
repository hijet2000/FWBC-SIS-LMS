import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { getStudent } from '../../lib/schoolService';
import type { Homework, Submission, Feedback, Student } from '../../types';

type HomeworkWithSubmission = Homework & { submission?: Submission & { feedback?: Feedback } };

const ParentHomeworkCard: React.FC<{ hw: HomeworkWithSubmission }> = ({ hw }) => {
    const isOverdue = new Date(hw.dueDate) < new Date() && !hw.submission;
    const isLate = hw.submission?.status === 'Late';
    const isGraded = !!hw.submission?.feedback;

    const getStatus = (): { text: string; className: string } => {
        if (isGraded) return { text: 'Graded', className: 'bg-green-100 text-green-800' };
        if (hw.submission) return { text: `Submitted ${isLate ? '(Late)' : ''}`, className: isLate ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800' };
        if (isOverdue) return { text: 'Overdue', className: 'bg-red-100 text-red-800' };
        return { text: 'Due Soon', className: 'bg-gray-100 text-gray-800' };
    };

    const status = getStatus();

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3">
            <div>
                <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status.className}`}>{status.text}</span>
                    <span className="text-xs text-gray-500">Due: {hw.dueDate}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mt-2">{hw.title}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3 mt-1">{hw.instructions}</p>
            </div>
            
            {hw.submission && (
                 <div className="pt-3 border-t">
                    <h4 className="font-semibold text-sm text-gray-700">Submission Details</h4>
                    <p className="text-sm text-gray-600">Status: <span className="font-medium">{hw.submission.status}</span></p>
                    {hw.submission.submittedAt && <p className="text-sm text-gray-600">Time: {new Date(hw.submission.submittedAt).toLocaleString()}</p>}
                </div>
            )}

            {isGraded && (
                <div className="pt-3 border-t border-indigo-200 bg-indigo-50 p-3 rounded-md">
                    <h4 className="font-semibold text-sm text-indigo-800">Teacher Feedback</h4>
                    <div className="flex justify-between items-baseline mt-1">
                        <p className="text-sm font-medium text-indigo-700">Score</p>
                        <p className="text-2xl font-bold text-indigo-600">{hw.submission?.feedback?.score}/100</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-indigo-700 mt-2">Comments</p>
                        <p className="text-sm text-gray-800 bg-white p-2 rounded mt-1">{hw.submission?.feedback?.comments}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ParentHomeworkPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const { addToast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [homework, setHomework] = useState<HomeworkWithSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                const studentData = await getStudent(studentId);
                setStudent(studentData);

                if (!studentData) {
                    addToast('Could not find student.', 'error');
                    return;
                }

                const [hwData, subData] = await Promise.all([
                    homeworkService.listHomework({ classId: studentData.classId }),
                    homeworkService.getSubmissionsForStudent(studentId)
                ]);

                const submissionMap = new Map(subData.map(s => [s.homeworkId, s]));
                const combinedData = hwData.map(hw => ({
                    ...hw,
                    submission: submissionMap.get(hw.id),
                }));

                setHomework(combinedData);
            } catch {
                addToast('Failed to load homework.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId, addToast]);

    const { activeItems, gradedItems } = useMemo(() => {
        const active: HomeworkWithSubmission[] = [];
        const graded: HomeworkWithSubmission[] = [];
        homework.forEach(hw => {
            if (hw.submission?.feedback) {
                graded.push(hw);
            } else {
                active.push(hw);
            }
        });
        return { activeItems: active.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), gradedItems: graded.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()) };
    }, [homework]);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Child's Homework</h1>
            {student && <p className="text-gray-600">Viewing assignments for: <span className="font-semibold">{student.name}</span></p>}

            {loading ? <p>Loading assignments...</p> : (
                <>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Active & Overdue Assignments</h2>
                        {activeItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeItems.map(hw => <ParentHomeworkCard key={hw.id} hw={hw} />)}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-white rounded-lg border">
                                <p className="text-gray-500">No active assignments. Great job!</p>
                            </div>
                        )}
                    </div>

                     <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Graded & Completed</h2>
                        {gradedItems.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {gradedItems.map(hw => <ParentHomeworkCard key={hw.id} hw={hw} />)}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-white rounded-lg border">
                                <p className="text-gray-500">No assignments have been graded yet.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ParentHomeworkPage;