import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as alumniService from '../../lib/alumniService';
import type { AlumniEvent } from '../../types';

const AlumniEventsPage: React.FC = () => {
    const { addToast } = useToast();
    const [events, setEvents] = useState<AlumniEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        alumniService.listAlumniEvents()
            .then(setEvents)
            .catch(() => addToast('Failed to load events.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Alumni Events</h1>
                <button className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Create Event</button>
            </div>

            <div className="space-y-4">
                {loading ? <p>Loading events...</p> :
                events.map(event => (
                    <div key={event.id} className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold">{event.title}</h2>
                        <p className="text-sm text-gray-600">{new Date(event.date).toLocaleString()} @ {event.location}</p>
                        <p className="text-sm mt-2">{event.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlumniEventsPage;
