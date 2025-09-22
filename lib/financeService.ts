import type { LedgerEntry, User, FinancialPeriod, FinanceCategory, TransactionType, Payee } from '../types';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getISODateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};


let MOCK_CATEGORIES: FinanceCategory[] = [
    { id: 'cat-inc-1', name: 'Donations', type: 'INCOME' },
    { id: 'cat-inc-2', name: 'Grants', type: 'INCOME' },
    { id: 'cat-inc-3', name: 'Event Ticket Sales', type: 'INCOME' },
    { id: 'cat-exp-1', name: 'Staff Salaries', type: 'EXPENSE' },
    { id: 'cat-exp-2', name: 'Utilities', type: 'EXPENSE' },
    { id: 'cat-exp-3', name: 'Maintenance & Repairs', type: 'EXPENSE' },
    { id: 'cat-exp-4', name: 'Stationery & Supplies', type: 'EXPENSE' },
];

let MOCK_PAYEES: Payee[] = [
    { id: 'pay-1', name: 'City Power & Light', type: 'Vendor', contact: 'accounts@citypower.com' },
    { id: 'pay-2', name: 'Office Supplies Inc.', type: 'Vendor' },
    { id: 'pay-3', name: 'Mr. Alan Turing', type: 'Staff' },
    { id: 'pay-4', name: 'Charitable Trust Foundation', type: 'Other' },
];

let MOCK_LEDGER_ENTRIES: LedgerEntry[] = [
    { id: 'le-1', date: getISODateDaysAgo(10), categoryId: 'cat-inc-1', payeeId: 'pay-4', description: 'Annual donation from CTF', amount: 5000, type: 'INCOME', refNo: 'DON-001', actorId: 'user-evelyn-reed', createdAt: getISODateDaysAgo(10), isReversal: false },
    { id: 'le-2', date: getISODateDaysAgo(5), categoryId: 'cat-exp-1', description: 'August Salaries', amount: 15000, type: 'EXPENSE', refNo: 'SAL-AUG', actorId: 'user-evelyn-reed', createdAt: getISODateDaysAgo(5), isReversal: false },
    { id: 'le-3', date: getISODateDaysAgo(3), categoryId: 'cat-exp-2', payeeId: 'pay-1', description: 'Electricity Bill', amount: 850.75, type: 'EXPENSE', refNo: 'INV-98765', actorId: 'user-evelyn-reed', createdAt: getISODateDaysAgo(3), isReversal: false },
    { id: 'le-4', date: getISODateDaysAgo(2), categoryId: 'cat-exp-4', payeeId: 'pay-2', description: 'Whiteboard markers', amount: 75.50, type: 'EXPENSE', refNo: 'INV-A123', actorId: 'user-evelyn-reed', createdAt: getISODateDaysAgo(2), isReversal: false },
    { id: 'le-5', date: getISODateDaysAgo(2), categoryId: 'cat-exp-4', payeeId: 'pay-2', description: 'Whiteboard markers (REVERSED)', amount: -75.50, type: 'EXPENSE', refNo: 'INV-A123-REV', actorId: 'user-evelyn-reed', createdAt: getISODateDaysAgo(1), isReversal: true, reversalOf: 'le-4' },
];

let MOCK_FINANCIAL_PERIODS: FinancialPeriod[] = [
    { id: '2025-07', month: 8, year: 2025, status: 'Closed', closingBalance: 120000 },
];


// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getFinanceDashboardSummary = async () => {
    await delay(500);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthEntries = MOCK_LEDGER_ENTRIES.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory: Record<string, number> = {};

    monthEntries.forEach(e => {
        const amount = e.isReversal ? -e.amount : e.amount;
        if (e.type === 'INCOME') totalIncome += amount;
        if (e.type === 'EXPENSE') {
            totalExpense += amount;
            expenseByCategory[e.categoryId] = (expenseByCategory[e.categoryId] || 0) + amount;
        }
    });

    const net = totalIncome - totalExpense;

    return { totalIncome, totalExpense, net };
};

export const listLedgerEntries = async (params: { from?: string, to?: string }): Promise<LedgerEntry[]> => {
    await delay(600);
    let results = [...MOCK_LEDGER_ENTRIES];
    if (params.from) results = results.filter(e => e.date >= params.from!);
    if (params.to) results = results.filter(e => e.date <= params.to!);
    return results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createLedgerEntry = async (input: Omit<LedgerEntry, 'id'|'createdAt'|'actorId'|'isReversal'>, actor: User): Promise<LedgerEntry> => {
    await delay(700);
    const newEntry: LedgerEntry = {
        ...input,
        id: `le-${Date.now()}`,
        createdAt: new Date().toISOString(),
        actorId: actor.id,
        isReversal: false,
    };
    MOCK_LEDGER_ENTRIES.push(newEntry);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'FINANCE', entityType: 'LedgerEntry', entityId: newEntry.id, entityDisplay: newEntry.description, after: newEntry });
    return newEntry;
};

export const reverseLedgerEntry = async (entryId: string, actor: User): Promise<LedgerEntry> => {
    await delay(800);
    const originalEntry = MOCK_LEDGER_ENTRIES.find(e => e.id === entryId);
    if (!originalEntry) throw new Error("Entry not found");
    if (originalEntry.isReversal) throw new Error("Cannot reverse a reversal entry.");
    
    const reversalEntry: LedgerEntry = {
        ...originalEntry,
        id: `le-${Date.now()}`,
        amount: -originalEntry.amount,
        isReversal: true,
        reversalOf: originalEntry.id,
        date: getTodayDateString(),
        description: `REVERSAL: ${originalEntry.description}`,
        actorId: actor.id,
        createdAt: new Date().toISOString(),
    };
    MOCK_LEDGER_ENTRIES.push(reversalEntry);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'DELETE', module: 'FINANCE', entityType: 'LedgerEntry', entityId: reversalEntry.id, entityDisplay: `Reversal of ${originalEntry.id}`, meta: { originalEntryId: originalEntry.id } });
    return reversalEntry;
};

export const listCategories = async (): Promise<FinanceCategory[]> => {
    await delay(200);
    return [...MOCK_CATEGORIES];
};
export const listPayees = async (): Promise<Payee[]> => {
    await delay(200);
    return [...MOCK_PAYEES];
};

export const getFinancialPeriod = async (year: number, month: number): Promise<FinancialPeriod> => {
    await delay(100);
    const id = `${year}-${month.toString().padStart(2, '0')}`;
    const period = MOCK_FINANCIAL_PERIODS.find(p => p.id === id);
    if (period) return period;
    return { id, year, month, status: 'Open' };
};

export const closeFinancialPeriod = async (year: number, month: number, actor: User): Promise<FinancialPeriod> => {
    await delay(1000);
    const id = `${year}-${month.toString().padStart(2, '0')}`;
    const existing = MOCK_FINANCIAL_PERIODS.findIndex(p => p.id === id);
    if (existing > -1 && MOCK_FINANCIAL_PERIODS[existing].status === 'Closed') {
        throw new Error("Period is already closed.");
    }

    // Calculation would be more complex in a real app (opening balance + month's transactions)
    const closingBalance = 100000;
    
    const closedPeriod: FinancialPeriod = {
        id, year, month, status: 'Closed', closingBalance, closedBy: actor.id, closedAt: new Date().toISOString()
    };

    if (existing > -1) {
        MOCK_FINANCIAL_PERIODS[existing] = closedPeriod;
    } else {
        MOCK_FINANCIAL_PERIODS.push(closedPeriod);
    }
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'FINANCE', entityType: 'FinancialPeriod', entityId: id, entityDisplay: `Period ${id}`, meta: { action: 'CLOSE', closingBalance } });

    return closedPeriod;
};