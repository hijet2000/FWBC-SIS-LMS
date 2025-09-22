import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { getClasses } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
import type { Homework, SchoolClass, Subject } from '../../types';
import AssignHomeworkModal from '../../components/homework/AssignHomeworkModal';
import Modal from '../../components/ui/Modal';

const HomeworkListPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [homework, setHomework] = useState<Homework[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [archivingHomework, setArchivingHomework] = useState<Homework | null>(null);
    
    const filters = useMemo(() => ({
        classId: searchParams.get('classId') || undefined,
        subjectId: searchParams.get('subjectId') || undefined,
    }), [searchParams]);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            homeworkService.listHomework(filters),
            getClasses(),
            listSubjects()
        ]).then(([hwData, classData, subjectData]) => {
            setHomework(hwData);
            setClasses(classData);
            setSubjects(subjectData);
        }).catch(() => {
            addToast('Failed to load homework data.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, [filters, addToast]);

    const handleFilterChange = (key: 'classId' | 'subjectId', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) {
                newParams.set(key, value);
            } else {
                newParams.delete(key);
            }
            return newParams;
        }, { replace: true });
    };

    const handleOpenModal = (hw: Homework | null = null) => {
        setEditingHomework(hw);
        setIsModalOpen(true);
    };
    
    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setEditingHomework(null);
        addToast(editingHomework ? 'Homework updated!' : 'Homework assigned!', 'success');
        fetchData();
    };
    
    const handleConfirmArchive = async () => {
        if (!archivingHomework || !user) return;
        try {
            await homeworkService.archiveHomework(archivingHomework.id, user);
            addToast('Homework archived.', 'success');
            fetchData();
        } catch {
            addToast('Failed to archive homework.', 'error');
        } finally {
            setArchivingHomework(null);
        }
    };

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Homework</h1>
                <button onClick={() => handleOpenModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Assign Homework</button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={filters.classId || ''} onChange={(e) => handleFilterChange('classId', e.target.value)} className="w-full rounded-md border-gray-300">
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filters.subjectId || ''} onChange={(e) => handleFilterChange('subjectId', e.target.value)} className="w-full rounded-md border-gray-300">
                        <option value="">All Subjects</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> :
                        homework.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-gray-500">No homework found.</td></tr> :
                        homework.map(hw => (
                            <tr key={hw.id}>
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">{hw.title}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{classMap.get(hw.classId)}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{subjectMap.get(hw.subjectId)}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{hw.dueDate}</td>
                                <td className="px-4 py-4 text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${hw.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {hw.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right text-sm font-medium space-x-4">
                                    <Link to={`/school/${siteId}/homework/${hw.id}`} className="text-indigo-600 hover:text-indigo-900">Submissions</Link>
                                    <button onClick={() => handleOpenModal(hw)} disabled={hw.status === 'Archived'} className="text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed">Edit</button>
                                    <button onClick={() => setArchivingHomework(hw)} disabled={hw.status === 'Archived'} className="text-red-600 hover:text-red-900 disabled:text-gray-300 disabled:cursor-not-allowed">Archive</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && user && (
                <AssignHomeworkModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaveSuccess={handleSaveSuccess}
                    classes={classes}
                    subjects={subjects}
                    actor={user}
                    initialData={editingHomework}
                />
            )}
            
            {archivingHomework && (
                <Modal isOpen={!!archivingHomework} onClose={() => setArchivingHomework(null)} title="Confirm Archive">
                    <div className="p-4">
                        <p>Are you sure you want to archive "{archivingHomework.title}"? This will hide it from students but preserve submission data.</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setArchivingHomework(null)} className="px-4 py-2 border rounded-md">Cancel</button>
                            <button onClick={handleConfirmArchive} className="px-4 py-2 text-white bg-red-600 rounded-md">Archive</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default HomeworkListPage;