import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getStudent, getClasses, updateStudentDetails } from '../lib/schoolService';
import { listInvoices } from '../lib/feesService';
import { listAttendanceRecords, saveStudentAttendanceRecord } from '../lib/attendanceService';
import type { Student, SchoolClass, Invoice, AttendanceRecord, AttendanceStatus, User } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { studentKeys } from '../lib/queryKeys';
import RecordPaymentModal from '../components/fees/RecordPaymentModal';
import PhotoCaptureModal from '../components/student/PhotoCaptureModal';

// --- Helper & Icon Components ---
const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);

const ProfileCard: React.FC<{ title: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }> = ({ title, children, className = '', actions }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
    <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row">
    <p className="text-sm font-medium text-gray-500 w-full sm:w-32 flex-shrink-0">{label}</p>
    <div className="text-sm text-gray-800 mt-1 sm:mt-0">{value}</div>
  </div>
);

const MiniKpiCard: React.FC<{ title: string; value: string | number; className?: string }> = ({ title, value, className }) => (
    <div className="bg-gray-50 p-3 rounded-lg border">
        <p className="text-xs text-gray-500">{title}</p>
        <p className={`text-xl font-bold ${className}`}>{value}</p>
    </div>
);


const statusStyles = { Paid: 'bg-green-100 text-green-800', Partial: 'bg-yellow-100 text-yellow-800', Unpaid: 'bg-gray-100 text-gray-800', Overdue: 'bg-red-100 text-red-800' };
const today = new Date().toISOString().split('T')[0];

const StudentProfilePage: React.FC = () => {
    const { siteId, studentId } = useParams<{ siteId: string; studentId: string }>();
    const location = useLocation();
    const { addToast } = useToast();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Core Data
    const [student, setStudent] = useState<Student | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'fees'>('overview');
    
    // Page State
    const [loading, setLoading] = useState({ profile: true, tab: false, saving: false });
    const [error, setError] = useState<string | null>(null);
    
    // Editing State
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editableStudent, setEditableStudent] = useState<Student | null>(null);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    
    // Tab-specific State
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [newAttendance, setNewAttendance] = useState({ date: today, status: 'PRESENT' as AttendanceStatus });
    const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);

    const queryKey = studentKeys.detail(studentId!);
    
    const fetchData = useCallback(async () => {
        if (!studentId) return;
        setLoading(prev => ({ ...prev, profile: true }));
        setError(null);
        try {
            const [studentData, classesData] = await Promise.all([ getStudent(studentId), getClasses() ]);
            if (!studentData) { setError('Student not found.'); } 
            else { 
                setStudent(studentData);
                setEditableStudent(JSON.parse(JSON.stringify(studentData))); // Deep copy for editing
            }
            setClasses(classesData);
        } catch (err) {
            addToast('Failed to load student details.', 'error');
            setError('Failed to load student details.');
        } finally {
            setLoading(prev => ({ ...prev, profile: false }));
        }
    }, [studentId, addToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (!student) return;
        setLoading(prev => ({ ...prev, tab: true }));
        if (activeTab === 'fees') {
            listInvoices({ studentId: student.id }).then(setInvoices).finally(() => setLoading(prev => ({ ...prev, tab: false })));
        } else if (activeTab === 'attendance') {
            listAttendanceRecords({ studentId: student.id }).then(setAttendanceRecords).finally(() => setLoading(prev => ({ ...prev, tab: false })));
        }
    }, [activeTab, student]);

    const handleUpdateDetails = async (updates: Partial<Pick<Student, 'contact' | 'address' | 'photoUrl'>>) => {
        if (!student || !user) return;
        setLoading(prev => ({...prev, saving: true}));
        try {
            const updatedStudent = await updateStudentDetails(student.id, updates, user);
            setStudent(updatedStudent);
            setEditableStudent(JSON.parse(JSON.stringify(updatedStudent)));
            setIsEditingContact(false);
            setIsEditingAddress(false);
            addToast('Student details updated.', 'success');
        } catch {
            addToast('Failed to save changes.', 'error');
        } finally {
            setLoading(prev => ({...prev, saving: false}));
        }
    };
    
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleUpdateDetails({ photoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCameraSave = (dataUrl: string) => {
        handleUpdateDetails({ photoUrl: dataUrl });
        setIsCameraModalOpen(false);
    };

    const handleSaveNewAttendance = async () => {
        if (!student || !user) return;
        setLoading(prev => ({ ...prev, tab: true }));
        await saveStudentAttendanceRecord({ ...newAttendance, studentId: student.id, classId: student.classId, actor: user });
        addToast('Attendance recorded.', 'success');
        listAttendanceRecords({ studentId: student.id }).then(setAttendanceRecords).finally(() => setLoading(prev => ({ ...prev, tab: false })));
    };
    
    const classMap = new Map(classes.map(c => [c.id, c.name]));
    const totalOutstanding = useMemo(() => invoices.reduce((acc, inv) => acc + (inv.total - inv.paid), 0), [invoices]);
    const attendanceStats = useMemo(() => {
        const total = attendanceRecords.length;
        if (total === 0) return { presentRate: 'N/A', late: 0, absent: 0 };
        const present = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const late = attendanceRecords.filter(r => r.status === 'LATE').length;
        const absent = attendanceRecords.filter(r => r.status === 'ABSENT').length;
        return {
            presentRate: `${((present / total) * 100).toFixed(1)}%`,
            late,
            absent,
        };
    }, [attendanceRecords]);

    const renderLoadingSkeleton = () => <div className="space-y-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="h-5 bg-gray-200 rounded w-1/3"></div><div className="h-10 bg-gray-200 rounded w-full"></div><div className="bg-gray-200 h-64 rounded-lg"></div></div>;

    if (loading.profile) return renderLoadingSkeleton();
    if (error) return <div className="text-center p-8 bg-white rounded-lg shadow border"><h2 className="text-xl font-semibold text-red-600">Error</h2><p className="text-gray-500 mt-2">{error}</p><Link to={`/school/${siteId}/students${location.search}`} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">&larr; Back to Students</Link></div>;
    if (!student || !editableStudent) return null;

    return (
        <div className="space-y-6">
             {paymentModalInvoice && user && (
                <RecordPaymentModal isOpen={!!paymentModalInvoice} onClose={() => setPaymentModalInvoice(null)} onSaveSuccess={() => { setPaymentModalInvoice(null); listInvoices({ studentId: student.id }).then(setInvoices); addToast('Payment Recorded!', 'success')}} invoice={paymentModalInvoice} actor={user} />
            )}
            <PhotoCaptureModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} onSave={handleCameraSave} />
            <div>
                <Link to={`/school/${siteId}/students${location.search}`} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2">&larr; Back to Students</Link>
                <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
                <p className="mt-1 text-sm text-gray-500">Admission No: <span className="font-medium text-gray-700">{student.admissionNo}</span><span className="mx-2 text-gray-300">|</span>Class: <span className="font-medium text-gray-700">{classMap.get(student.classId) || 'N/A'}</span></p>
            </div>

            <nav className="border-b border-gray-200">
                <div className="-mb-px flex space-x-8" aria-label="Tabs">
                    {(['overview', 'attendance', 'fees'] as const).map(tab => (
                         <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'text-indigo-600 border-indigo-500' : 'text-gray-500 border-transparent hover:border-gray-300'}`} >{tab}</button>
                    ))}
                </div>
            </nav>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <ProfileCard title="Profile Photo">
                            <img src={student.photoUrl || `https://placehold.co/400x400/EBF4FF/7F8A9A?text=No+Image`} alt={`${student.name}'s profile`} className="rounded-lg w-full aspect-square object-cover bg-gray-100" />
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 border rounded-md hover:bg-gray-50"><UploadIcon className="h-4 w-4" /> Upload</button>
                                <button onClick={() => setIsCameraModalOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 border rounded-md hover:bg-gray-50"><CameraIcon className="h-4 w-4" /> Camera</button>
                            </div>
                        </ProfileCard>
                        <ProfileCard title="Contact Information" actions={!isEditingContact && <button onClick={() => setIsEditingContact(true)} className="text-xs font-medium text-indigo-600">Edit</button>}>
                            {isEditingContact ? (
                                <div className="space-y-2">
                                    <div>
                                        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">Email</label>
                                        <input id="contact-email" value={editableStudent.contact.email} onChange={e => setEditableStudent({...editableStudent, contact: {...editableStudent.contact, email: e.target.value}})} className="w-full text-sm mt-1 rounded-md border-gray-300" placeholder="Email"/>
                                    </div>
                                    <div>
                                        <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                        <input id="contact-phone" value={editableStudent.contact.phone} onChange={e => setEditableStudent({...editableStudent, contact: {...editableStudent.contact, phone: e.target.value}})} className="w-full text-sm mt-1 rounded-md border-gray-300" placeholder="Phone"/>
                                    </div>
                                    <div className="flex gap-2 justify-end pt-2">
                                        <button onClick={() => { setIsEditingContact(false); setEditableStudent(JSON.parse(JSON.stringify(student)))}} className="text-xs px-2 py-1 border rounded">Cancel</button>
                                        <button onClick={() => handleUpdateDetails({ contact: editableStudent.contact })} disabled={loading.saving} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded disabled:bg-gray-400">{loading.saving ? 'Saving...' : 'Save'}</button>
                                    </div>
                                </div>
                            ) : ( <>
                                <InfoRow label="Email" value={<a href={`mailto:${student.contact.email}`} className="text-indigo-600 hover:underline">{student.contact.email}</a>} />
                                <InfoRow label="Phone" value={student.contact.phone} />
                            </>)}
                        </ProfileCard>
                         <ProfileCard title="Address" actions={!isEditingAddress && <button onClick={() => setIsEditingAddress(true)} className="text-xs font-medium text-indigo-600">Edit</button>}>
                            {isEditingAddress ? (
                                <div className="space-y-2">
                                     <div>
                                        <label htmlFor="address-line1" className="block text-sm font-medium text-gray-700">Address Line 1</label>
                                        <input id="address-line1" value={editableStudent.address.line1} onChange={e => setEditableStudent({...editableStudent, address: {...editableStudent.address, line1: e.target.value}})} className="w-full text-sm mt-1 rounded-md border-gray-300" placeholder="Address Line 1"/>
                                     </div>
                                     <div>
                                         <label htmlFor="address-city" className="block text-sm font-medium text-gray-700">City</label>
                                         <input id="address-city" value={editableStudent.address.city} onChange={e => setEditableStudent({...editableStudent, address: {...editableStudent.address, city: e.target.value}})} className="w-full text-sm mt-1 rounded-md border-gray-300" placeholder="City"/>
                                     </div>
                                     <div>
                                         <label htmlFor="address-postcode" className="block text-sm font-medium text-gray-700">Postcode</label>
                                         <input id="address-postcode" value={editableStudent.address.postcode} onChange={e => setEditableStudent({...editableStudent, address: {...editableStudent.address, postcode: e.target.value}})} className="w-full text-sm mt-1 rounded-md border-gray-300" placeholder="Postcode"/>
                                     </div>
                                    <div className="flex gap-2 justify-end pt-2">
                                        <button onClick={() => { setIsEditingAddress(false); setEditableStudent(JSON.parse(JSON.stringify(student)))}} className="text-xs px-2 py-1 border rounded">Cancel</button>
                                        <button onClick={() => handleUpdateDetails({ address: editableStudent.address })} disabled={loading.saving} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded disabled:bg-gray-400">{loading.saving ? 'Saving...' : 'Save'}</button>
                                    </div>
                                </div>
                            ) : (<address className="text-sm text-gray-800 not-italic">{student.address.line1}<br/>{student.address.city}<br/>{student.address.postcode}</address>)}
                        </ProfileCard>
                    </div>
                    <div className="lg:col-span-2"><ProfileCard title="Basic Information"><InfoRow label="Full Name" value={student.name} /><InfoRow label="Admission No." value={<span className="font-mono">{student.admissionNo}</span>} /><InfoRow label="Class" value={classMap.get(student.classId) || 'N/A'} /></ProfileCard></div>
                </div>
            )}
            
            {activeTab === 'attendance' && (
                <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MiniKpiCard title="Overall Present" value={attendanceStats.presentRate} className="text-green-600" />
                        <MiniKpiCard title="Days Late" value={attendanceStats.late} className="text-yellow-600" />
                        <MiniKpiCard title="Days Absent" value={attendanceStats.absent} className="text-red-600" />
                    </div>
                    <ProfileCard title="Record New Entry">
                        <div className="flex items-end gap-4">
                            <div className="flex-1"><label className="text-sm">Date</label><input type="date" value={newAttendance.date} onChange={e => setNewAttendance({...newAttendance, date: e.target.value})} className="w-full" /></div>
                            <div className="flex-1"><label className="text-sm">Status</label><select value={newAttendance.status} onChange={e => setNewAttendance({...newAttendance, status: e.target.value as AttendanceStatus})} className="w-full">{['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <button onClick={handleSaveNewAttendance} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
                        </div>
                    </ProfileCard>
                    <ProfileCard title="Recent Records">
                        {loading.tab ? <p>Loading...</p> : 
                            <table className="w-full text-sm">
                                <thead><tr className="border-b"><th className="text-left py-2">Date</th><th className="text-left py-2">Status</th></tr></thead>
                                <tbody>{attendanceRecords.slice(0, 10).map(r => <tr key={r.id}><td className="py-2">{r.date}</td><td>{r.status}</td></tr>)}</tbody>
                            </table>
                        }
                    </ProfileCard>
                </div>
            )}

            {activeTab === 'fees' && (
                <div className="space-y-6">
                    <MiniKpiCard title="Total Outstanding Balance" value={`£${totalOutstanding.toFixed(2)}`} className={totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'} />
                    <ProfileCard title="Fee History & Payments">
                        {loading.tab ? <p>Loading...</p> : 
                            <table className="w-full text-sm">
                                <thead><tr className="border-b"><th className="text-left py-2">Invoice #</th><th className="text-left py-2">Due</th><th className="text-left py-2">Total</th><th className="text-left py-2">Outstanding</th><th className="text-left py-2">Status</th><th className="text-right py-2"></th></tr></thead>
                                <tbody>{invoices.map(inv => {
                                    const outstanding = inv.total - inv.paid;
                                    return (<tr key={inv.id}><td className="py-2 font-mono">{inv.invoiceNo}</td><td>{inv.dueAt}</td><td>£{inv.total.toFixed(2)}</td><td className={outstanding > 0 ? 'text-red-600 font-bold' : ''}>£{outstanding.toFixed(2)}</td><td><span className={`px-2 py-0.5 text-xs rounded-full ${statusStyles[inv.status]}`}>{inv.status}</span></td><td className="text-right">{outstanding > 0 && <button onClick={() => setPaymentModalInvoice(inv)} className="text-indigo-600 font-medium text-xs">Record Payment</button>}</td></tr>);
                                })}</tbody>
                            </table>
                        }
                    </ProfileCard>
                </div>
            )}
        </div>
    );
};

export default StudentProfilePage;