import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as rolesService from '../../lib/rolesService';
import type { Role, PermissionGroup } from '../../types';

const RolesPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([rolesService.listRoles(), rolesService.listPermissions()])
      .then(([rolesData, permsData]) => {
        setRoles(rolesData);
        setPermissions(permsData);
        if (rolesData.length > 0) {
          setSelectedRole(JSON.parse(JSON.stringify(rolesData[0]))); // Deep copy for editing
        }
      })
      .catch(() => addToast('Failed to load roles and permissions.', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  const handleRoleSelect = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setSelectedRole(JSON.parse(JSON.stringify(role)));
    }
  };

  const handleScopeToggle = (scope: string) => {
    if (!selectedRole) return;
    setSelectedRole(prev => {
      if (!prev) return null;
      const newScopes = prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope];
      return { ...prev, scopes: newScopes };
    });
  };

  const handleSave = async () => {
    if (!selectedRole || !user) return;
    try {
        await rolesService.updateRole(selectedRole.id, selectedRole.scopes, user);
        addToast('Role updated successfully!', 'success');
        // Refetch roles to get the updated state
        rolesService.listRoles().then(setRoles);
    } catch {
        addToast('Failed to save role.', 'error');
    }
  };
  
  const isDirty = useMemo(() => {
      const originalRole = roles.find(r => r.id === selectedRole?.id);
      if (!originalRole || !selectedRole) return false;
      return JSON.stringify(originalRole.scopes.sort()) !== JSON.stringify(selectedRole.scopes.sort());
  }, [roles, selectedRole]);


  if (loading) return <p>Loading roles and permissions...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Roles & Permissions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-2">Roles</h2>
            <ul className="space-y-1">
              {roles.map(role => (
                <li key={role.id}>
                  <button
                    onClick={() => handleRoleSelect(role.id)}
                    className={`w-full text-left p-2 rounded-md text-sm ${selectedRole?.id === role.id ? 'bg-indigo-100 text-indigo-800 font-bold' : 'hover:bg-gray-50'}`}
                  >
                    {role.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="md:col-span-3">
          {selectedRole && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">{selectedRole.name}</h2>
                    <p className="text-sm text-gray-500">{selectedRole.description}</p>
                </div>
                <button onClick={handleSave} disabled={!isDirty} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm disabled:bg-gray-400">
                    {isDirty ? 'Save Changes' : 'Saved'}
                </button>
              </div>
              
              <div className="mt-6 space-y-4">
                {permissions.map(group => (
                  <div key={group.module}>
                    <h3 className="font-semibold text-gray-700 border-b pb-1 mb-2">{group.module}</h3>
                    <div className="space-y-2">
                      {group.permissions.map(perm => (
                        <div key={perm.scope} className="flex items-start p-2 rounded-md hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={perm.scope}
                            checked={selectedRole.scopes.includes(perm.scope)}
                            onChange={() => handleScopeToggle(perm.scope)}
                            className="h-4 w-4 mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor={perm.scope} className="ml-3">
                            <p className="font-medium text-sm">{perm.label} <code className="text-xs bg-gray-100 p-1 rounded">{perm.scope}</code></p>
                            <p className="text-xs text-gray-500">{perm.description}</p>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolesPage;
