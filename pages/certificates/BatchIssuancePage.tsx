
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as certificateService from '../../lib/certificateService';
import { getClasses, getStudentsByClass } from '../../lib/schoolService';
import type { Student, SchoolClass } from '../../types';

const BatchIssuancePage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [templates, setTemplates] = useState<any[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState({ data: true, issuing: false });
    
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [details, setDetails] = useState('');

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
        if (selectedClass) {
            getStudentsByClass(selectedClass).then(setStudents);
        } else {
            setStudents([]);
        }
        setSelectedStudents(new Set());
    }, [selectedClass]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudents(new Set(students.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };
    
    const handleIssue = async () => {
        if (!user || !selectedTemplate || selectedStudents.size === 0 || !details) {
            addToast('Please select a template, at least one student, and provide details.', 'warning');
            return;
        }
        setLoading(p => ({...p, issuing: true}));
        try {
            await certificateService.issueCertificates(selectedTemplate, Array.from(selectedStudents), details, user);
            addToast(`Successfully issued ${selectedStudents.size} certificates.`, 'success');
            // Reset form
            setSelectedStudents(new Set());
            setDetails('');
        } catch {
            addToast('Failed to issue certificates.', 'error');
        } finally {
            setLoading(p => ({...p, issuing: false}));
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Batch Certificate Issuance</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold">1. Select Template & Class</h2>
                         <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full rounded-md mt-2">
                             <option value="">Select Template...</option>
                             {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                         <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full rounded-md mt-2">
                             <option value="">Select Class...</option>
                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold">3. Details & Issue</h2>
                        <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Details to print on certificate (e.g., 'For excellence in Science')" className="w-full rounded-md mt-2" rows={4} />
                        <button onClick={handleIssue} disabled={loading.issuing} className="w-full mt-2 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                            {loading.issuing ? 'Issuing...' : `Issue ${selectedStudents.size} Certificates`}
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold">2. Select Students</h2>
                    {students.length > 0 ? (
                        <div className="mt-2 max-h-96 overflow-y-auto">
                            <table className="min-w-full">
                                <thead><tr><th className="w-10"><input type="checkbox" onChange={handleSelectAll} /></th><th className="text-left font-normal">Name</th></tr></thead>
                                <tbody>{students.map(s => (
                                    <tr key={s.id}>
                                        <td><input type="checkbox" checked={selectedStudents.has(s.id)} onChange={() => setSelectedStudents(p => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} /></td>
                                        <td>{s.name}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    ) : <p className="text-sm text-gray-500 mt-2">Select a class to see students.</p>}
                </div>
            </div>
        </div>
    );
};

export default BatchIssuancePage;
