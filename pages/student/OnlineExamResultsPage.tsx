import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as examService from '../../lib/examService';
// FIX: Changed import from `ExamQuestion` to `Question` to match the correct type definition.
import type { OnlineExam, Question, StudentExamSubmission } from '../../types';

const OnlineExamResultsPage: React.FC = () => {
    const { siteId, examId } = useParams<{ siteId: string; examId: string }>();
    const studentId = 's01'; // HACK

    const [exam, setExam] = useState<OnlineExam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [submission, setSubmission] = useState<StudentExamSubmission | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!examId || !studentId) return;
        setLoading(true);
        try {
            const [examData, submissionData] = await Promise.all([
                examService.getExamDetails(examId),
                examService.getStudentSubmission(examId, studentId)
            ]);

            if (!examData || !submissionData || submissionData.status !== 'Submitted') {
                throw new Error("Results not available.");
            }
            
            setExam(examData.exam);
            setQuestions(examData.questions);
            // The service returns a plain object for answers, we need to convert it back to a Map
            setSubmission({ ...submissionData, answers: new Map(Object.entries(submissionData.answers)) });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [examId, studentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="text-center p-8">Loading results...</div>;
    if (!exam || !submission) return <div className="text-center p-8">Results are not available for this exam.</div>;

    if (!exam.resultsPublishedAt) {
        return (
            <div className="space-y-6">
                <Link to={`/school/${siteId}/student/online-exams`} className="text-sm text-indigo-600 hover:text-indigo-800">&larr; Back to Exams List</Link>
                <h1 className="text-3xl font-bold text-gray-800">Results: {exam.title}</h1>
                <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Results Are Not Yet Published</h2>
                    <p className="mt-2 text-gray-500">Your teacher has not yet released the results for this exam. Please check back later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link to={`/school/${siteId}/student/online-exams`} className="text-sm text-indigo-600 hover:text-indigo-800">&larr; Back to Exams List</Link>
            <h1 className="text-3xl font-bold text-gray-800">Results: {exam.title}</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                <h2 className="text-lg font-semibold text-gray-700">Your Score</h2>
                <p className="text-6xl font-bold text-indigo-600 my-2">{submission.score ?? 0} / {exam.totalMarks}</p>
                <p className="text-sm text-gray-500">Submitted at: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Review Your Answers</h2>
                {questions.map((q, index) => {
                    const studentAnswerIndex = submission.answers.get(q.id);
                    const isCorrect = studentAnswerIndex === q.correctOptionIndex;

                    return (
                        <div key={q.id} className="bg-white p-4 rounded-lg shadow-sm border">
                             <p className="font-semibold">Question {index + 1}: {q.questionText}</p>
                             <div className="mt-2 space-y-2">
                                {q.options.map((option, i) => {
                                    const isStudentAnswer = i === studentAnswerIndex;
                                    const isCorrectAnswer = i === q.correctOptionIndex;
                                    
                                    let bgClass = 'border-gray-200';
                                    if(isStudentAnswer && !isCorrect) bgClass = 'bg-red-100 border-red-300';
                                    if(isCorrectAnswer) bgClass = 'bg-green-100 border-green-300';

                                    return (
                                        <div key={i} className={`p-2 border rounded-md text-sm ${bgClass}`}>
                                            {option}
                                            {isCorrectAnswer && <span className="font-bold text-green-700 ml-2">(Correct Answer)</span>}
                                            {isStudentAnswer && !isCorrect && <span className="font-bold text-red-700 ml-2">(Your Answer)</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OnlineExamResultsPage;
