import type { Role, PermissionGroup, User } from '../types';
import { logAuditEvent } from './auditService';

// --- MOCK DATA ---
let MOCK_ROLES: Role[] = [
    { 
        id: 'admin', 
        name: 'Administrator', 
        description: 'Has full access to all system modules and settings.',
        scopes: ['school:admin', 'lms:admin', 'admissions:admin', 'frontoffice:admin', 'homework:teacher']
    },
    { 
        id: 'head', 
        name: 'Head Teacher / SLT', 
        description: 'Can view all school data and manage academic settings.',
        scopes: ['school:admin', 'sis:students:read', 'sis:academics:read', 'sis:attendance:write', 'homework:teacher']
    },
    { 
        id: 'teacher', 
        name: 'Teacher', 
        description: 'Manages homework for their classes and takes attendance.',
        scopes: ['homework:teacher', 'sis:attendance:write', 'sis:students:read', 'sis:library:read']
    },
    { 
        id: 'student', 
        name: 'Student', 
        description: 'Can view and submit homework, and access the digital library.',
        scopes: ['homework:student', 'student', 'sis:library:read']
    },
     { 
        id: 'parent', 
        name: 'Parent', 
        description: 'Read-only view of their child\'s progress and school information.',
        scopes: ['portal:parent'] // Scope for a separate portal
    },
    { 
        id: 'admissions', 
        name: 'Admissions Officer', 
        description: 'Manages the entire student application and admissions process.',
        scopes: ['admissions:admin', 'frontoffice:admin']
    },
    {
        id: 'frontoffice',
        name: 'Front Office Staff',
        description: 'Manages visitors, calls, and enquiries.',
        scopes: ['frontoffice:admin']
    }
];

const PERMISSIONS_CONFIG: PermissionGroup[] = [
    {
        module: "System Administration",
        permissions: [
            { scope: 'school:admin', label: 'Full System Access', description: 'Grants access to all administrative features, including user management, billing, and system settings.' },
        ]
    },
    {
        module: "Student Information System (SIS)",
        permissions: [
            { scope: 'sis:students:read', label: 'View Student Profiles', description: 'Allows viewing of student demographic, contact, and academic information.' },
            { scope: 'sis:students:write', label: 'Edit Student Profiles', description: 'Allows editing student records, including contact and address details.' },
            { scope: 'sis:academics:read', label: 'View Academic Records', description: 'Grants access to gradebooks, report cards, and subject mappings.' },
            { scope: 'sis:academics:write', label: 'Manage Academic Records', description: 'Allows creation and modification of subjects, grades, and timetables.' },
        ]
    },
    {
        module: "Attendance",
        permissions: [
            { scope: 'sis:attendance:read', label: 'View Attendance Reports', description: 'Allows viewing and exporting of historical attendance data.' },
            { scope: 'sis:attendance:write', label: 'Take Daily Attendance', description: 'Grants permission to submit the daily attendance register for a class.' },
        ]
    },
    {
        module: "Learning Management (LMS)",
        permissions: [
            { scope: 'lms:admin', label: 'Full LMS Administration', description: 'Allows management of all LMS features, including courses and the digital library.' },
            { scope: 'lms:courses:write', label: 'Manage Courses', description: 'Allows creation and management of course content and structure.' },
            { scope: 'sis:library:read', label: 'Access Digital Library', description: 'Grants access to view and consume content in the digital library.' },
            { scope: 'student', label: 'Student LMS Access', description: 'Base permission for students to access LMS content like Catch-Up classes.' },
        ]
    },
    {
        module: "Homework",
        permissions: [
            { scope: 'homework:teacher', label: 'Manage Homework (Teacher)', description: 'Allows assigning homework, viewing submissions, and providing feedback.' },
            { scope: 'homework:student', label: 'Access Homework (Student)', description: 'Allows viewing assigned homework, submitting work, and viewing feedback.' },
        ]
    },
     {
        module: "Admissions & Front Office",
        permissions: [
            { scope: 'admissions:admin', label: 'Full Admissions Access', description: 'Grants full control over the admissions pipeline, from enquiry to approval.' },
            { scope: 'frontoffice:admin', label: 'Full Front Office Access', description: 'Grants access to manage visitors, calls, and postal logs.' },
        ]
    },
    {
        module: "Parent Portal",
        permissions: [
            { scope: 'portal:parent', label: 'Access Parent Portal', description: 'Grants access to the parent-facing portal (feature not yet implemented).' },
        ]
    }
];


// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listRoles = async (): Promise<Role[]> => {
    await delay(300);
    return [...MOCK_ROLES];
};

export const listPermissions = async (): Promise<PermissionGroup[]> => {
    await delay(100);
    return [...PERMISSIONS_CONFIG];
};

export const updateRole = async (roleId: string, scopes: string[], actor: User): Promise<Role> => {
    await delay(500);
    const index = MOCK_ROLES.findIndex(r => r.id === roleId);
    if (index === -1) throw new Error('Role not found');
    
    const before = { scopes: [...MOCK_ROLES[index].scopes] };
    MOCK_ROLES[index].scopes = scopes;
    const after = { scopes: [...MOCK_ROLES[index].scopes] };
    
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'UPDATE',
        module: 'ROLES',
        entityType: 'Role',
        entityId: roleId,
        entityDisplay: MOCK_ROLES[index].name,
        before,
        after,
    });
    
    return { ...MOCK_ROLES[index] };
};
