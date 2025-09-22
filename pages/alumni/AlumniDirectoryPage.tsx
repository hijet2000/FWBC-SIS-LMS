import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as alumniService from '../../lib/alumniService';
import type { Alumni } from '../../types';

const AlumniDirectoryPage: React.FC = () => {
    const { addToast } = useToast();
    const [alumni, setAlumni] = useState<Partial<Alumni>[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchData = useCallback(() => {
        setLoading(true);
        alumniService.listAlumni(false) // Get all alumni for admin view
            .then(setAlumni)
            .catch(() => addToast('Failed to load alumni data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredAlumni = useMemo(() => {
        const q = filter.toLowerCase();
        if (!q) return alumni;
        return alumni.filter(a =>
            a.name?.toLowerCase().includes(q) ||
            a.graduationYear?.toString().includes(q) ||
            a.profession?.toLowerCase().includes(q) ||
            a.company?.toLowerCase().includes(q)
        );
    }, [alumni, filter]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Alumni Directory (Admin View)</h1>
            <input 
                type="search" 
                value={filter} 
                onChange={e => setFilter(e.target.value)}
                placeholder="Search by name, year, profession..."
                className="w-full p-2 border rounded-md"
            />

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Name</th>
                            <th className="p-3 text-left text-xs uppercase">Graduation Year</th>
                            <th className="p-3 text-left text-xs uppercase">Profession</th>
                            <th className="p-3 text-left text-xs uppercase">Contact Email</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        filteredAlumni.map(alum => (
                            <tr key={alum.id}>
                                <td className="p-3 font-medium">{alum.name}</td>
                                <td className="p-3 text-sm">{alum.graduationYear}</td>
                                <td className="p-3 text-sm">{alum.profession} at {alum.company}</td>
                                <td className="p-3 text-sm text-indigo-600">{alum.contact?.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AlumniDirectoryPage;
