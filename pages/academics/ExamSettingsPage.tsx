import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as examService from '../../lib/examService';
import type { OnlineExam, OnlineExamConfig } from '../../types';

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ label, enabled, onChange, disabled }) => (
    <div className="flex items-center justify-between">
        <label className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</label>
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            disabled={disabled}
            className={`${enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed`}
            role="switch"
            aria-checked={enabled}
        >
            <span className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
        </button>
    </div>
);

const ExamSettingsPage: React.FC = () => {
    const { siteId, examId } = useParams<{ siteId: string; examId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [exam, setExam] = useState<OnlineExam | null>(null);
    const [settings, setSettings] = useState<Partial<OnlineExamConfig>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(() => {
        if (!examId) return;
        setLoading(true);
        examService.getExamDetails(examId)
            .then(data => {
                if (data) {
                    setExam(data.exam);
                    setSettings(data.exam.config || { lockdownMode: false, questionIds: [] });
                } else {
                    addToast('Exam not found.', 'error');
                }
            })
            .finally(() => setLoading(false));
    }, [examId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSettingsChange = (update: Partial<OnlineExamConfig>) => {
        setSettings(prev => ({ ...prev, ...update }));
    };
    
    const handleSave = async () => {
        if (!examId || !settings || !user) return;
        setIsSaving(true);
        try {
            const configToSave = { ...exam?.config, ...settings };
            await examService.updateExam(examId, { config: configToSave }, user);
            addToast('Exam settings saved successfully!', 'success');
            fetchData(); // Refresh data
        } catch {
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishResults = async () => {
        if (!examId || !user || exam?.resultsPublishedAt) return;
        setIsSaving(true);
        try {
            await examService.publishExamResults(examId, user);
            addToast('Exam results have been published!', 'success');
            fetchData();
        } catch {
            addToast('Failed to publish results.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) return <div>Loading settings...</div>;
    if (!exam) return <div>Exam not found.</div>;

    return (
        <div className="space-y-6">
            <Link to={`/school/${siteId}/online-exams`} className="text-sm text-indigo-600">&larr; Back to Exams List</Link>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Exam Settings</h1>
                <p className="text-gray-500">{exam.title}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <SettingsCard title="General Settings">
                        <Toggle 
                            label="Enable Lockdown Mode"
                            enabled={settings.lockdownMode ?? false}
                            onChange={val => handleSettingsChange({ lockdownMode: val })}
                        />
                        <p className="text-xs text-gray-500">When enabled, students will be forced to submit their exam if they switch tabs.</p>
                        
                        <div className="pt-4 border-t">
                            <label className="text-sm font-medium">Time Limit Per Question (seconds)</label>
                            <input 
                                type="number"
                                value={settings.timePerQuestionSec || ''}
                                onChange={e => handleSettingsChange({ timePerQuestionSec: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full mt-1 rounded-md"
                                placeholder="Leave blank to use main exam timer"
                            />
                            <p className="text-xs text-gray-500 mt-1">Note: Student-side timer for this feature is not yet implemented.</p>
                        </div>
                    </SettingsCard>
                     <div className="flex justify-end">
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving} 
                            className="w-full px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
                <div className="space-y-6">
                     <SettingsCard title="Results Publication">
                        {exam.resultsPublishedAt ? (
                            <p className="text-sm text-green-600">
                                Results were published on {new Date(exam.resultsPublishedAt).toLocaleString()}.
                            </p>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500">
                                    Results are currently hidden from students. Once published, students will be able to see their scores and review their answers. This action cannot be undone.
                                </p>
                                <button
                                    onClick={handlePublishResults}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {isSaving ? 'Publishing...' : 'Publish Results Now'}
                                </button>
                            </>
                        )}
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};

export default ExamSettingsPage;