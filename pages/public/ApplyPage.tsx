import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as admissionsService from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { ApplicantDetails, GuardianDetails, ApplicationDocument, SchoolClass } from '../../types';

const steps = ['Applicant', 'Guardian', 'Documents', 'Review'];

const ApplyPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [currentStep, setCurrentStep] = useState(0);
    const [classes, setClasses] = useState<SchoolClass[]>([]);

    const [applicantDetails, setApplicantDetails] = useState<ApplicantDetails>({ fullName: '', dob: '', gender: 'Male', nationality: '', priorSchool: '' });
    const [guardians, setGuardians] = useState<GuardianDetails[]>([{ name: '', relationship: 'Father', phone: '', email: '', address: '' }]);
    const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
    const [desiredClassId, setDesiredClassId] = useState('');
    const [intakeSession, setIntakeSession] = useState('2025-2026');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successRef, setSuccessRef] = useState<string | null>(null);

    useEffect(() => {
        getClasses().then(setClasses);
    }, []);

    const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setApplicantDetails({ ...applicantDetails, [e.target.name]: e.target.value });
    };

    const handleGuardianChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const newGuardians = [...guardians];
        newGuardians[index] = { ...newGuardians[index], [e.target.name]: e.target.value };
        setGuardians(newGuardians);
    };

    const handleNext = () => {
        // Add validation logic per step if needed
        setCurrentStep(s => s + 1);
    };

    const handleSubmit = async () => {
        setError('');
        if (!desiredClassId) {
            setError('Please select a target class on the review step.');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await admissionsService.submitPublicApplication({ applicantDetails, guardians, documents, desiredClassId, intakeSession });
            if (result.duplicate) {
                 setError('Warning: An application with similar details already exists. If this is a mistake, please contact admissions.');
            }
            setSuccessRef(result.application.id);
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successRef) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                    <h1 className="text-2xl font-bold text-green-600">Application Submitted!</h1>
                    <p className="mt-4 text-gray-600">Your application has been received. Your reference number is:</p>
                    <p className="mt-2 text-lg font-mono bg-gray-100 p-2 rounded-md">{successRef}</p>
                    <p className="mt-4 text-sm text-gray-500">We will be in touch with the next steps shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-2">FWBC Online Application</h1>
                <p className="text-center text-sm text-gray-500 mb-6">Step {currentStep + 1} of {steps.length}: {steps[currentStep]}</p>
                
                {/* Stepper Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <div className="flex justify-between">
                        {steps.map((step, index) => (
                            <div key={step} className={`flex-1 text-center py-2 text-sm font-medium border-b-4 ${currentStep >= index ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
                                {step}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Applicant Details */}
                {currentStep === 0 && <div className="space-y-4 animate-fade-in">
                    <h3 className="font-semibold text-lg">Applicant Details</h3>
                    <input name="fullName" value={applicantDetails.fullName} onChange={handleApplicantChange} placeholder="Full Name" className="w-full rounded-md" required />
                    <input name="dob" type="date" value={applicantDetails.dob} onChange={handleApplicantChange} className="w-full rounded-md" required />
                    <select name="gender" value={applicantDetails.gender} onChange={handleApplicantChange} className="w-full rounded-md"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                    <input name="nationality" value={applicantDetails.nationality} onChange={handleApplicantChange} placeholder="Nationality" className="w-full rounded-md" />
                    <input name="priorSchool" value={applicantDetails.priorSchool} onChange={handleApplicantChange} placeholder="Previous School (if any)" className="w-full rounded-md" />
                </div>}

                {/* Guardian Details */}
                {currentStep === 1 && <div className="space-y-4 animate-fade-in">
                    <h3 className="font-semibold text-lg">Guardian Information</h3>
                    <input name="name" value={guardians[0].name} onChange={e => handleGuardianChange(0, e)} placeholder="Guardian Name" className="w-full rounded-md" required />
                    <input name="email" type="email" value={guardians[0].email} onChange={e => handleGuardianChange(0, e)} placeholder="Guardian Email" className="w-full rounded-md" required />
                    <input name="phone" type="tel" value={guardians[0].phone} onChange={e => handleGuardianChange(0, e)} placeholder="Guardian Phone" className="w-full rounded-md" required />
                    <textarea name="address" value={guardians[0].address} onChange={e => handleGuardianChange(0, e)} placeholder="Full Address" className="w-full rounded-md" rows={3} />
                </div>}
                
                {/* Documents */}
                {currentStep === 2 && <div className="space-y-4 text-center p-8 border-dashed border-2 rounded-lg animate-fade-in">
                    <h3 className="font-semibold text-lg">Upload Documents</h3>
                    <p className="text-gray-500">Document upload is a placeholder for this demo.</p>
                    <div className="space-x-2">
                        <button type="button" onClick={() => setDocuments([...documents, { type: 'BirthCertificate', fileName: 'mock_bc.pdf', url: '#', verified: false }])} className="text-sm p-2 bg-gray-100 rounded-md">Mock Upload Birth Certificate</button>
                        <button type="button" onClick={() => setDocuments([...documents, { type: 'Photo', fileName: 'photo.jpg', url: '#', verified: false }])} className="text-sm p-2 bg-gray-100 rounded-md">Mock Upload Photo</button>
                    </div>
                     {documents.length > 0 && <ul className="text-left list-disc list-inside mt-4">
                        {documents.map((doc, i) => <li key={i}>{doc.fileName}</li>)}
                     </ul>}
                </div>}

                {/* Review */}
                {currentStep === 3 && <div className="space-y-4 text-sm animate-fade-in">
                    <h3 className="font-bold text-lg">Review Your Application</h3>
                    <div className="p-4 bg-gray-50 rounded-md border space-y-2">
                        <p><strong>Applicant:</strong> {applicantDetails.fullName}, {applicantDetails.dob}</p>
                        <p><strong>Guardian:</strong> {guardians[0].name}, {guardians[0].email}</p>
                        <p><strong>Documents:</strong> {documents.length} file(s) uploaded</p>
                    </div>
                     <select value={desiredClassId} onChange={e => setDesiredClassId(e.target.value)} className="w-full mt-4 rounded-md" required>
                        <option value="">-- Select Target Class --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>}

                {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

                <div className="mt-8 flex justify-between">
                    <button onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50">Back</button>
                    {currentStep < steps.length - 1 ? (
                        <button onClick={handleNext} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Next</button>
                    ) : (
                        <button onClick={handleSubmit} disabled={isSubmitting || !desiredClassId} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplyPage;