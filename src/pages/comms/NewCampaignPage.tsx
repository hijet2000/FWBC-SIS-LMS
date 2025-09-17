import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as commsService from '../../lib/commsService';
import type { Audience, CommunicationTemplate } from '../../types';

const NewCampaignPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
    const [recipients, setRecipients] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedAudienceId, setSelectedAudienceId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [campaignName, setCampaignName] = useState('');

    useEffect(() => {
        Promise.all([commsService.listAudiences(), commsService.listTemplates()])
            .then(([audData, tplData]) => {
                setAudiences(audData);
                setTemplates(tplData);
            }).finally(() => setLoading(false));
    }, []);
    
    useEffect(() => {
        if(selectedAudienceId) {
            setLoading(true);
            commsService.resolveAudience(selectedAudienceId).then(setRecipients).finally(() => setLoading(false));
        }
    }, [selectedAudienceId]);

    const handleSend = async () => {
        if(!user) return;
        setLoading(true);
        try {
            await commsService.createCampaign({ name: campaignName, audienceId: selectedAudienceId, templateId: selectedTemplateId }, recipients, user);
            addToast('Campaign queued for sending!', 'success');
            navigate('../campaigns');
        } catch {
            addToast('Failed to create campaign.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">New Campaign</h1>
            
            {/* Step 1 */}
            <div className={`p-4 border rounded-lg ${step >= 1 ? 'bg-white' : 'bg-gray-50'}`}>
                <h2 className="font-bold text-xl">Step 1: Choose Audience</h2>
                {step === 1 && <div className="mt-4 space-y-4">
                    <select value={selectedAudienceId} onChange={e => setSelectedAudienceId(e.target.value)} className="w-full rounded-md"><option value="">Select Audience...</option>{audiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                    {loading && selectedAudienceId && <p>Resolving audience...</p>}
                    {recipients.length > 0 && <p className="text-sm text-green-600">Found {recipients.length} recipients.</p>}
                    <button onClick={() => setStep(2)} disabled={!selectedAudienceId || recipients.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Next</button>
                </div>}
            </div>
            
            {/* Step 2 */}
            <div className={`p-4 border rounded-lg ${step >= 2 ? 'bg-white' : 'bg-gray-50'}`}>
                 <h2 className="font-bold text-xl">Step 2: Choose Template & Name</h2>
                 {step === 2 && <div className="mt-4 space-y-4">
                     <input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Campaign Name (for reporting)" className="w-full rounded-md" required />
                    <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full rounded-md"><option value="">Select Template...</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>)}</select>
                    <div className="flex gap-2"><button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 rounded-md">Back</button><button onClick={() => setStep(3)} disabled={!selectedTemplateId || !campaignName} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Review</button></div>
                 </div>}
            </div>

            {/* Step 3 */}
            <div className={`p-4 border rounded-lg ${step >= 3 ? 'bg-white' : 'bg-gray-50'}`}>
                 <h2 className="font-bold text-xl">Step 3: Review & Send</h2>
                 {step === 3 && <div className="mt-4 space-y-4">
                     <p>You are about to send the <strong>'{templates.find(t=>t.id===selectedTemplateId)?.name}'</strong> template to <strong>{recipients.length}</strong> recipients from the <strong>'{audiences.find(a=>a.id===selectedAudienceId)?.name}'</strong> audience.</p>
                     <div className="flex gap-2"><button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-200 rounded-md">Back</button><button onClick={handleSend} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">{loading ? 'Sending...' : 'Confirm & Send'}</button></div>
                 </div>}
            </div>
        </div>
    );
};

export default NewCampaignPage;