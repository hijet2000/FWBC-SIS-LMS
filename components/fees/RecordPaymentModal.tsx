import React, { useState, useEffect } from 'react';
import type { Invoice, PaymentMethod, User } from '../../types';
import { recordPayment } from '../../lib/feesService';
import Modal from '../ui/Modal';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (receiptNo: string) => void;
  invoice: Invoice;
  actor: User;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onSaveSuccess, invoice, actor }) => {
  const outstanding = invoice.total - invoice.paid;
  
  const [formData, setFormData] = useState({
    amount: outstanding,
    method: 'Card' as PaymentMethod,
    ref: '',
    paidAt: getTodayDateString(),
    note: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFormData({
            amount: invoice.total - invoice.paid,
            method: 'Card',
            ref: '',
            paidAt: getTodayDateString(),
            note: ''
        });
        setErrors({});
    }
  }, [invoice, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.amount <= 0) {
        newErrors.amount = 'Amount must be positive.';
    } else if (formData.amount > outstanding + 0.01) { // Floating point safety
        newErrors.amount = 'Amount cannot exceed outstanding balance.';
    }
    if (!formData.paidAt) newErrors.paidAt = 'Payment date is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
        const payload = { 
            invoiceId: invoice.id, 
            ...formData, 
            amount: Number(formData.amount),
            actor,
        };
        const result = await recordPayment(payload);
        onSaveSuccess(result.receiptNo);
    } catch {
        setErrors({ form: 'Failed to record payment. Please try again.' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment for ${invoice.invoiceNo}`}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md text-center">
            <p className="text-sm text-indigo-700">Outstanding Balance</p>
            <p className="text-2xl font-bold text-indigo-900">£{outstanding.toFixed(2)}</p>
          </div>

          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount to Pay (£)</label>
                <input type="number" id="amount" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>
               <div>
                <label htmlFor="paidAt" className="block text-sm font-medium text-gray-700">Payment Date</label>
                <input type="date" id="paidAt" value={formData.paidAt} onChange={e => setFormData({...formData, paidAt: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                {errors.paidAt && <p className="mt-1 text-sm text-red-600">{errors.paidAt}</p>}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select id="method" value={formData.method} onChange={e => setFormData({...formData, method: e.target.value as PaymentMethod})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    {(['Cash', 'Card', 'Mobile', 'Bank'] as PaymentMethod[]).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
               <div>
                <label htmlFor="ref" className="block text-sm font-medium text-gray-700">Reference (Optional)</label>
                <input type="text" id="ref" value={formData.ref} onChange={e => setFormData({...formData, ref: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
              </div>
          </div>
            
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea id="note" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>

        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400">
            {isSaving ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;