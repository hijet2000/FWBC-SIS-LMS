import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { getStudents, getClasses } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
import { exportToCsv } from '../../lib/exporters';
import type { Homework, Submission, Feedback, Student, SchoolClass, Subject } from '../../types';

type SubmissionWithFeedback = Submission & { feedback?: Feedback };
type ReportRow = {
    homework: Homework;
    student: Student;
    submission: Partial<SubmissionWithFeedback>;
};

const KpiCard: React.FC<{ title: string; value: string; description: string }> = ({ title, value, description }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-800">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
);

const ReportTable: React.FC<{ title: string; headers: string[]; data: (string | number)[][] }> = ({ title, headers, data }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b">
                    {headers.map((h, i) => <th key={i} className={`p-2 font-medium text-gray-600 ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                        {row.map((cell, j) => <td key={j} className={`p-2 ${j === 0 ? 'text-left' : 'text-right'}`}>{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const HomeworkReportsPage: React.FC = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<ReportRow[]>([]);
    const [meta, setMeta] = useState<{ students: Student[], classes: SchoolClass[], subjects: Subject[], homework: Homework[] }>({ students: [], classes: [], subjects: [], homework: [] });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [hwData, subData, studentData, classData, subjectData] = await Promise.all([
                    homeworkService.listHomework(),
                    homeworkService.listAllSubmissionsWithFeedback(),
                    getStudents({ limit: 1000 }),
                    getClasses(),
                    listSubjects(),
                ]);

                setMeta({ homework: hwData, students: studentData.students, classes: classData, subjects: subjectData });

                const submissionMap = new Map<string, SubmissionWithFeedback>();
                subData.forEach(s => submissionMap.set(`${s.homeworkId}-${s.studentId}`, s));

                const studentsByClass = new Map<string, Student[]>();
                classData.forEach(c => {
                    studentsByClass.set(c.id, studentData.students.filter(s => s.classId === c.id));
                });

                const builtReportData: ReportRow[] = [];
                hwData.forEach(hw => {
                    const classRoster = studentsByClass.get(hw.classId) || [];
                    classRoster.forEach(student => {
                        const submission = submissionMap.get(`${hw.id}-${student.id}`);
                        builtReportData.push({
                            homework: hw,
                            student: student,
                            submission: submission || { status: 'Not Submitted' },
                        });
                    });
                });
                setReportData(builtReportData);

            } catch {
                addToast('Failed to load report data.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [addToast]);

    const kpis = useMemo(() => {
        const totalPossible = reportData.length;
        if (totalPossible === 0) return { subRate: '0%', onTimeRate: '0%', avgScore: 'N/A' };
        
        const submitted = reportData.filter(r => r.submission.status !== 'Not Submitted');
        const onTime = submitted.filter(r => r.submission.status === 'On-time');
        const graded = submitted.filter(r => r.submission.feedback?.score != null);
        const totalScore = graded.reduce((sum, r) => sum + (r.submission.feedback?.score || 0), 0);
        
        return {
            subRate: ((submitted.length / totalPossible) * 100).toFixed(1) + '%',
            onTimeRate: submitted.length > 0 ? ((onTime.length / submitted.length) * 100).toFixed(1) + '%' : '0%',
            avgScore: graded.length > 0 ? (totalScore / graded.length).toFixed(1) : 'N/A',
        };
    }, [reportData]);
    
    const analysisData = useMemo(() => {
        const statusCounts = { 'On-time': 0, 'Late': 0, 'Not Submitted': 0 };
        const scoreBySubject: Record<string, { total: number, count: number }> = {};
        const scoreByClass: Record<string, { total: number, count: number }> = {};
        
        reportData.forEach(row => {
            statusCounts[row.submission.status || 'Not Submitted']++;
            if (row.submission.feedback?.score != null) {
                const { subjectId, classId } = row.homework;
                const score = row.submission.feedback.score;
                
                if (!scoreBySubject[subjectId]) scoreBySubject[subjectId] = { total: 0, count: 0 };
                scoreBySubject[subjectId].total += score;
                scoreBySubject[subjectId].count++;
                
                if (!scoreByClass[classId]) scoreByClass[classId] = { total: 0, count: 0 };
                scoreByClass[classId].total += score;
                scoreByClass[classId].count++;
            }
        });
        
        const subjectMap = new Map(meta.subjects.map(s => [s.id, s.name]));
        const avgBySubject = Object.entries(scoreBySubject).map(([id, data]) => ([
            subjectMap.get(id) || 'Unknown',
            data.count,
            (data.total / data.count).toFixed(1)
        ]));
        
        const classMap = new Map(meta.classes.map(c => [c.id, c.name]));
        const avgByClass = Object.entries(scoreByClass).map(([id, data]) => ([
            classMap.get(id) || 'Unknown',
            data.count,
            (data.total / data.count).toFixed(1)
        ]));

        return { statusCounts, avgBySubject, avgByClass };
    }, [reportData, meta]);

    const handleExport = () => {
        const subjectMap = new Map(meta.subjects.map(s => [s.id, s.name]));
        const classMap = new Map(meta.classes.map(c => [c.id, c.name]));

        const dataForCsv = reportData.map(row => ({
            studentName: row.student.name,
            className: classMap.get(row.homework.classId),
            subjectName: subjectMap.get(row.homework.subjectId),
            homeworkTitle: row.homework.title,
            dueDate: row.homework.dueDate,
            status: row.submission.status,
            submittedAt: row.submission.submittedAt ? new Date(row.submission.submittedAt).toLocaleString() : '',
            score: row.submission.feedback?.score ?? '',
            comments: row.submission.feedback?.comments ?? '',
        }));
        
        exportToCsv('homework_submissions.csv', [
            { key: 'studentName', label: 'Student' },
            { key: 'className', label: 'Class' },
            { key: 'subjectName', label: 'Subject' },
            { key: 'homeworkTitle', label: 'Homework' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'status', label: 'Status' },
            { key: 'submittedAt', label: 'Submitted At' },
            { key: 'score', label: 'Score' },
            { key: 'comments', label: 'Comments' },
        ], dataForCsv);
    };

    if (loading) return <div className="p-8 text-center">Loading reports...</div>;

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Homework Reports</h1>
                <button onClick={handleExport} className="px-4 py-2 bg-white border rounded-md shadow-sm">Export All Submissions (CSV)</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Submission Rate" value={kpis.subRate} description="Percentage of assigned work submitted" />
                <KpiCard title="On-Time Rate" value={kpis.onTimeRate} description="Of those submitted" />
                <KpiCard title="Average Score" value={kpis.avgScore} description="Across all graded assignments" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ReportTable
                    title="Submission Status"
                    headers={['Status', 'Count']}
                    data={Object.entries(analysisData.statusCounts)}
                />
                 <ReportTable
                    title="Average Score by Subject"
                    headers={['Subject', '# Graded', 'Avg. Score']}
                    data={analysisData.avgBySubject}
                />
                 <ReportTable
                    title="Average Score by Class"
                    headers={['Class', '# Graded', 'Avg. Score']}
                    data={analysisData.avgByClass}
                />
            </div>
        </div>
    );
};

export default HomeworkReportsPage;