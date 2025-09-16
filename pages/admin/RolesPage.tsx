import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as rolesService from '../../lib/rolesService';
import type { Role, PermissionGroup } from '../../types';

const RolesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [modifiedScopes, setModifiedScopes] = useState<Set<string> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([rolesService.listRoles(), rolesService.listPermissions()])
            .then(([roleData, permissionData]) => {
                setRoles(roleData);
                setPermissions(permissionData);
                if (!selectedRole && roleData.length > 0) {
                    setSelectedRole(roleData[0]);
                } else if (selectedRole) {
                    // Refresh selected role data
                    setSelectedRole(roleData.find(r => r.id === selectedRole.id) || null);
                }
            })
            .catch(() => addToast('Failed to load roles and permissions.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast, selectedRole]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedRole) {
            setModifiedScopes(new Set(selectedRole.scopes));
        } else {
            setModifiedScopes(null);
        }
    }, [selectedRole]);
    
    const handleScopeChange = (scope: string, checked: boolean) => {
        if (!modifiedScopes) return;
        const newScopes = new Set(modifiedScopes);
        if (checked) {
            newScopes.add(scope);
        } else {
            newScopes.delete(scope);
        }
        setModifiedScopes(newScopes);
    };
    
    const handleSaveChanges = async () => {
        if (!selectedRole || !modifiedScopes || !user) return;
        setIsSaving(true);
        try {
            await rolesService.updateRole(selectedRole.id, Array.from(modifiedScopes), user);
            addToast('Role updated successfully.', 'success');
            fetchData(); // Refetch to get the latest state
        } catch {
             addToast('Failed to save changes.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const hasChanges = useMemo(() => {
        if (!selectedRole || !modifiedScopes) return false;
        if (selectedRole.scopes.length !== modifiedScopes.size) return true;
        for (const scope of selectedRole.scopes) {
            if (!modifiedScopes.has(scope)) return true;
        }
        return false;
    }, [selectedRole, modifiedScopes]);

    if (loading && roles.length === 0) {
        return <div className="text-center p-8">Loading roles...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-120px)]">
            {/* Left: Role List */}
            <aside className="w-1/4 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Roles</h2>
                <nav className="space-y-1">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-left p-3 rounded-md text-sm ${selectedRole?.id === role.id ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'hover:bg-gray-100'}`}
                        >
                            <p>{role.name}</p>
                            <p className={`text-xs ${selectedRole?.id === role.id ? 'text-indigo-600' : 'text-gray-500'}`}>{role.description}</p>
                        </button>
                    ))}
                </nav>
            </aside>
            
            {/* Right: Permission Details */}
            <main className="w-3/4 flex flex-col">
                {selectedRole && modifiedScopes ? (
                    <>
                        <div className="p-6 border-b border-gray-200">
                             <h1 className="text-2xl font-bold text-gray-800">{selectedRole.name}</h1>
                             <p className="text-sm text-gray-500 mt-1">{selectedRole.description}</p>
                        </div>
                        <div className="flex-grow p-6 overflow-y-auto space-y-6">
                           {permissions.map(group => (
                               <div key={group.module}>
                                   <h3 className="text-md font-semibold text-gray-600 uppercase tracking-wider border-b pb-2 mb-3">{group.module}</h3>
                                   <div className="space-y-3">
                                       {group.permissions.map(perm => (
                                           <div key={perm.scope} className="flex items-start">
                                               <input
                                                   type="checkbox"
                                                   id={perm.scope}
                                                   checked={modifiedScopes.has(perm.scope)}
                                                   onChange={e => handleScopeChange(perm.scope, e.target.checked)}
                                                   className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                                               />
                                               <label htmlFor={perm.scope} className="ml-3 text-sm">
                                                   <span className="font-medium text-gray-800">{perm.label}</span>
                                                   <span className="block text-gray-500">{perm.description}</span>
                                               </label>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           ))}
                        </div>
                        {hasChanges && (
                            <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-gray-500">
                        <p>Select a role to view its permissions.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RolesPage;
