
import React from 'react';
import Drawer from '../admin/Drawer'; // Re-using a similar component
import { PageVersion } from '../../types';

const VersionHistoryDrawer: React.FC<{ isOpen: boolean, onClose: () => void, versions: PageVersion[], onRestore: (content: string) => void }> = ({ isOpen, onClose, versions, onRestore }) => {
    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="Version History">
            <div className="p-4 space-y-4">
                {versions.length > 0 ? versions.map(v => (
                    <div key={v.versionId} className="p-3 border rounded-md bg-white">
                        <p className="text-sm font-semibold">Saved by {v.savedBy} on {new Date(v.savedAt).toLocaleString()}</p>
                        <div className="mt-2 p-2 bg-gray-100 text-xs max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{v.content}</pre>
                        </div>
                        <button onClick={() => onRestore(v.content)} className="text-sm font-medium text-indigo-600 mt-2 hover:text-indigo-800">Restore this version</button>
                    </div>
                )) : <p className="text-center text-gray-500">No previous versions found.</p>}
            </div>
        </Drawer>
    );
};

export default VersionHistoryDrawer;
