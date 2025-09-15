import React, { useState } from 'react';
import type { QuizQuestion, CatchupPolicy, QuizAnswer } from '../../types';
import Modal from '../ui/Modal';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: { questions: QuizQuestion[] };
  policy: CatchupPolicy;
  onSubmit: (answers: QuizAnswer[]) => Promise<{ scorePct: number; passed: boolean }>;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, quiz, policy, onSubmit }) => {
    const [answers, setAnswers] = useState<Map<string, number[]>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ scorePct: number; passed: boolean } | null>(null);

    const handleAnswerChange = (questionId: string, choiceIndex: number) => {
        setAnswers(prev => {
            const newAnswers = new Map(prev);
            // For single choice questions, replace the answer
            newAnswers.set(questionId, [choiceIndex]);
            return newAnswers;
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const submission: QuizAnswer[] = Array.from(answers.entries()).map(([questionId, selected]) => ({
            questionId,
            selected,
        }));
        const quizResult = await onSubmit(submission);
        setResult(quizResult);
        setIsSubmitting(false);
    };
    
    const handleRetry = () => {
        setResult(null);
        setAnswers(new Map());
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Catch-Up Quiz">
            {result ? (
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold">Quiz Result</h3>
                    <p className={`text-4xl my-4 font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {result.scorePct.toFixed(0)}%
                    </p>
                    {result.passed ? (
                        <p className="text-green-700">Congratulations! You passed.</p>
                    ) : (
                        <p className="text-red-700">You did not meet the required score of {policy.minimumQuizScorePct}%. Please try again.</p>
                    )}
                    <div className="mt-6 flex justify-center gap-4">
                        {!result.passed && <button onClick={handleRetry} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Retry Quiz</button>}
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                    </div>
                </div>
            ) : (
                <div className="p-6 space-y-6">
                    {quiz.questions.map((q, index) => (
                        <div key={q.id}>
                            <p className="font-semibold">{index + 1}. {q.prompt}</p>
                            <div className="mt-2 space-y-2">
                                {q.choices.map((choice, choiceIndex) => (
                                    <label key={choiceIndex} className="flex items-center p-2 border rounded-md has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400">
                                        <input 
                                            type="radio" 
                                            name={q.id}
                                            checked={answers.get(q.id)?.[0] === choiceIndex}
                                            onChange={() => handleAnswerChange(q.id, choiceIndex)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300"
                                        />
                                        <span className="ml-3 text-sm">{choice}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="bg-gray-50 -m-6 mt-6 px-6 py-3 flex justify-end">
                        <button onClick={handleSubmit} disabled={isSubmitting || answers.size !== quiz.questions.length} className="px-6 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default QuizModal;
