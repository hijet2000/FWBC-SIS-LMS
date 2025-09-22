import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as alumniService from '../../lib/alumniService';
import type { Alumni } from '../../types';

const AlumniProfilePage: React.FC = () => {
    const { alumniId } = useParams<{ alumniId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [profile, setProfile] = useState<Alumni | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = useCallback(() => {
        if (!alumniId) return;
        setLoading(true);
        alumniService.getAlumniProfile(alumniId)
            .then(setProfile)
            .catch(() => addToast('Failed to load profile.', 'error'))
            .finally(() => setLoading(false));
    }, [alumniId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !user) return;
        try {
            await alumniService.updateAlumniProfile(profile.id, profile, user);
            addToast('Profile updated!', 'success');
            setIsEditing(false);
            fetchData();
        } catch {
            addToast('Failed to update profile.', 'error');
        }
    };
    
    const handleFieldChange = (section: 'contact' | 'privacy' | null, field: string, value: any) => {
        setProfile(p => {
            if (!p) return null;
            if (section) {
                return { ...p, [section]: { ...p[section], [field]: value } };
            }
            return { ...p, [field]: value };
        });
    };

    if (loading) return <p>Loading profile...</p>;
    if (!profile) return <p>Profile not found.</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSave}>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">{profile.name}</h1>
                            <p className="text-gray-600">Class of {profile.graduationYear}</p>
                        </div>
                        {!isEditing && <button type="button" onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md">Edit Profile</button>}
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Professional Info */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Professional Information</h3>
                            <div className="space-y-3">
                                <input disabled={!isEditing} value={profile.profession || ''} onChange={e => handleFieldChange(null, 'profession', e.target.value)} placeholder="Profession" className="w-full p-2 border rounded-md disabled:bg-gray-100" />
                                <input disabled={!isEditing} value={profile.company || ''} onChange={e => handleFieldChange(null, 'company', e.target.value)} placeholder="Company" className="w-full p-2 border rounded-md disabled:bg-gray-100" />
                                <input disabled={!isEditing} value={profile.contact.linkedin || ''} onChange={e => handleFieldChange('contact', 'linkedin', e.target.value)} placeholder="LinkedIn Profile URL" className="w-full p-2 border rounded-md disabled:bg-gray-100" />
                            </div>
                        </div>

                        {/* Contact & Privacy */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Contact & Privacy</h3>
                            <div className="space-y-3">
                                <input disabled value={profile.contact.email} className="w-full p-2 border rounded-md bg-gray-100" title="Contact admin to change primary email" />
                                <input disabled={!isEditing} value={profile.contact.phone || ''} onChange={e => handleFieldChange('contact', 'phone', e.target.value)} placeholder="Phone Number" className="w-full p-2 border rounded-md disabled:bg-gray-100" />
                                
                                <div className="pt-2 border-t">
                                    <label className="flex items-center"><input type="checkbox" checked={profile.privacy.profilePublic} onChange={e => handleFieldChange('privacy', 'profilePublic', e.target.checked)} disabled={!isEditing} className="mr-2" /> Show my profile in the alumni directory</label>
                                    <label className="flex items-center"><input type="checkbox" checked={profile.privacy.contactPublic} onChange={e => handleFieldChange('privacy', 'contactPublic', e.target.checked)} disabled={!isEditing} className="mr-2" /> Allow other alumni to see my contact details</label>
                                    <label className="flex items-center"><input type="checkbox" checked={profile.privacy.mentorshipOptIn} onChange={e => handleFieldChange('privacy', 'mentorshipOptIn', e.target.checked)} disabled={!isEditing} className="mr-2" /> I'm open to mentoring current students</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {isEditing && (
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => { setIsEditing(false); fetchData(); }} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm text-white bg-green-600 rounded-md">Save Changes</button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AlumniProfilePage;
