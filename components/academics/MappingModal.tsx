
import React, { useState, useEffect } from 'react';
import type { Subject, Teacher, SchoolClass, Mapping } from '../../types';
import { createMapping, updateMapping } from '../../lib/academicsService';
import Modal from '../ui/Modal';

interface MappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (message: string) => void;
  subjects: Subject[];
  teachers: Teacher[];
  classes: SchoolClass[];
  initialData: Mapping | null;
}

const MappingModal: React.FC<MappingModalProps> = ({ isOpen, onClose, onSaveSuccess, subjects, teachers, classes, initialData }) => {
  const [formData, setFormData] = useState({
    subjectId: initialData?.subjectId || '',
    teacherId: initialData?.teacherId || '',
    classIds: initialData?.classIds || [] as string[],
    notes: initialData?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      subjectId: initialData?.subjectId || '',
      teacherId: initialData?.teacherId || '',
      classIds: initialData?.classIds || [],
      notes: initialData?.notes || '',
    });
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.subjectId) newErrors.subjectId = 'Subject is required.';
    if (!formData.teacherId) newErrors.teacherId = 'Teacher is required.';
    if (formData.classIds.length === 0) newErrors.classIds = 'At least one class must be selected.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClassToggle = (classId: string) => {
    setFormData(prev => {
      const newClassIds = prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId];
      return { ...prev, classIds: newClassIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      if (initialData) {
        await updateMapping(initialData.id, formData);
        onSaveSuccess('Mapping updated successfully.');
      } else {
        await createMapping(formData);
        onSaveSuccess('Mapping created successfully.');
      }
    } catch {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Mapping' : 'Add New Mapping'}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
            <select id="subject" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="">Select a subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.subjectId && <p className="mt-1 text-sm text-red-600">{errors.subjectId}</p>}
          </div>

          <div>
            <label htmlFor="teacher" className="block text-sm font-medium text-gray-700">Teacher</label>
            <select id="teacher" value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="">Select a teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.teacherId && <p className="mt-1 text-sm text-red-600">{errors.teacherId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Classes</label>
            <div className="mt-2 p-2 border border-gray-300 rounded-md max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                    {classes.map(c => (
                        <div key={c.id} className="flex items-center">
                            <input
                                id={`class-${c.id}`}
                                type="checkbox"
                                checked={formData.classIds.includes(c.id)}
                                onChange={() => handleClassToggle(c.id)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={`class-${c.id}`} className="ml-2 text-sm text-gray-700">{c.name}</label>
                        </div>
                    ))}
                </div>
            </div>
             {errors.classIds && <p className="mt-1 text-sm text-red-600">{errors.classIds}</p>}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" maxLength={500}></textarea>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
            {isSaving ? 'Saving...' : 'Save Mapping'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MappingModal;
