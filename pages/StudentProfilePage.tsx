import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getStudent, getClasses } from '../lib/schoolService';
import type { Student, SchoolClass } from '../types';
import { useToast } from '../contexts/ToastContext';
import { studentKeys } from '../lib/queryKeys';

// --- Helper Components ---

const ProfileCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
    <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row">
    <p className="text-sm font-medium text-gray-500 w-full sm:w-32 flex-shrink-0">{label}</p>
    <div className="text-sm text-gray-800 mt-1 sm:mt-0">{value}</div>
  </div>
);


const StudentProfilePage: React.FC = () => {
    const { siteId, studentId } = useParams<{ siteId: string; studentId: string }>();
    const location = useLocation();
    const { addToast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const queryKey = studentKeys.detail(studentId!);
    
    useEffect(() => {
        if (!studentId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const id = queryKey[queryKey.length - 1];
                const [studentData, classesData] = await Promise.all([
                    getStudent(id),
                    getClasses()
                ]);
                
                if (!studentData) {
                    setError('Student not found.');
                } else {
                    setStudent(studentData);
                }
                setClasses(classesData);
            } catch (err) {
                addToast('Failed to load student details.', 'error');
                setError('Failed to load student details.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [queryKey, addToast, studentId]);

    const classMap = new Map(classes.map(c => [c.id, c.name]));

    const renderLoadingSkeleton = () => (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-200 h-64 rounded-lg"></div>
                    <div className="bg-gray-200 h-32 rounded-lg"></div>
                </div>
                <div className="lg:col-span-2 bg-gray-200 h-64 rounded-lg"></div>
            </div>
        </div>
    );

    if (loading) {
        return renderLoadingSkeleton();
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow border">
                <h2 className="text-xl font-semibold text-red-600">Error</h2>
                <p className="text-gray-500 mt-2">{error}</p>
                 <Link to={`/school/${siteId}/students${location.search}`} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                    &larr; Back to Students
                </Link>
            </div>
        );
    }
    
    if (!student) {
        return null; // Should be covered by the error state
    }

    const studentClassName = classMap.get(student.classId) || 'N/A';
    
    return (
        <div className="space-y-6">
            <div>
                <Link to={`/school/${siteId}/students${location.search}`} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2">
                     &larr; Back to Students
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Admission No: <span className="font-medium text-gray-700">{student.admissionNo}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    Class: <span className="font-medium text-gray-700">{studentClassName}</span>
                </p>
            </div>

            {/* Tabs */}
            <nav className="border-b border-gray-200">
                <div className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-indigo-600 border-indigo-500" aria-current="page">
                        Overview
                    </button>
                    <button disabled className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-gray-400 border-transparent cursor-not-allowed">
                        Guardians
                    </button>
                    <button disabled className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-gray-400 border-transparent cursor-not-allowed">
                        Attendance
                    </button>
                     <button disabled className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-gray-400 border-transparent cursor-not-allowed">
                        Fees
                    </button>
                </div>
            </nav>

            {/* Overview Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <ProfileCard title="Profile Photo">
                        <img 
                            src={student.photoUrl || `https://placehold.co/400x400/EBF4FF/7F8A9A?text=No+Image`}
                            alt={`${student.name}'s profile photo`}
                            className="rounded-lg w-full h-auto aspect-square object-cover bg-gray-100"
                        />
                    </ProfileCard>
                    <ProfileCard title="Contact Information">
                        <InfoRow label="Email" value={<a href={`mailto:${student.contact.email}`} className="text-indigo-600 hover:underline">{student.contact.email}</a>} />
                        <InfoRow label="Phone" value={student.contact.phone} />
                    </ProfileCard>
                     <ProfileCard title="Address">
                         <address className="text-sm text-gray-800 not-italic">
                            {student.address.line1}<br/>
                            {student.address.city}<br/>
                            {student.address.postcode}
                        </address>
                    </ProfileCard>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2">
                    <ProfileCard title="Basic Information">
                        <InfoRow label="Full Name" value={student.name} />
                        <InfoRow label="Admission No." value={<span className="font-mono">{student.admissionNo}</span>} />
                        <InfoRow label="Class" value={studentClassName} />
                    </ProfileCard>
                </div>
            </div>
        </div>
    );
};

export default StudentProfilePage;