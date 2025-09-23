import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import * as settingsService from '../../../lib/settingsService';
import type { Holiday } from '../../../types';

const CalendarPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });

    const fetchData = useCallback(() => {
        setLoading(true);
        settingsService.listHolidays()
            .then(setHolidays)
            .catch(() => addToast('Failed to load holidays.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHoliday.name || !newHoliday.date || !user) return;
        try {
            await settingsService.addHoliday(newHoliday, user);
            addToast('Holiday added.', 'success');
            setNewHoliday({ name: '', date: '' });
            fetchData();
        } catch {
            addToast('Failed to add holiday.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        try {
            await settingsService.deleteHoliday(id, user);
            addToast('Holiday deleted.', 'success');
            fetchData();
        } catch {
            addToast('Failed to delete holiday.', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Calendars & Holidays</h2>
            <p className="text-sm text-gray-500">Manage public holidays and term dates. This will affect attendance registers and other date-sensitive modules.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                    <h3 className="font-semibold mb-2">Add Holiday</h3>
                    <form onSubmit={handleAdd} className="space-y-2 p-4 border rounded-md bg-gray-50">
                        <input value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} placeholder="Holiday Name" className="w-full rounded-md" required />
                        <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })} className="w-full rounded-md" required />
                        <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md">Add</button>
                    </form>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Upcoming Holidays</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="space-y-2">
                            {holidays.map(hol => (
                                <li key={hol.id} className="flex justify-between items-center p-2 border rounded-md">
                                    <div>
                                        <p className="font-medium">{hol.name}</p>
                                        <p className="text-sm text-gray-500">{hol.date}</p>
                                    </div>
                                    <button onClick={() => handleDelete(hol.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
