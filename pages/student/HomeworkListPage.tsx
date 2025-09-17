
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { listSubjects } from '../../lib/academicsService';
import type { Subject, EnrichedHomeworkForStudent } from '../../types';

// FIX: Add 'Late' to the list of possible statuses.
type HomeworkStatus = 'Overdue' | 'Completed' | 'Submitted' | 'Not Submitted' | 'Due' | 'Late';

const getStatus = (hw: EnrichedHomeworkForStudent): { text: HomeworkStatus, className: string } => {
    const { submission, dueDate } = hw;
    if (submission?.feedback) {
        return { text: 'Completed', className: 'bg-green-100 text-green-800' };
    }
    if (submission) {
        // FIX: Explicitly handle 'Late' status and assign a consistent color.
        if (submission.status === 'Late') {
            return { text: 'Late', className: 'bg-yellow-100 text-yellow-800' };
        }
        return { text: 'Submitted', className: 'bg-blue-100 text-blue-800' };
    }
    if (new Date(dueDate) < new Date()) {
        return { text: 'Overdue', className: 'bg-red-100 text-red-800' };
    }
    return { text: 'Due', className: 'bg-gray-100 text-gray-800' };
};

const HomeworkCard: React.FC<{ homework: EnrichedHomeworkForStudent; subjectName?: string; }> = ({ homework, subjectName }) => {
    const { siteId } = useParams<{ siteId: string }>();
    const status = getStatus(homework);

    return (
        <Link to={`/school/${siteId}/student/homework/${homework.id}`} className="block bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500">{subjectName || 'General'}</p>
                    <h3 className="font-semibold text-lg text-gray-800">{homework.title}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.className}`}>{status.text}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Due: {homework.dueDate}</p>
        </Link>
    );
};

const StudentHomeworkListPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    // HACK: For demo, using a fixed student ID.
    const studentId = 's01';

    const [allHomework, setAllHomework] = useState<EnrichedHomeworkForStudent[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'overdue' | 'completed'>('active');

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        Promise.all([
            homeworkService.listHomeworkForStudent(studentId),
            listSubjects(),
        ]).then(([hwData, subjectData]) => {
            setAllHomework(hwData);
            setSubjects(subjectData);
        }).catch(() => {
            addToast('Failed to load homework.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    }, [studentId, addToast]);

    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const categorizedHomework = useMemo(() => {
        const active: EnrichedHomeworkForStudent[] = [];
        const overdue: EnrichedHomeworkForStudent[] = [];
        const completed: EnrichedHomeworkForStudent[] = [];

        allHomework.forEach(hw => {
            const isComplete = !!hw.submission?.feedback;
            const isOverdue = new Date(hw.dueDate) < new Date() && !hw.submission;

            if (isComplete) {
                completed.push(hw);
            } else if (isOverdue) {
                overdue.push(hw);
            } else {
                active.push(hw);
            }
        });
        return { active, overdue, completed };
    }, [allHomework]);

    if (loading) return <div className="text-center p-8">Loading homework...</div>;

    const currentList = categorizedHomework[activeTab];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Homework</h1>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {(['active', 'overdue', 'completed'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`capitalize whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab} ({categorizedHomework[tab].length})
                        </button>
                    ))}
                </nav>
            </div>
            
            {currentList.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {currentList.map(hw => (
                        <HomeworkCard key={hw.id} homework={hw} subjectName={subjectMap.get(hw.subjectId)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800">
                        {activeTab === 'completed' ? "No completed work yet." : "You're all caught up!"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">There are no assignments in this category.</p>
                </div>
            )}
        </div>
    );
};

export default StudentHomeworkListPage;
