import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as certificateService from '../../lib/certificateService';
import { getClasses, getStudentsByClass } from '../../lib/schoolService';
import type { Student, SchoolClass, CertificateTemplate } from '../../types';

const BatchIssuancePage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState({ data: true, issuing: false });
    
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [details, setDetails] = useState<Record<string, string>>({ main: '' });

    useEffect(() => {
        setLoading(p => ({...p, data: true}));
        Promise.all([
            certificateService.listTemplates(),
            getClasses()
        ]).then(([tplData, clsData]) => {
            setTemplates(tplData);
            setClasses(clsData);
        }).finally(() => setLoading(p => ({...p, data: false})));
    }, []);
    
    useEffect(() => {
        if (selectedClassId) {
            getStudentsByClass(selectedClassId).then(setStudents);
        } else {
            setStudents([]);
        }
        setSelectedStudentIds(new Set());
    }, [selectedClassId]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(new Set(students.map(s => s.id)));
        } else {
            setSelectedStudentIds(new Set());
        }
    };
    
    const handleIssue = async () => {
        if (!user || !selectedTemplateId || selectedStudentIds.size === 0 || !details.main) {
            addToast('Please complete all fields.', 'warning');
            return;
        }
        setLoading(p => ({...p, issuing: true}));
        try {
            await certificateService.issueCertificates(selectedTemplateId, Array.from(selectedStudentIds), details, user);
            addToast(`Successfully issued ${selectedStudentIds.size} certificates.`, 'success');
            // Reset form
            setStep(1);
            setSelectedStudentIds(new Set());
            setDetails({ main: '' });
        } catch {
            addToast('Failed to issue certificates.', 'error');
        } finally {
            setLoading(p => ({...p, issuing: false}));
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Batch Certificate Issuance</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                {/* Step 1: Template */}
                {step === 1 && (
                    <div>
                        <h2 className="text-xl font-semibold">Step 1: Select a Template</h2>
                        <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full md:w-1/2 mt-2 rounded-md">
                             <option value="">Select Template...</option>
                             {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                         <button onClick={() => setStep(2)} disabled={!selectedTemplateId} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Next</button>
                    </div>
                )}
                {/* Step 2: Students */}
                {step === 2 && (
                    <div>
                        <h2 className="text-xl font-semibold">Step 2: Select Students</h2>
                         <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full md:w-1/2 mt-2 rounded-md">
                             <option value="">Select Class...</option>
                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                         {students.length > 0 && <div className="mt-4 max-h-60 overflow-y-auto border rounded-md">
                            <table className="min-w-full">
                                <thead><tr><th className="p-2 w-10"><input type="checkbox" onChange={handleSelectAll}/></th><th className="p-2 text-left">Name</th></tr></thead>
                                <tbody>{students.map(s => (<tr key={s.id}><td className="p-2"><input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => setSelectedStudentIds(p => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}/></td><td>{s.name}</td></tr>))}</tbody>
                            </table>
                         </div>}
                         <div className="mt-4 flex gap-2">
                            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
                            <button onClick={() => setStep(3)} disabled={selectedStudentIds.size === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Next</button>
                         </div>
                    </div>
                )}
                {/* Step 3: Details & Confirm */}
                {step === 3 && (
                     <div>
                        <h2 className="text-xl font-semibold">Step 3: Details and Confirmation</h2>
                        <p className="mt-2 text-sm">Issuing <strong>{templates.find(t=>t.id === selectedTemplateId)?.name}</strong> to <strong>{selectedStudentIds.size}</strong> students.</p>
                        <textarea value={details.main} onChange={e => setDetails({main: e.target.value})} placeholder="Main details for certificate (e.g., 'Excellence in Science')" className="w-full mt-2" rows={3} />
                         <div className="mt-4 flex gap-2">
                            <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
                            <button onClick={handleIssue} disabled={loading.issuing} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">
                                {loading.issuing ? 'Issuing...' : `Confirm & Issue ${selectedStudentIds.size} Certificates`}
                            </button>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatchIssuancePage;