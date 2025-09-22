import React, { useState, useEffect } from 'react';
import type { User, Student, HostelSettings } from '../../types';
import * as hostelService from '../../lib/hostelService';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

interface HostelVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  boarders: Student[];
}

const HostelVisitorModal: React.FC<HostelVisitorModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, boarders }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ visitorName: '', studentId: '', relation: '', idChecked: false });
    const [settings, setSettings] = useState<HostelSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if(isOpen) {
            setFormData({ visitorName: '', studentId: '', relation: '', idChecked: false });
            setError('');
            hostelService.getHostelSettings().then(s => {
                setSettings(s);
                if (s.idRequiredForVisitors) {
                    setFormData(prev => ({ ...prev, idChecked: true }));
                }
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.visitorName || !formData.studentId || !formData.relation) {
            setError('All fields are required.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await hostelService.checkInHostelVisitor(formData, actor);
            addToast('Visitor checked in successfully!', 'success');
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to check in visitor.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Check In Hostel Visitor">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <input value={formData.visitorName} onChange={e => setFormData({...formData, visitorName: e.target.value})} placeholder="Visitor's Full Name" className="w-full rounded-md" required />
                    <select value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full rounded-md" required>
                        <option value="">-- Select Student to Visit --</option>
                        {boarders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} placeholder="Relation to Student (e.g., Mother)" className="w-full rounded-md" required />
                    <div className="flex items-center gap-2">
                        <input id="idChecked" type="checkbox" checked={formData.idChecked} onChange={e => setFormData({...formData, idChecked: e.target.checked})} className="rounded" disabled={settings?.idRequiredForVisitors} />
                        <label htmlFor="idChecked">Photo ID Checked {settings?.idRequiredForVisitors && '(Mandatory)'}</label>
                    </div>
                </div>
                 <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Check In'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default HostelVisitorModal;
