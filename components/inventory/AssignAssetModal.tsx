import React, { useState, useEffect } from 'react';
import type { User, Asset, AssetLocationType, SchoolClass, Teacher } from '../../types';
import * as inventoryService from '../../lib/inventoryService';
import * as schoolService from '../../lib/schoolService';
import * as academicsService from '../../lib/academicsService';
import Modal from '../ui/Modal';

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  asset: Asset;
}

const AssignAssetModal: React.FC<AssignAssetModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, asset }) => {
    const [entityType, setEntityType] = useState<AssetLocationType>('Teacher');
    const [entityId, setEntityId] = useState('');
    const [metaData, setMetaData] = useState<{ classes: SchoolClass[], teachers: Teacher[] }>({ classes: [], teachers: [] });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            Promise.all([schoolService.getClasses(), academicsService.listTeachers()]).then(([classes, teachers]) => {
                setMetaData({ classes, teachers });
            });
            setEntityId('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entityId) return;
        setIsSaving(true);
        try {
            await inventoryService.assignAsset(asset.id, entityType, entityId, actor);
            onSaveSuccess();
        } catch {
            // handle error
        } finally {
            setIsSaving(false);
        }
    };

    const entityList = entityType === 'Teacher' ? metaData.teachers : metaData.classes;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Assign Asset ${asset.id}`}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <select value={entityType} onChange={e => setEntityType(e.target.value as AssetLocationType)} className="w-full rounded-md">
                        <option value="Teacher">Teacher</option>
                        <option value="Classroom">Classroom</option>
                        <option value="Location">Location (Manual)</option>
                    </select>

                    {entityType === 'Location' ? (
                        <input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="Enter location name..." className="w-full rounded-md" required />
                    ) : (
                        <select value={entityId} onChange={e => setEntityId(e.target.value)} className="w-full rounded-md" required>
                            <option value="">-- Select {entityType} --</option>
                            {entityList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    )}
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving || !entityId} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Assigning...' : 'Assign Asset'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignAssetModal;