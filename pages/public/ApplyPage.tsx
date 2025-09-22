import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as admissionsService from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import { useToast } from '../../contexts/ToastContext';
import type { ApplicantDetails, GuardianDetails, ApplicationDocument, SchoolClass } from '../../types';

const steps = ['Applicant', 'Guardian', 'Documents', 'Review'];

const ApplyPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { addToast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [classes, setClasses] = useState<SchoolClass[]>([]);

    const [applicantDetails, setApplicantDetails] = useState<ApplicantDetails>({ fullName: '', dob: '', gender: 'Male', nationality: '', priorSchool: '' });
    const [guardians, setGuardians] = useState<GuardianDetails[]>([{ name: '', relationship: 'Father', phone: '', email: '', address: '' }]);
    const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
    const [desiredClassId, setDesiredClassId] = useState('');
    const [intakeSession] = useState('2025-2026');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successRef, setSuccessRef] = useState<string | null>(null);

    useEffect(() => {
        getClasses().then(setClasses);
    }, []);
    
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};
        switch (step) {
            case 0:
                if (!applicantDetails.fullName.trim()) newErrors.fullName = "Full name is required.";
                if (!applicantDetails.dob) newErrors.dob = "Date of birth is required.";
                break;
            case 1:
                if (!guardians[0].name.trim()) newErrors.guardianName = "Guardian name is required.";
                if (!guardians[0].email.trim()) {
                    newErrors.guardianEmail = "Guardian email is required.";
                } else if (!/^\S+@\S+\.\S+$/.test(guardians[0].email)) {
                    newErrors.guardianEmail = "Please enter a valid email address.";
                }
                if (!guardians[0].phone.trim()) newErrors.guardianPhone = "Guardian phone is required.";
                break;
            case 2:
                // This is a mock, so we can make it optional or required. Let's say one doc is required.
                if (documents.length === 0) newErrors.documents = "At least one document (e.g., Birth Certificate) is required.";
                break;
            case 3:
                if (!desiredClassId) newErrors.desiredClassId = "Please select a target class.";
                break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setApplicantDetails({ ...applicantDetails, [e.target.name]: e.target.value });
    };

    const handleGuardianChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newGuardians = [...guardians];
        newGuardians[index] = { ...newGuardians[index], [e.target.name]: e.target.value as any };
        setGuardians(newGuardians);
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCompletedSteps(prev => new Set(prev).add(currentStep));
            setCurrentStep(s => s + 1);
        }
    };
    
    const handleBack = () => {
        setCurrentStep(s => s - 1);
    };

    const handleStepClick = (step: number) => {
        if (completedSteps.has(step) || step < currentStep) {
            setCurrentStep(step);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;
        
        for (let i = 0; i < steps.length; i++) {
            if (!validateStep(i)) {
                addToast(`Please correct the errors in Step ${i + 1}.`, 'warning');
                setCurrentStep(i);
                return;
            }
        }

        setIsSubmitting(true);
        setFormError('');
        try {
            const result = await admissionsService.submitPublicApplication({ applicantDetails, guardians, documents, desiredClassId, intakeSession });
            if (result.duplicate) {
                 setFormError('Warning: A similar application already exists. If this is a mistake, please contact admissions.');
            }
            setSuccessRef(result.application.id);
        } catch {
            setFormError('An unexpected error occurred. Please try again.');
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
                    <p className="mt-4 text-sm text-gray-500">We will be in touch with the next steps shortly. You can check your status online using this reference number and your email.</p>
                     <Link to={`/apply/${siteId}/status?ref=${successRef}&email=${guardians[0].email}`} className="mt-6 inline-block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-md">Check Status Now</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">FWBC Online Application</h1>
                
                <div className="flex items-center justify-center mb-8">
                    {steps.map((label, index) => (
                        <React.Fragment key={label}>
                            <button onClick={() => handleStepClick(index)} className="flex flex-col items-center cursor-pointer disabled:cursor-default" disabled={!completedSteps.has(index) && index > currentStep}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= index ? 'border-indigo-600' : 'border-gray-300'} ${currentStep > index ? 'bg-indigo-600 text-white' : currentStep === index ? 'bg-white text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {completedSteps.has(index) && currentStep > index ? '✓' : index + 1}
                                </div>
                                <p className={`mt-1 text-xs ${currentStep >= index ? 'text-indigo-600' : 'text-gray-500'}`}>{label}</p>
                            </button>
                            {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-colors ${currentStep > index ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>
                
                <div className="min-h-[250px]">
                    {currentStep === 0 && <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Applicant Details</h2>
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <input name="fullName" value={applicantDetails.fullName} onChange={handleApplicantChange} className={`w-full p-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                        </div>
                         <div>
                            <label className="text-sm font-medium">Date of Birth</label>
                            <input name="dob" type="date" value={applicantDetails.dob} onChange={handleApplicantChange} className={`w-full p-2 border rounded-md ${errors.dob ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
                        </div>
                        <div>
                             <label className="text-sm font-medium">Gender</label>
                            <select name="gender" value={applicantDetails.gender} onChange={handleApplicantChange} className="w-full p-2 border border-gray-300 rounded-md"><option>Male</option><option>Female</option><option>Other</option></select>
                        </div>
                    </div>}

                    {currentStep === 1 && <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Primary Guardian Details</h2>
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                             <input name="name" value={guardians[0].name} onChange={e => handleGuardianChange(0, e)} className={`w-full p-2 border rounded-md ${errors.guardianName ? 'border-red-500' : 'border-gray-300'}`} />
                             {errors.guardianName && <p className="text-xs text-red-500 mt-1">{errors.guardianName}</p>}
                        </div>
                        <div>
                             <label className="text-sm font-medium">Email Address</label>
                            <input name="email" type="email" value={guardians[0].email} onChange={e => handleGuardianChange(0, e)} className={`w-full p-2 border rounded-md ${errors.guardianEmail ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.guardianEmail && <p className="text-xs text-red-500 mt-1">{errors.guardianEmail}</p>}
                        </div>
                        <div>
                             <label className="text-sm font-medium">Phone Number</label>
                             <input name="phone" type="tel" value={guardians[0].phone} onChange={e => handleGuardianChange(0, e)} className={`w-full p-2 border rounded-md ${errors.guardianPhone ? 'border-red-500' : 'border-gray-300'}`} />
                             {errors.guardianPhone && <p className="text-xs text-red-500 mt-1">{errors.guardianPhone}</p>}
                        </div>
                    </div>}
                    
                    {currentStep === 2 && <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Upload Documents</h2>
                        <div className="p-8 border-dashed border-2 rounded-lg text-center">
                            <p className="text-gray-500 mb-4">Please upload required documents. This is a mock interface.</p>
                            <button type="button" onClick={() => { if (!documents.find(d => d.type === 'BirthCertificate')) { setDocuments(prev => [...prev, { type: 'BirthCertificate', fileName: 'mock_birth_certificate.pdf', url: '#', verified: false }]); } }} className="text-indigo-600 font-medium">
                                Upload Birth Certificate
                            </button>
                        </div>
                        {documents.length > 0 && (
                            <div>
                                <h4 className="font-semibold">Uploaded Files:</h4>
                                <ul className="list-disc list-inside text-sm">
                                    {documents.map(doc => <li key={doc.type}>{doc.fileName}</li>)}
                                </ul>
                            </div>
                        )}
                        {errors.documents && <p className="text-xs text-red-500 mt-1">{errors.documents}</p>}
                    </div>}

                    {currentStep === 3 && <div className="space-y-4 text-sm bg-gray-50 p-4 rounded-md">
                        <h3 className="font-bold text-lg mb-2">Review Your Application</h3>
                        <p><strong>Applicant:</strong> {applicantDetails.fullName}, {applicantDetails.dob}</p>
                        <p><strong>Guardian:</strong> {guardians[0].name}, {guardians[0].email}</p>
                        <p><strong>Documents:</strong> {documents.length} file(s) uploaded</p>
                        <div>
                             <label className="text-sm font-medium block mt-4">Target Class for {intakeSession}</label>
                             <select value={desiredClassId} onChange={e => setDesiredClassId(e.target.value)} className={`w-full p-2 border rounded-md mt-1 ${errors.desiredClassId ? 'border-red-500' : 'border-gray-300'}`} required>
                                <option value="">-- Select Target Class --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.desiredClassId && <p className="text-xs text-red-500 mt-1">{errors.desiredClassId}</p>}
                        </div>
                    </div>}
                </div>

                {formError && <p className="text-red-600 text-sm mt-4 text-center">{formError}</p>}

                <div className="mt-8 flex justify-between">
                    <button onClick={handleBack} disabled={currentStep === 0} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50">Back</button>
                    {currentStep < steps.length - 1 ? (
                        <button onClick={handleNext} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Next</button>
                    ) : (
                        <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplyPage;