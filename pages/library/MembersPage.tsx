import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { listMembers } from '../../lib/libraryService';
import type { LibraryMember } from '../../types';

const MembersPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { addToast } = useToast();

    const [members, setMembers] = useState<LibraryMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        listMembers()
            .then(setMembers)
            .catch(() => addToast('Failed to load library members.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    const filteredMembers = useMemo(() => {
        if (!searchTerm) return members;
        const q = searchTerm.toLowerCase();
        return members.filter(m => m.name.toLowerCase().includes(q) || m.barcode.toLowerCase().includes(q));
    }, [members, searchTerm]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Library Members</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                 <input 
                    type="search" 
                    placeholder="Search by name or barcode..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 rounded-md border-gray-300"
                />
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                     <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Name</th>
                        <th className="p-3 text-left text-xs uppercase">Barcode</th>
                        <th className="p-3 text-left text-xs uppercase">Type</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading members...</td></tr> :
                        filteredMembers.map(member => (
                            <tr key={member.id}>
                                <td className="p-3 font-medium">{member.name}</td>
                                <td className="p-3 text-sm font-mono">{member.barcode}</td>
                                <td className="p-3 text-sm">{member.memberType}</td>
                                <td className="p-3 text-right text-sm">
                                    <Link to={`/school/${siteId}/library/members/${member.id}`} className="text-indigo-600 hover:underline">View Profile</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MembersPage;