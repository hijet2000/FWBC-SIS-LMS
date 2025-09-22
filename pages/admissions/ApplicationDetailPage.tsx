import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as admissionsService from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import { listTeachers } from '../../lib/academicsService';
import type { Application, SchoolClass, Teacher, ApplicationStatus } from '../../types';

const DetailCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const ApplicationDetailPage: React.FC = () => {
    const { applicationId } = useParams<{ applicationId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [app, setApp] = useState<Application | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [seatAvailable, setSeatAvailable] = useState(true);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!applicationId) return;
        setLoading(true);
        try {
            const [appData, classData, teacherData] = await Promise.all([
                admissionsService.getApplication(applicationId),
                getClasses(),
                listTeachers(),
            ]);
            setApp(appData);
            setClasses(classData);
            setTeachers(teacherData);
            if (appData) {
                const availability = await admissionsService.checkSeatAvailability(appData.desiredClassId);
                setSeatAvailable(availability.available);
            }
        } catch {
            addToast('Failed to load application details.', 'error');
        } finally {
            setLoading(false);
        }
    }, [applicationId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = async (update: Partial<Application>, notificationMessage?: string) => {
        if (!app || !user) return;
        const originalApp = { ...app };
        // Optimistic UI update
        setApp(prev => prev ? { ...prev, ...update } : null);

        try {
            const updatedApp = await admissionsService.updateApplication(app.id, update, user);
            setApp(updatedApp); // Set the confirmed state from the server
            addToast('Application updated.', 'success');
            if (notificationMessage) {
                // In a real app, this would be a more sophisticated notification system
                addToast(`Mock parent notification for '${notificationMessage}' sent.`, 'info');
            }
        } catch (err: any) {
            addToast(err.message || 'Update failed.', 'error');
            setApp(originalApp); // Revert on error
        }
    };
    
    const handleApprove = async () => {
        if (!app || !user || app.status !== 'Accepted') return;
        try {
            const { admissionNo } = await admissionsService.approveApplication(app.id, user);
            addToast(`Student created! Admission No: ${admissionNo}`, 'success');
            fetchData(); // Refresh all data
        } catch (err: any) {
            addToast(err.message || 'Failed to approve application and create student.', 'error');
        }
    };
    
    const handleCompleteScreening = () => {
        if (!app) return;
        const allPassedChecklist = {
            ageEligibility: true,
            prerequisitesMet: true,
            catchmentArea: true,
        };
        handleUpdate(
            { 
                screeningChecklist: allPassedChecklist,
                status: 'Interview' 
            },
            'Screening Complete'
        );
    };

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    if (loading) return <div>Loading application...</div>;
    if (!app) return <div>Application not found.</div>;

    const isStudentCreated = app.status === 'Approved';

    return (
        <div className="space-y-6">
            <Link to="/school/site_123/admissions/applications" className="text-sm text-indigo-600">&larr; Back to Applications</Link>
            <h1 className="text-3xl font-bold text-gray-800">{app.applicantDetails.fullName}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <DetailCard title="Screening Checklist">
                        {Object.entries(app.screeningChecklist).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                                <input type="checkbox" id={key} checked={value} onChange={e => handleUpdate({ screeningChecklist: { ...app.screeningChecklist, [key]: e.target.checked } })} />
                                <label htmlFor={key} className="ml-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                            </div>
                        ))}
                         <div className="pt-4 border-t mt-4">
                            <button
                                onClick={handleCompleteScreening}
                                disabled={app.status !== 'Screening' && app.status !== 'New'}
                                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Mark All Passed & Move to Interview
                            </button>
                        </div>
                    </DetailCard>
                    <DetailCard title="Documents">
                        {app.documents.map((doc, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span>{doc.fileName} ({doc.type})</span>
                                <button onClick={() => {
                                    const newDocs = [...app.documents];
                                    newDocs[i].verified = !newDocs[i].verified;
                                    handleUpdate({ documents: newDocs }, newDocs[i].verified ? 'Document Verified' : 'Document Un-verified');
                                }} className={`px-2 py-1 text-xs rounded ${doc.verified ? 'bg-green-200 text-green-800' : 'bg-gray-200'}`}>
                                    {doc.verified ? 'Verified ✓' : 'Verify'}
                                </button>
                            </div>
                        ))}
                    </DetailCard>
                     <DetailCard title="Interview">
                        <input type="datetime-local" value={app.interviewDetails.scheduledAt?.substring(0,16) || ''} onChange={e => handleUpdate({ interviewDetails: {...app.interviewDetails, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined}}, 'Interview Scheduled')} className="w-full rounded-md border-gray-300" />
                        <select value={app.interviewDetails.interviewerId || ''} onChange={e => handleUpdate({ interviewDetails: {...app.interviewDetails, interviewerId: e.target.value}})} className="w-full rounded-md border-gray-300">
                            <option value="">Select Interviewer</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <textarea value={app.interviewDetails.notes || ''} onChange={e => handleUpdate({ interviewDetails: {...app.interviewDetails, notes: e.target.value}})} placeholder="Interview Notes..." className="w-full rounded-md border-gray-300" rows={3}/>
                    </DetailCard>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <DetailCard title="Decision Panel">
                         <select value={app.status} onChange={e => handleUpdate({ status: e.target.value as ApplicationStatus }, `Status Changed to ${e.target.value}`)} className="w-full rounded-md border-gray-300">
                            {['New', 'Screening', 'DocsMissing', 'Interview', 'Offer', 'Accepted', 'Approved', 'Rejected', 'Waitlist', 'Withdrawn'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {app.status === 'Offer' && <input type="date" value={app.decisionDetails.offerExpiresAt || ''} onChange={e => handleUpdate({ decisionDetails: {...app.decisionDetails, offerExpiresAt: e.target.value}})} placeholder="Offer Expiry Date" className="w-full rounded-md border-gray-300" />}
                        {app.status === 'Rejected' && <input value={app.decisionDetails.rejectionReason || ''} onChange={e => handleUpdate({ decisionDetails: {...app.decisionDetails, rejectionReason: e.target.value}})} placeholder="Rejection Reason" className="w-full rounded-md border-gray-300" />}
                        
                        <button disabled={!seatAvailable || app.status !== 'Interview'} onClick={() => handleUpdate({status: 'Offer'}, 'Offer Made')} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                            {seatAvailable ? 'Make Offer' : 'Class Full'}
                        </button>
                        
                        {app.status === 'Accepted' && (
                             <button onClick={handleApprove} disabled={isStudentCreated} className="w-full px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">
                                {isStudentCreated ? 'Student Created' : 'Approve & Create Student'}
                            </button>
                        )}
                    </DetailCard>
                </div>
            </div>
        </div>
    );
};

export default ApplicationDetailPage;