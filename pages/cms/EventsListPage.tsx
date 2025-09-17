
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listEvents } from '../../lib/cmsService';
import EventModal from '../../components/cms/EventModal';
import { Event } from '../../types';

const EventsListPage: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const fetchData = () => {
        listEvents().then(setEvents).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (event: Event | null = null) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Events</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">New Event</button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border">
                 <ul className="divide-y divide-gray-200">
                {loading ? <li className="p-4 text-center">Loading...</li> : events.map(event => (
                    <li key={event.id} className="flex justify-between items-center p-4">
                        <div>
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-sm text-gray-500">{new Date(event.startDate).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleOpenModal(event)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                    </div>
                ))}
                </ul>
            </div>

            {user && <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingEvent} actor={user} />}
        </div>
    );
};

export default EventsListPage;
