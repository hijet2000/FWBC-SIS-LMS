import React, { useState, useEffect } from 'react';
import type { User, Audience, AudienceRule } from '../../types';
import { saveAudience } from '../../lib/commsService';
import Modal from '../ui/Modal';

interface AudienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    initialData: Audience | null;
    actor: User;
}

const AudienceModal: React.FC<AudienceModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, actor }) => {
    const [audience, setAudience] = useState<Omit<Audience, 'id'>>({ name: '', description: '', rules: [] });

    useEffect(() => {
        if(initialData) {
            setAudience(initialData);
        } else {
            setAudience({ name: '', description: '', rules: [] });
        }
    }, [initialData, isOpen]);

    const handleRuleChange = (index: number, field: keyof AudienceRule, value: any) => {
        const newRules = [...audience.rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setAudience({ ...audience, rules: newRules });
    };

    const addRule = () => {
        const newRule: AudienceRule = { field: 'classId', condition: 'is', value: '' };
        setAudience({ ...audience, rules: [...audience.rules, newRule] });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveAudience({ id: (initialData as Audience)?.id, ...audience }, actor);
        onSaveSuccess();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Audience' : 'New Audience'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <input value={audience.name} onChange={e => setAudience({...audience, name: e.target.value})} placeholder="Audience Name" className="w-full rounded-md" required />
                    <textarea value={audience.description} onChange={e => setAudience({...audience, description: e.target.value})} placeholder="Description" className="w-full rounded-md" rows={2}/>
                    
                    <div className="space-y-2 pt-4 border-t">
                        <h3 className="font-semibold">Rules</h3>
                        {audience.rules.map((rule, index) => (
                            <div key={index} className="grid grid-cols-3 gap-2">
                                <select value={rule.field} onChange={e => handleRuleChange(index, 'field', e.target.value)} className="rounded-md text-sm"><option value="classId">Class</option><option value="feeStatus">Fee Status</option></select>
                                <select value={rule.condition} onChange={e => handleRuleChange(index, 'condition', e.target.value)} className="rounded-md text-sm"><option value="is">is</option><option value="isNot">is not</option></select>
                                <input value={rule.value} onChange={e => handleRuleChange(index, 'value', e.target.value)} placeholder="Value (e.g. c1)" className="rounded-md text-sm" />
                            </div>
                        ))}
                         <button type="button" onClick={addRule} className="text-sm text-indigo-600">+ Add Rule</button>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-md">Save Audience</button>
                </div>
            </form>
        </Modal>
    );
};

export default AudienceModal;