import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import type { User } from '../../types';
import { logAuditEvent } from '../../lib/auditService';

const PRESETS = {
    default: { 
        name: 'Default', 
        scopes: [
            'sis:admin', 'school:admin', 'sis:students:read', 
            'sis:academics:read', 'sis:attendance:write', 
            'sis:library:read', 'lms:admin', 'lms:courses:write',
            'homework:teacher', 'homework:student', 'homework:parent'
        ]
    },
    full: { name: 'Full Admin', scopes: ['school:admin', 'lms:admin', 'homework:teacher', 'admissions:admin', 'frontoffice:admin', 'sis:library:write', 'sis:hostel:write', 'alumni:admin'] },
    sis: { name: 'SIS-Only Admin', scopes: ['school:admin', 'homework:teacher'] },
    lms: { name: 'LMS-Only Admin', scopes: ['lms:admin'] },
    student: { name: 'Student', scopes: ['student', 'homework:student'] },
    parent: { name: 'Parent', scopes: ['homework:parent'], studentId: 's01' },
    alumnus: { name: 'Alumnus', scopes: ['alumni:portal:self'], alumniId: 's01' },
};

const ScopeSwitcher: React.FC = () => {
    const { user, setUser } = useAuth();
    const [originalUser, setOriginalUser] = useState<User | null>(null);
    const [isInitialAdmin, setIsInitialAdmin] = useState(false);

    useEffect(() => {
        if (user && !originalUser) {
            setOriginalUser(user);
            // Show switcher only if the original logged-in user is an admin
            if (user.scopes.some(s => s.includes('admin'))) {
                setIsInitialAdmin(true);
            }
        }
    }, [user, originalUser]);

    const handleScopeChange = (presetKey: keyof typeof PRESETS) => {
        if (!user || !setUser) return;

        const oldScopes = user.scopes;
        let newUserState: User;
        const preset = PRESETS[presetKey];

        if (presetKey === 'default' && originalUser) {
            newUserState = originalUser;
        } else {
             const newScopes = preset.scopes;
             newUserState = { 
                 ...user, 
                 scopes: newScopes, 
                 studentId: (preset as any).studentId,
                 alumniId: (preset as any).alumniId 
            };
        }
        
        setUser(newUserState);

        // Instrumentation
        logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'ROLE_CHANGE',
            module: 'AUTH',
            entityType: 'USER',
            entityId: user.id,
            entityDisplay: user.name,
            before: { scopes: oldScopes },
            after: { scopes: newUserState.scopes },
            meta: { context: 'Dev Scope Switcher' }
        });
    };

    if (!isInitialAdmin || !user) {
        return null;
    }
    
    const currentPresetKey = Object.keys(PRESETS).find(key => {
        const presetScopes = PRESETS[key as keyof typeof PRESETS].scopes;
        return presetScopes.length === user.scopes.length && presetScopes.every(scope => user.scopes.includes(scope));
    }) || 'custom';

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="scope-switcher" className="text-xs font-bold text-gray-600 uppercase">
                Scope
            </label>
            <select 
                id="scope-switcher"
                value={currentPresetKey}
                onChange={(e) => handleScopeChange(e.target.value as keyof typeof PRESETS)}
                className="block w-full rounded-md border-gray-300 py-1.5 pl-2 pr-8 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                aria-label="Switch user scope preset"
            >
                {originalUser && <option value="default">Default</option>}
                <option value="full">{PRESETS.full.name}</option>
                <option value="sis">{PRESETS.sis.name}</option>
                <option value="lms">{PRESETS.lms.name}</option>
                <option value="student">{PRESETS.student.name}</option>
                <option value="parent">{PRESETS.parent.name}</option>
                <option value="alumnus">{PRESETS.alumnus.name}</option>
                {currentPresetKey === 'custom' && <option value="custom" disabled>Custom</option>}
            </select>
        </div>
    );
};

export default ScopeSwitcher;
