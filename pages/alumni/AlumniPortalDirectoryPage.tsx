import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as alumniService from '../../lib/alumniService';
import type { Alumni } from '../../types';

const AlumniCard: React.FC<{ alumnus: Partial<Alumni> }> = ({ alumnus }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-bold text-lg">{alumnus.name}</h3>
        <p className="text-sm text-gray-600">Class of {alumnus.graduationYear}</p>
        {(alumnus.profession || alumnus.company) && (
             <p className="text-sm text-gray-800 mt-2">{alumnus.profession} at {alumnus.company}</p>
        )}
        {alumnus.contact && (
            <div className="mt-2 text-xs">
                {alumnus.contact.email && <a href={`mailto:${alumnus.contact.email}`} className="text-indigo-600">Email</a>}
                {alumnus.contact.linkedin && <a href={alumnus.contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-600 ml-2">LinkedIn</a>}
            </div>
        )}
    </div>
);

const AlumniPortalDirectoryPage: React.FC = () => {
    const { addToast } = useToast();
    const [alumni, setAlumni] = useState<Partial<Alumni>[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchData = useCallback(() => {
        setLoading(true);
        // `true` enforces privacy rules for this public-facing directory
        alumniService.listAlumni(true) 
            .then(setAlumni)
            .catch(() => addToast('Failed to load directory.', 'error'))
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
            <h1 className="text-3xl font-bold text-gray-800">Alumni Directory</h1>
            <input 
                type="search" 
                value={filter} 
                onChange={e => setFilter(e.target.value)}
                placeholder="Search by name, year, profession..."
                className="w-full p-2 border rounded-md"
            />
            {loading ? <p>Loading directory...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAlumni.map(alum => <AlumniCard key={alum.id} alumnus={alum} />)}
                </div>
            )}
        </div>
    );
};

export default AlumniPortalDirectoryPage;
