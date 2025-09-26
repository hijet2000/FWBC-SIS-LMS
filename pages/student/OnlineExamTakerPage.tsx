import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import * as examService from '../../lib/examService';
// FIX: Changed import from `ExamQuestion` to `Question` to match the correct type definition.
import type { OnlineExam, Question, StudentExamSubmission } from '../../types';
import Modal from '../../components/ui/Modal';

const useCountdown = (durationMinutes: number, onTimeUp: () => void) => {
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                    onTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [durationMinutes, onTimeUp]);
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const OnlineExamTakerPage: React.FC = () => {
    const { siteId, examId } = useParams<{ siteId: string, examId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const studentId = 's01'; // HACK

    const [exam, setExam] = useState<OnlineExam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [submission, setSubmission] = useState<StudentExamSubmission | null>(null);
    const [answers, setAnswers] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const submittedRef = useRef(false);

    const handleSubmit = useCallback(async () => {
        if (!submission || submittedRef.current) return;
        
        submittedRef.current = true;
        setIsSubmitting(true);
        try {
            await examService.submitExam(submission.id, answers);
            navigate(`/school/${siteId}/student/online-exams/${examId}/results`);
        } catch (error) {
            console.error("Failed to submit", error);
            // Handle error, maybe allow retry
        } finally {
            setIsSubmitting(false);
        }
    }, [submission, answers, navigate, siteId, examId]);

    const timeLeft = useCountdown(exam?.durationMinutes || 0, handleSubmit);

    useEffect(() => {
        if (!examId || !studentId) {
            navigate(`/school/${siteId}`);
            return;
        }

        const initializeExam = async () => {
            try {
                const sub = await examService.startExam(examId, studentId);
                if (sub.status === 'Submitted') {
                    // Already taken, redirect to results
                    navigate(`/school/${siteId}/student/online-exams/${examId}/results`);
                    return;
                }
                setSubmission(sub);
                
                const examData = await examService.getExamDetails(examId);
                if (!examData) throw new Error("Exam not found");

                setExam(examData.exam);
                // FIX: Changed `enabledQuestionIds` to `questionIds` to match the `OnlineExamConfig` type.
                setQuestions(examData.exam.config?.questionIds 
                    ? examData.questions.filter(q => examData.exam.config!.questionIds!.includes(q.id))
                    : examData.questions
                );
            } catch (error) {
                console.error("Failed to start exam", error);
                navigate(`/school/${siteId}/student/online-exams`);
            } finally {
                setLoading(false);
            }
        };
        initializeExam();

    }, [examId, studentId, navigate, siteId]);
    
    // Effect for Lockdown Mode
    useEffect(() => {
        if (exam?.config?.lockdownMode) {
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    // Instantly submit. A real app might show a warning first.
                    handleSubmit();
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
    
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, [exam, handleSubmit]);

    const handleAnswerChange = (questionId: string, optionIndex: number) => {
        setAnswers(prev => new Map(prev).set(questionId, optionIndex));
    };

    if (loading) {
        return <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">Loading exam...</div>;
    }

    if (!exam) {
        return <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">Exam could not be loaded.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold">{exam.title}</h1>
                    <div className="text-2xl font-mono bg-red-600 text-white px-4 py-1 rounded-md">{timeLeft}</div>
                </div>
            </header>
            
            <main className="max-w-4xl mx-auto p-4 md:p-8">
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h2 className="font-semibold text-lg border-b pb-2 mb-4">Instructions</h2>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{exam.instructions}</p>
                    {exam.config?.lockdownMode && <p className="text-sm text-red-600 font-bold mt-2">This exam is in lockdown mode. Switching tabs will automatically submit your attempt.</p>}
                </div>
                
                <form className="mt-6 space-y-6">
                    {questions.map((q, index) => (
                        <div key={q.id} className="bg-white p-6 rounded-lg shadow-md border">
                            <p className="font-semibold">Question {index + 1} <span className="font-normal text-sm text-gray-500">({q.marks} marks)</span></p>
                            <p className="mt-2">{q.questionText}</p>
                            <div className="mt-4 space-y-2">
                                {q.options.map((option, i) => (
                                    <label key={i} className="flex items-center p-3 border rounded-md has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            checked={answers.get(q.id) === i}
                                            onChange={() => handleAnswerChange(q.id, i)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300"
                                        />
                                        <span className="ml-3 text-sm">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </form>

                 <div className="mt-8 flex justify-end">
                    <button onClick={() => setIsConfirmModalOpen(true)} disabled={isSubmitting} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400">
                        {isSubmitting ? 'Submitting...' : 'Finish & Submit Exam'}
                    </button>
                </div>
            </main>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Submission">
                <div className="p-6">
                    <p>Are you sure you want to submit your exam? You cannot change your answers after submission.</p>
                     <p className="mt-2 text-sm">Answered: {answers.size}/{questions.length}</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 text-white bg-green-600 rounded-md">Confirm Submit</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OnlineExamTakerPage;
