
import React, { useState, useEffect } from 'react';
import type { User, Event } from '../../types';
import { saveEvent } from '../../lib/cmsService';
import Modal from '../ui/Modal';

const EventModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: () => void, initialData: Event | null, actor: User }> = ({ isOpen, onClose, onSave, initialData, actor }) => {
    const [event, setEvent] = useState({ title: '', description: '', startDate: '', endDate: '', location: '', isAllDay: false });

    useEffect(() => {
        if (initialData) {
            setEvent({
                title: initialData.title || '',
                description: initialData.description || '',
                // Input type datetime-local needs format YYYY-MM-DDTHH:mm
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().substring(0, 16) : '',
                endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().substring(0, 16) : '',
                location: initialData.location || '',
                isAllDay: initialData.isAllDay || false,
            });
        } else {
             setEvent({ title: '', description: '', startDate: '', endDate: '', location: '', isAllDay: false });
        }
    }, [initialData, isOpen]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...event,
            startDate: event.isAllDay ? event.startDate.split('T')[0] : new Date(event.startDate).toISOString(),
            endDate: event.isAllDay || !event.endDate ? undefined : new Date(event.endDate).toISOString(),
        };
        await saveEvent({ id: initialData?.id, ...payload }, actor);
        onSave();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Event' : 'New Event'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <input value={event.title} onChange={e => setEvent({...event, title: e.target.value})} placeholder="Event Title" className="w-full rounded-md border-gray-300" required/>
                    <textarea value={event.description} onChange={e => setEvent({...event, description: e.target.value})} placeholder="Description" className="w-full rounded-md border-gray-300" rows={3}/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type={event.isAllDay ? 'date' : 'datetime-local'} value={event.startDate} onChange={e => setEvent({...event, startDate: e.target.value})} className="w-full rounded-md border-gray-300" />
                        <input type={event.isAllDay ? 'date' : 'datetime-local'} value={event.endDate} onChange={e => setEvent({...event, endDate: e.target.value})} className="w-full rounded-md border-gray-300" disabled={event.isAllDay} />
                    </div>
                     <div className="flex items-center gap-2">
                        <input type="checkbox" id="allDay" checked={event.isAllDay} onChange={e => setEvent({...event, isAllDay: e.target.checked, endDate: ''})} className="rounded"/>
                        <label htmlFor="allDay">All-day event</label>
                    </div>
                    <input value={event.location} onChange={e => setEvent({...event, location: e.target.value})} placeholder="Location" className="w-full rounded-md border-gray-300" />
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Event</button>
                </div>
            </form>
        </Modal>
    );
};

export default EventModal;
