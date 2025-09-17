
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { logAuditEvent } from '../lib/auditService';

// To change the default user and scopes for testing, modify this object.
const MOCK_USER: User = {
  id: 'user-evelyn-reed',
  name: 'Dr. Evelyn Reed',
  role: 'Administrator / Head Teacher',
  scopes: [
    'sis:admin',
    'school:admin',
    'admissions:admin',
    'frontoffice:admin',
    'sis:students:read', 
    'sis:academics:read', 
    'sis:attendance:write', 
    'sis:library:read',
    'lms:admin', 
    'lms:courses:write',
    'homework:teacher',
    'homework:student'
  ],
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user data
    setTimeout(() => {
      setUser(MOCK_USER);
      logAuditEvent({
          actorId: MOCK_USER.id,
          actorName: MOCK_USER.name,
          action: 'LOGIN',
          module: 'AUTH',
      });
      setLoading(false);
    }, 500);
  }, []);

  const value = { user, loading, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
