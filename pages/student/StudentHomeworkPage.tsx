import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import type { Homework, Submission, Feedback } from '../../types';

type HomeworkWithSubmission = Homework & { submission?: Submission & { feedback?: Feedback } };

const HomeworkCard: React.FC<{ hw: HomeworkWithSubmission }> = ({ hw }) => {
    const { siteId } = useParams<{ siteId: string }>();
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
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status.className}`}>{status.text}</span>
                    <span className="text-xs text-gray-400">Due: {hw.dueDate}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mt-2">{hw.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{hw.instructions}</p>
            </div>
            <Link to={`/school/${siteId}/student/homework/${hw.id}`} className="mt-4 w-full text-center inline-block px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100">
                {hw.submission ? 'View Submission' : 'View Assignment'}
            </Link>
        </div>
    );
};

const StudentHomeworkPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    // HACK: Hardcoding studentId and classId for demo purposes.
    const studentId = 's01';
    const classId = 'c1';

    const [homework, setHomework] = useState<HomeworkWithSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId || !classId) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                const [hwData, subData] = await Promise.all([
                    homeworkService.listHomework({ classId }),
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
    }, [studentId, classId, addToast]);

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
        return { activeItems: active, gradedItems: graded };
    }, [homework]);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Homework</h1>

            {loading ? <p>Loading assignments...</p> : (
                <>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Active & Overdue</h2>
                        {activeItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeItems.map(hw => <HomeworkCard key={hw.id} hw={hw} />)}
                            </div>
                        ) : (
                            <p className="text-gray-500">No active assignments. Great job!</p>
                        )}
                    </div>

                     <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Graded</h2>
                        {gradedItems.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {gradedItems.map(hw => <HomeworkCard key={hw.id} hw={hw} />)}
                            </div>
                        ) : (
                            <p className="text-gray-500">No assignments have been graded yet.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentHomeworkPage;