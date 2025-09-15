import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../../types';
import { createVehicle, updateVehicle } from '../../lib/transportService';
import Modal from '../ui/Modal';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (message: string) => void;
  initialData: Vehicle | null;
}

const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    regNo: '', make: '', model: '', capacity: 0, active: true, notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        regNo: initialData?.regNo || '',
        make: initialData?.make || '',
        model: initialData?.model || '',
        capacity: initialData?.capacity || 0,
        active: initialData?.active ?? true,
        notes: initialData?.notes || '',
      });
      setErrors({});
    }
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.regNo.trim()) newErrors.regNo = 'Registration number is required.';
    if (formData.capacity < 0) newErrors.capacity = 'Capacity cannot be negative.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    const payload = {
        ...formData,
        capacity: Number(formData.capacity) || undefined,
    };
    try {
      if (initialData) {
        await updateVehicle('site_123', initialData.id, payload);
        onSaveSuccess('Vehicle updated successfully.');
      } else {
        await createVehicle('site_123', payload);
        onSaveSuccess('Vehicle created successfully.');
      }
    } catch {
      setErrors({ form: 'An error occurred. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Vehicle' : 'Add New Vehicle'}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
          <div>
            <label htmlFor="regNo" className="block text-sm font-medium text-gray-700">Registration Number</label>
            <input type="text" id="regNo" value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value.toUpperCase()})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
            {errors.regNo && <p className="mt-1 text-sm text-red-600">{errors.regNo}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700">Make</label>
                <input type="text" id="make" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
            </div>
            <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
                <input type="text" id="model" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
            </div>
          </div>
           <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
            <input type="number" id="capacity" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
             {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
          <div className="flex items-center">
            <input id="active" type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-indigo-600"/>
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Vehicle'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleModal;
