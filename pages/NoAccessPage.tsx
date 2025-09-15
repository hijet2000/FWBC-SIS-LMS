import React from 'react';
import { useAuth } from '../auth/AuthContext';

interface NoAccessPageProps {
  requiredScopes: string[];
  reason?: 'Not signed in' | 'Missing permissions';
}

const NoAccessPage: React.FC<NoAccessPageProps> = ({ requiredScopes, reason = 'Missing permissions' }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-red-50 p-8 rounded-lg border-2 border-dashed border-red-200" role="alert">
      <h1 className="text-2xl font-bold text-red-800">Access Denied</h1>
      {reason === 'Missing permissions' && (
        <>
          <p className="mt-2 text-red-700">
            You're missing the required permission. Access requires one of: <strong className="font-mono">{requiredScopes.join(' OR ')}</strong>.
          </p>
          {user && (
            <div className="mt-4 text-left text-xs text-red-600 bg-red-100 p-3 rounded-md">
              <p className="font-semibold">Your current permissions:</p>
              {user.scopes.length > 0 ? (
                <ul className="list-disc list-inside font-mono">
                  {user.scopes.map(scope => <li key={scope}>{scope}</li>)}
                </ul>
              ) : (
                <p>You have no permissions assigned.</p>
              )}
            </div>
          )}
        </>
      )}
      {reason === 'Not signed in' && (
          <p className="mt-2 text-red-700">You must be signed in to view this page.</p>
      )}
    </div>
  );
};

export default NoAccessPage;
