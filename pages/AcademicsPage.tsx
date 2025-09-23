

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { listSubjects, listTeachers, listMappings, deleteMapping } from '../lib/academicsService';
import { getClasses } from '../lib/schoolService';
// FIX: Import ToastType to use for state
import type { Subject, Teacher, SchoolClass, Mapping, ToastType } from '../types';

import MappingModal from '../components/academics/MappingModal';
import Toast from '../components/ui/Toast';
import Modal from '../components/ui/Modal';


const AcademicsPage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data states
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);
    const [deletingMapping, setDeletingMapping] = useState<Mapping | null>(null);
    // FIX: Update toast state to use ToastType
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    // Filter states from URL
    const filters = useMemo(() => ({
        classId: searchParams.get('classId') || '',
        subjectId: searchParams.get('subjectId') || '',
        teacherId: searchParams.get('teacherId') || '',
        q: searchParams.get('q') || '',
    }), [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [mappingsData, subjectsData, teachersData, classesData] = await Promise.all([
                listMappings(),
                listSubjects(),
                listTeachers(),
                getClasses(),
            ]);
            setMappings(mappingsData);
            setSubjects(subjectsData);
            setTeachers(teachersData);
            setClasses(classesData);
        } catch (err) {
            setError("Failed to load academic data. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);

    const filteredMappings = useMemo(() => {
        return mappings.filter(m => {
            const subject = subjectMap.get(m.subjectId);
            const teacher = teacherMap.get(m.teacherId);
            const searchHaystack = `${subject?.name} ${subject?.code} ${teacher?.name} ${m.notes}`.toLowerCase();
            
            return (
                (filters.subjectId ? m.subjectId === filters.subjectId : true) &&
                (filters.teacherId ? m.teacherId === filters.teacherId : true) &&
                (filters.classId ? m.classIds.includes(filters.classId) : true) &&
                (filters.q ? searchHaystack.includes(filters.q.toLowerCase()) : true)
            );
        });
    }, [mappings, filters, subjectMap, teacherMap]);

    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };

    const handleOpenModal = (mapping: Mapping | null = null) => {
        setEditingMapping(mapping);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMapping(null);
    };

    const handleSaveSuccess = (message: string) => {
        handleCloseModal();
        fetchData(); // Refetch all data
        setToast({ message, type: 'success' });
    };

    const handleDeleteClick = (mapping: Mapping) => {
        setDeletingMapping(mapping);
    };

    const handleConfirmDelete = async () => {
        if (!deletingMapping) return;
        try {
            await deleteMapping(deletingMapping.id);
            setToast({ message: 'Mapping deleted successfully.', type: 'success' });
            fetchData();
        } catch {
            setToast({ message: 'Failed to delete mapping.', type: 'error' });
        } finally {
            setDeletingMapping(null);
        }
    };

    const hasScope = (scope: string) => user?.scopes.includes(scope) || user?.scopes.includes('sis:admin');

    if (!hasScope('school:admin')) {
        return (
            <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="mt-2">You do not have the required 'school:admin' permissions to view this page.</p>
                 <p className="mt-4 text-xs">Your current scopes: {user?.scopes.join(', ')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Academics</h1>
                    <p className="mt-1 text-sm text-gray-500">Map subjects to teachers and the classes they teach. This powers timetables and exam scheduling.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Add Mapping
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="search" placeholder="Search subject, teacher, notes..." value={filters.q} onChange={e => handleFilterChange('q', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm" />
                    <select value={filters.subjectId} onChange={e => handleFilterChange('subjectId', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm"><option value="">All Subjects</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    <select value={filters.teacherId} onChange={e => handleFilterChange('teacherId', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm"><option value="">All Teachers</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                    <select value={filters.classId} onChange={e => handleFilterChange('classId', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm"><option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </div>
            </div>

            <div className="flow-root">
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Subject</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Teacher</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Classes</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="py-4 px-6"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td></tr>
                                ))
                            ) : error ? (
                                <tr><td colSpan={5} className="py-8 text-center text-red-600">{error}</td></tr>
                            ) : filteredMappings.length === 0 ? (
                                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No mappings found. <button onClick={() => handleOpenModal()} className="text-indigo-600 font-medium">Add a mapping</button> to get started.</td></tr>
                            ) : (
                                filteredMappings.map(m => {
                                    const subject = subjectMap.get(m.subjectId);
                                    const teacher = teacherMap.get(m.teacherId);
                                    const classNames = m.classIds.map(cid => classMap.get(cid)?.name).filter(Boolean).join(', ');
                                    return (
                                        <tr key={m.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm sm:pl-6 font-medium text-gray-900">{subject?.name} {subject?.code && `(${subject.code})`}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500">{teacher?.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500" title={classNames}><div className="truncate w-48">{classNames}</div></td>
                                            <td className="px-3 py-4 text-sm text-gray-500" title={m.notes}><div className="truncate w-48">{m.notes}</div></td>
                                            <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                                                <button onClick={() => handleOpenModal(m)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                                <button onClick={() => handleDeleteClick(m)} className="text-red-600 hover:text-red-900">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <MappingModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSaveSuccess={handleSaveSuccess}
                    subjects={subjects}
                    teachers={teachers}
                    classes={classes}
                    initialData={editingMapping}
                />
            )}

            {deletingMapping && (
                <Modal isOpen={!!deletingMapping} onClose={() => setDeletingMapping(null)} title="Confirm Deletion">
                    <div className="p-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete the mapping for
                            <strong className="mx-1">{subjectMap.get(deletingMapping.subjectId)?.name}</strong>
                            taught by
                            <strong className="mx-1">{teacherMap.get(deletingMapping.teacherId)?.name}</strong>?
                        </p>
                        <p className="mt-2 text-xs text-gray-500">This action cannot be undone.</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setDeletingMapping(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                            <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">Delete Mapping</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AcademicsPage;
