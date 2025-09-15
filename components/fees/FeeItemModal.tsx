import React, { useState, useEffect } from 'react';
import type { FeeItem, FeeFrequency } from '../../types';
import { createFeeItem, updateFeeItem } from '../../lib/feesService';
import Modal from '../ui/Modal';

interface FeeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (message: string) => void;
  initialData: FeeItem | null;
}

const FeeItemModal: React.FC<FeeItemModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    frequency: 'Once' as FeeFrequency,
    code: '',
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFormData({
            name: initialData?.name || '',
            amount: initialData?.amount || 0,
            frequency: initialData?.frequency || 'Once',
            code: initialData?.code || '',
            active: initialData?.active ?? true,
        });
        setErrors({});
    }
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (formData.amount <= 0) newErrors.amount = 'Amount must be positive.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
          name: formData.name,
          amount: Number(formData.amount),
          frequency: formData.frequency,
          code: formData.code,
          active: formData.active
      };
      if (initialData) {
        await updateFeeItem(initialData.id, payload);
        onSaveSuccess('Fee item updated successfully.');
      } else {
        await createFeeItem(payload);
        onSaveSuccess('Fee item created successfully.');
      }
    } catch {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Fee Item' : 'Add New Fee Item'}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (£)</label>
                <input type="number" id="amount" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>
               <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
                <select id="frequency" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as FeeFrequency})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    {(['Once', 'Monthly', 'Termly', 'Annually'] as FeeFrequency[]).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
          </div>
            
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code (Optional)</label>
            <input type="text" id="code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          
           <div className="flex items-center">
                <input id="active" type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
            {isSaving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeeItemModal;
