import type { FeeItem, FeeFrequency, Invoice, Payment, PaymentMethod, User } from '../types';
import { logAuditEvent } from './auditService';

// --- MOCK DATA ---
let FEE_ITEMS: FeeItem[] = [
  { id: 'fee-1', name: 'Tuition Fee - Term 1', code: 'TUIT-T1', amount: 1200, frequency: 'Termly', active: true },
  { id: 'fee-2', name: 'Transport Fee', code: 'TRAN', amount: 150, frequency: 'Monthly', active: true },
  { id: 'fee-3', name: 'Library Fee', code: 'LIBR', amount: 50, frequency: 'Annually', active: true },
  { id: 'fee-4', name: 'Examination Fee', code: 'EXAM', amount: 75, frequency: 'Once', active: true },
  { id: 'fee-5', name: 'Old Uniform Levy', code: 'UNI-OLD', amount: 25, frequency: 'Once', active: false },
];

let INVOICES: Invoice[] = [
    { id: 'inv-1', invoiceNo: 'INV-2025-001', studentId: 's01', classId: 'c1', issuedAt: '2025-08-01', dueAt: '2025-08-15', lineItems: [ { feeItemId: 'fee-1', description: 'Tuition Fee - Term 1', amount: 1200 }, { feeItemId: 'fee-3', description: 'Library Fee', amount: 50 } ], total: 1250, paid: 1250, status: 'Paid' },
    { id: 'inv-2', invoiceNo: 'INV-2025-002', studentId: 's02', classId: 'c1', issuedAt: '2025-08-01', dueAt: '2025-08-15', lineItems: [ { feeItemId: 'fee-1', description: 'Tuition Fee - Term 1', amount: 1200 }, { feeItemId: 'fee-2', description: 'Transport Fee', amount: 150 } ], total: 1350, paid: 500, status: 'Partial' },
    { id: 'inv-3', invoiceNo: 'INV-2025-003', studentId: 's06', classId: 'c2', issuedAt: '2025-08-05', dueAt: '2025-08-20', lineItems: [ { feeItemId: 'fee-1', description: 'Tuition Fee - Term 1', amount: 1200 } ], total: 1200, paid: 0, status: 'Unpaid' },
    { id: 'inv-4', invoiceNo: 'INV-2024-010', studentId: 's07', classId: 'c2', issuedAt: '2024-04-01', dueAt: '2024-04-15', lineItems: [ { feeItemId: 'fee-1', description: 'Tuition Fee - Term 1', amount: 1100 } ], total: 1100, paid: 0, status: 'Overdue' },
];

let PAYMENTS: Payment[] = [
    { id: 'pay-1', invoiceId: 'inv-1', receiptNo: 'REC-2025-001', amount: 1250, method: 'Bank', paidAt: '2025-08-10' },
    { id: 'pay-2', invoiceId: 'inv-2', receiptNo: 'REC-2025-002', amount: 500, method: 'Card', paidAt: '2025-08-12' },
];

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listFeeItems = async (): Promise<FeeItem[]> => { await delay(200); return [...FEE_ITEMS]; };
export const createFeeItem = async (input: Omit<FeeItem, 'id'>): Promise<FeeItem> => {
    await delay(500);
    const newItem: FeeItem = { ...input, id: `fee-${Date.now()}` };
    FEE_ITEMS.push(newItem);
    return newItem;
};
export const updateFeeItem = async (id: string, input: Omit<FeeItem, 'id'>): Promise<FeeItem> => {
    await delay(500);
    const index = FEE_ITEMS.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Not found");
    FEE_ITEMS[index] = { ...input, id };
    return FEE_ITEMS[index];
};
export const toggleFeeItem = async (id: string, active: boolean): Promise<void> => {
    await delay(400);
    const item = FEE_ITEMS.find(i => i.id === id);
    if (item) item.active = active;
};

export const assignFeeToClass = async (feeItemIds: string[], classId: string): Promise<void> => {
    await delay(600);
    console.log(`Assigned fees ${feeItemIds.join(', ')} to class ${classId}`);
};
export const assignFeeToStudent = async (feeItemIds: string[], studentId: string): Promise<void> => {
    await delay(600);
    console.log(`Assigned fees ${feeItemIds.join(', ')} to student ${studentId}`);
};

export const listInvoices = async (params: { studentId?: string; classId?: string; status?: string }): Promise<Invoice[]> => {
    await delay(500);
    let results = [...INVOICES];
    if (params.studentId) results = results.filter(i => i.studentId === params.studentId);
    if (params.classId) results = results.filter(i => i.classId === params.classId);
    if (params.status && params.status !== 'all') results = results.filter(i => i.status === params.status);
    return results.sort((a,b) => b.issuedAt.localeCompare(a.issuedAt));
};

interface RecordPaymentInput {
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    ref?: string;
    paidAt: string;
    note?: string;
    actor: User; // For audit
}

export const recordPayment = async (input: RecordPaymentInput): Promise<{ receiptNo: string }> => {
    await delay(800);
    const invoice = INVOICES.find(i => i.id === input.invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const oldStatus = invoice.status;
    const oldPaid = invoice.paid;
    
    invoice.paid += input.amount;
    if (invoice.paid >= invoice.total) {
        invoice.status = 'Paid';
    } else {
        invoice.status = 'Partial';
    }

    const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        receiptNo: `REC-${new Date().getFullYear()}-${PAYMENTS.length + 10}`,
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: input.method,
        ref: input.ref,
        paidAt: input.paidAt,
        note: input.note,
    };
    PAYMENTS.push(newPayment);

    // Instrumentation
    logAuditEvent({
        actorId: input.actor.id,
        actorName: input.actor.name,
        action: 'PAYMENT',
        module: 'FEES',
        entityType: 'INVOICE',
        entityId: invoice.id,
        entityDisplay: invoice.invoiceNo,
        before: { paid: oldPaid, status: oldStatus },
        after: { paid: invoice.paid, status: invoice.status },
        meta: {
            receiptNo: newPayment.receiptNo,
            amount: input.amount,
            method: input.method,
            studentId: invoice.studentId,
        }
    });

    return { receiptNo: newPayment.receiptNo };
};