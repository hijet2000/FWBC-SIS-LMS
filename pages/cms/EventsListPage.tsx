
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listEvents } from '../../lib/cmsService';
import EventModal from '../../components/cms/EventModal';

const EventsListPage: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const fetchData = () => {
        listEvents().then(setEvents).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (event: any = null) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Events</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md">New Event</button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                {loading ? <p>Loading...</p> : events.map(event => (
                    <div key={event.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-sm text-gray-500">{new Date(event.startDate).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleOpenModal(event)}>Edit</button>
                    </div>
                ))}
            </div>

            {user && <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingEvent} actor={user} />}
        </div>
    );
};

export default EventsListPage;
