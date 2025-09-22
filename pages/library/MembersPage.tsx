import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as libraryService from '../../lib/libraryService';
import type { PotentialMember } from '../../types';
import MemberProfileDrawer from '../../components/library/MemberProfileDrawer';

const MembersPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [members, setMembers] = useState<PotentialMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        libraryService.listPotentialMembers()
            .then(setMembers)
            .catch(() => addToast('Failed to load members.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEnroll = async (member: PotentialMember) => {
        if (!user) return;
        try {
            await libraryService.enrollMember(member.id, member.type, member.name, user);
            addToast(`${member.name} has been enrolled in the library.`, 'success');
            fetchData();
        } catch (err: any) {
            addToast(err.message || 'Enrollment failed.', 'error');
        }
    };

    const handleViewProfile = (memberId: string) => {
        setSelectedMemberId(memberId);
    };

    const filteredMembers = useMemo(() => {
        if (filter === 'all') return members;
        if (filter === 'members') return members.filter(m => m.isMember);
        if (filter === 'non_members') return members.filter(m => !m.isMember);
        return members;
    }, [members, filter]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Library Members</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-md">
                    <option value="all">All People</option>
                    <option value="members">Library Members</option>
                    <option value="non_members">Not Members</option>
                </select>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Name</th>
                        <th className="p-3 text-left text-xs uppercase">Role</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        filteredMembers.map(m => (
                            <tr key={m.id}>
                                <td className="p-3 font-medium">{m.name}</td>
                                <td className="p-3 text-sm">{m.type}</td>
                                <td className="p-3 text-sm">
                                    <span className={`px-2 py-1 text-xs rounded-full ${m.isMember ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                        {m.isMember ? 'Member' : 'Not a Member'}
                                    </span>
                                </td>
                                <td className="p-3 text-right text-sm">
                                    {m.isMember ? (
                                        <button onClick={() => handleViewProfile(m.id)} className="font-medium text-indigo-600 hover:underline">View Profile</button>
                                    ) : (
                                        <button onClick={() => handleEnroll(m)} className="font-medium text-blue-600 hover:underline">Enroll</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <MemberProfileDrawer
                memberId={selectedMemberId}
                isOpen={!!selectedMemberId}
                onClose={() => setSelectedMemberId(null)}
            />
        </div>
    );
};

export default MembersPage;