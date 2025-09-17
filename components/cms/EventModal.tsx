
import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { saveEvent } from '../../lib/cmsService';
import Modal from '../ui/Modal';

const EventModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: () => void, initialData: any, actor: User }> = ({ isOpen, onClose, onSave, initialData, actor }) => {
    const [event, setEvent] = useState({ title: '', description: '', startDate: '', endDate: '', location: '', isAllDay: false });

    useEffect(() => {
        if (initialData) {
            setEvent({
                title: initialData.title || '',
                description: initialData.description || '',
                startDate: initialData.startDate?.substring(0, 16) || '',
                endDate: initialData.endDate?.substring(0, 16) || '',
                location: initialData.location || '',
                isAllDay: initialData.isAllDay || false,
            });
        } else {
             setEvent({ title: '', description: '', startDate: '', endDate: '', location: '', isAllDay: false });
        }
    }, [initialData, isOpen]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveEvent({ id: initialData?.id, ...event }, actor);
        onSave();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Event' : 'New Event'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <input value={event.title} onChange={e => setEvent({...event, title: e.target.value})} placeholder="Event Title" className="w-full" required/>
                    <textarea value={event.description} onChange={e => setEvent({...event, description: e.target.value})} placeholder="Description" className="w-full" rows={3}/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type={event.isAllDay ? 'date' : 'datetime-local'} value={event.startDate} onChange={e => setEvent({...event, startDate: e.target.value})} className="w-full" />
                        <input type={event.isAllDay ? 'date' : 'datetime-local'} value={event.endDate} onChange={e => setEvent({...event, endDate: e.target.value})} className="w-full" disabled={event.isAllDay} />
                    </div>
                     <div className="flex items-center gap-2">
                        <input type="checkbox" id="allDay" checked={event.isAllDay} onChange={e => setEvent({...event, isAllDay: e.target.checked, endDate: ''})} />
                        <label htmlFor="allDay">All-day event</label>
                    </div>
                    <input value={event.location} onChange={e => setEvent({...event, location: e.target.value})} placeholder="Location" className="w-full" />
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Event</button>
                </div>
            </form>
        </Modal>
    );
};

export default EventModal;
