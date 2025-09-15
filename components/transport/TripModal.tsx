import React, { useState, useEffect } from 'react';
import type { Trip, Vehicle, Driver, TransportRoute } from '../../types';
import { createTrip, updateTrip } from '../../lib/transportService';
import Modal from '../ui/Modal';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (message: string) => void;
  initialData: Trip | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: TransportRoute[];
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const TripModal: React.FC<TripModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, vehicles, drivers, routes }) => {
  const [formData, setFormData] = useState({
    date: getTodayDateString(), vehicleId: '', driverId: '', routeId: '', startTime: '', endTime: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: initialData?.date || getTodayDateString(),
        vehicleId: initialData?.vehicleId || '',
        driverId: initialData?.driverId || '',
        routeId: initialData?.routeId || '',
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
      });
      setErrors({});
    }
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = 'Date is required.';
    if (!formData.vehicleId) newErrors.vehicleId = 'Vehicle is required.';
    if (!formData.driverId) newErrors.driverId = 'Driver is required.';
    if (!formData.routeId) newErrors.routeId = 'Route is required.';
    if (formData.startTime && formData.endTime && formData.endTime < formData.startTime) {
      newErrors.endTime = 'End time cannot be before start time.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    const { date, vehicleId, driverId, routeId, startTime, endTime } = formData;
    const payload = { date, vehicleId, driverId, routeId, startTime: startTime || undefined, endTime: endTime || undefined };
    try {
      if (initialData) {
        await updateTrip('site_123', initialData.id, payload);
        onSaveSuccess('Trip updated successfully.');
      } else {
        await createTrip('site_123', payload);
        onSaveSuccess('Trip created successfully.');
      }
    } catch {
      setErrors({ form: 'An error occurred. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const activeVehicles = vehicles.filter(v => v.active || v.id === initialData?.vehicleId);
  const activeDrivers = drivers.filter(d => d.active || d.id === initialData?.driverId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Trip' : 'Add New Trip'}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" id="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700">Vehicle</label>
                <select id="vehicleId" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="">Select Vehicle</option>{activeVehicles.map(v => <option key={v.id} value={v.id}>{v.regNo}</option>)}</select>
                {errors.vehicleId && <p className="mt-1 text-sm text-red-600">{errors.vehicleId}</p>}
            </div>
             <div>
                <label htmlFor="driverId" className="block text-sm font-medium text-gray-700">Driver</label>
                <select id="driverId" value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="">Select Driver</option>{activeDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                {errors.driverId && <p className="mt-1 text-sm text-red-600">{errors.driverId}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="routeId" className="block text-sm font-medium text-gray-700">Route</label>
            <select id="routeId" value={formData.routeId} onChange={e => setFormData({...formData, routeId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="">Select Route</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
            {errors.routeId && <p className="mt-1 text-sm text-red-600">{errors.routeId}</p>}
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                <input type="time" id="startTime" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
            </div>
            <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                <input type="time" id="endTime" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                 {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Trip'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default TripModal;
