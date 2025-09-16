import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { getStudent } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
// FIX: Import Feedback type to create a combined type for submissions with feedback.
import type { Homework, Submission, Feedback, Subject, Student } from '../../types';

interface HomeworkCardProps {
    homework: Homework;
    // FIX: Update submission type to include optional feedback property.
    submission?: Submission & { feedback?: Feedback };
    subjectName?: string;
}

const HomeworkCard: React.FC<HomeworkCardProps> = ({ homework, submission, subjectName }) => {
    const { siteId } = useParams<{ siteId: string }>();
    const status = submission?.status || 'Not Submitted';
    // FIX: Property 'feedback' now exists on the updated submission type.
    const isCompleted = !!submission?.feedback;

    let statusText = 'Due';
    let statusColor = 'text-gray-500';
    if (new Date(homework.dueDate) < new Date() && status === 'Not Submitted') {
        statusText = 'Overdue';
        statusColor = 'text-red-500';
    } else if (isCompleted) {
        statusText = 'Completed';
        statusColor = 'text-green-600';
    }

    return (
        <Link to={`/school/${siteId}/student/homework/${homework.id}`} className="block bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500">{subjectName}</p>
                    <h3 className="font-semibold text-lg text-gray-800">{homework.title}</h3>
                </div>
                <span className={`text-sm font-bold ${statusColor}`}>{statusText}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Due: {homework.dueDate}</p>
        </Link>
    );
};

const StudentHomeworkListPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    // HACK: For demo, using a fixed student ID. In a real app, this would come from the user object.
    const studentId = 's01';

    const [homework, setHomework] = useState<Homework[]>([]);
    // FIX: Update state to hold submissions that may include feedback.
    const [submissions, setSubmissions] = useState<Map<string, Submission & { feedback?: Feedback }>>(new Map());
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        Promise.all([
            getStudent(studentId),
            listSubjects(),
        ]).then(async ([studentData, subjectData]) => {
            setStudent(studentData);
            setSubjects(subjectData);
            if (studentData) {
                const hwData = await homeworkService.listHomework({ classId: studentData.classId });
                setHomework(hwData);
                // FIX: Use combined type for the map to correctly store submissions with feedback.
                const subMap = new Map<string, Submission & { feedback?: Feedback }>();
                for (const hw of hwData) {
                    const sub = await homeworkService.getSubmissionForStudent(hw.id, studentId);
                    if (sub) {
                        subMap.set(hw.id, sub);
                    }
                }
                setSubmissions(subMap);
            }
        }).catch(() => {
            addToast('Failed to load homework.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    }, [studentId, addToast]);

    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const categorizedHomework = useMemo(() => {
        const active: Homework[] = [];
        const overdue: Homework[] = [];
        const completed: Homework[] = [];

        homework.forEach(hw => {
            const submission = submissions.get(hw.id);
            // FIX: Property 'feedback' now exists on the updated submission type.
            const isComplete = submission?.status !== 'Not Submitted' && !!submission?.feedback;
            const isOverdue = new Date(hw.dueDate) < new Date() && (!submission || submission?.status === 'Not Submitted');

            if (isComplete) {
                completed.push(hw);
            } else if (isOverdue) {
                overdue.push(hw);
            } else {
                active.push(hw);
            }
        });
        return { active, overdue, completed };
    }, [homework, submissions]);

    if (loading) return <div className="text-center p-8">Loading homework...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">My Homework</h1>

            {categorizedHomework.overdue.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-red-600 mb-4">Overdue</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categorizedHomework.overdue.map(hw => (
                            <HomeworkCard key={hw.id} homework={hw} submission={submissions.get(hw.id)} subjectName={subjectMap.get(hw.subjectId)} />
                        ))}
                    </div>
                </div>
            )}
            
            <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Active</h2>
                 {categorizedHomework.active.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categorizedHomework.active.map(hw => (
                            <HomeworkCard key={hw.id} homework={hw} submission={submissions.get(hw.id)} subjectName={subjectMap.get(hw.subjectId)} />
                        ))}
                    </div>
                 ) : (
                    <p className="text-gray-500">No active homework. Great job!</p>
                 )}
            </div>

             <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Completed</h2>
                {categorizedHomework.completed.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categorizedHomework.completed.map(hw => (
                            <HomeworkCard key={hw.id} homework={hw} submission={submissions.get(hw.id)} subjectName={subjectMap.get(hw.subjectId)} />
                        ))}
                    </div>
                 ) : (
                    <p className="text-gray-500">No completed homework yet.</p>
                 )}
            </div>
        </div>
    );
};

export default StudentHomeworkListPage;