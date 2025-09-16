import type { Book, BookCopy, LibraryMember, Loan, LibraryPolicy, User, EnrichedLoan, MemberType } from '../types';
import { getStudents } from './schoolService';
import { listTeachers } from './academicsService';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
let MOCK_BOOKS: Book[] = [
    { id: 'book-1', title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0345339683', category: 'Fantasy', language: 'English', copies: [] },
    { id: 'book-2', title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0553380163', category: 'Science', language: 'English', copies: [] },
    { id: 'book-3', title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0061120084', category: 'Fiction', language: 'English', copies: [] },
];

let MOCK_COPIES: BookCopy[] = [
    // The Hobbit
    { id: 'copy-1', bookId: 'book-1', barcode: 'LIB-00001', rack: 'A', shelf: '3', status: 'Available' },
    { id: 'copy-2', bookId: 'book-1', barcode: 'LIB-00002', rack: 'A', shelf: '3', status: 'On Loan' },
    // A Brief History of Time
    { id: 'copy-3', bookId: 'book-2', barcode: 'LIB-00003', rack: 'B', shelf: '1', status: 'On Loan' },
    { id: 'copy-4', bookId: 'book-2', barcode: 'LIB-00004', rack: 'B', shelf: '1', status: 'Damaged' },
    // To Kill a Mockingbird
    { id: 'copy-5', bookId: 'book-3', barcode: 'LIB-00005', rack: 'C', shelf: '2', status: 'Available' },
];
MOCK_BOOKS.forEach(b => b.copies = MOCK_COPIES.filter(c => c.bookId === b.id));

let MOCK_POLICIES: LibraryPolicy[] = [
    { memberType: 'Student', loanDays: 14, maxRenewals: 1, maxConcurrentLoans: 3, graceDays: 2, finePerDay: 0.50, lostReplacementFee: 25 },
    { memberType: 'Teacher', loanDays: 30, maxRenewals: 2, maxConcurrentLoans: 10, graceDays: 5, finePerDay: 0.25, lostReplacementFee: 20 },
];

const getISODateDaysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

let MOCK_LOANS: Loan[] = [
    { id: 'loan-1', copyId: 'copy-2', memberId: 's01', issuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), dueAt: getISODateDaysFromNow(4), renewals: 0 },
    { id: 'loan-overdue', copyId: 'copy-3', memberId: 's02', issuedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), dueAt: getISODateDaysFromNow(-6), renewals: 0 },
];

let MOCK_MEMBERS: LibraryMember[] = [];

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Catalog
export const listBooks = async (): Promise<Book[]> => {
    await delay(300);
    return MOCK_BOOKS.map(b => ({ ...b, copies: MOCK_COPIES.filter(c => c.bookId === b.id) }));
};

export const saveBook = async (bookData: Omit<Book, 'id'> | Book, actor: User): Promise<Book> => {
    await delay(500);
    let savedBook: Book;
    if ('id' in bookData) { // Update
        const index = MOCK_BOOKS.findIndex(b => b.id === bookData.id);
        if (index > -1) MOCK_BOOKS[index] = { ...MOCK_BOOKS[index], ...bookData };
        savedBook = bookData;
    } else { // Create
        savedBook = { ...bookData, id: `book-${Date.now()}` };
        MOCK_BOOKS.push(savedBook);
    }
    // Sync copies
    MOCK_COPIES = MOCK_COPIES.filter(c => c.bookId !== savedBook.id);
    savedBook.copies.forEach(c => c.bookId = savedBook.id);
    MOCK_COPIES.push(...savedBook.copies);
    return savedBook;
};

// Members
export const listMembers = async (): Promise<LibraryMember[]> => {
    await delay(400);
    if (MOCK_MEMBERS.length === 0) { // Sync on first call
        const { students } = await getStudents({ limit: 1000 });
        const teachers = await listTeachers();
        const studentPolicy = MOCK_POLICIES.find(p => p.memberType === 'Student')!;
        const teacherPolicy = MOCK_POLICIES.find(p => p.memberType === 'Teacher')!;
        MOCK_MEMBERS = [
            ...students.map(s => ({ id: s.id, name: s.name, memberType: 'Student' as MemberType, barcode: `MEM-${s.admissionNo}`, maxConcurrentLoans: studentPolicy.maxConcurrentLoans })),
            ...teachers.map(t => ({ id: t.id, name: t.name, memberType: 'Teacher' as MemberType, barcode: `MEM-${t.email.split('@')[0]}`, maxConcurrentLoans: teacherPolicy.maxConcurrentLoans })),
        ];
    }
    return [...MOCK_MEMBERS];
};

export const getMember = async (memberId: string): Promise<LibraryMember | null> => {
    await listMembers(); // Ensure members are synced
    return MOCK_MEMBERS.find(m => m.id === memberId) || null;
};
export const getMemberByBarcode = async (barcode: string): Promise<LibraryMember | null> => {
    await listMembers();
    return MOCK_MEMBERS.find(m => m.barcode === barcode) || null;
};

// Circulation
export const getCopyByBarcode = async (barcode: string): Promise<BookCopy | null> => {
    await delay(100);
    return MOCK_COPIES.find(c => c.barcode === barcode) || null;
};

// Helpers
const calculateFine = (loan: Loan): number => {
    const member = MOCK_MEMBERS.find(m => m.id === loan.memberId);
    if(!member) return 0;
    const policy = MOCK_POLICIES.find(p => p.memberType === member.memberType)!;
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(loan.dueAt);
    if (today <= dueDate || loan.returnedAt) return 0;
    
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const daysToFine = Math.max(0, diffDays - policy.graceDays);
    return daysToFine * policy.finePerDay;
};

export const listLoansForMember = async (memberId: string): Promise<EnrichedLoan[]> => {
    await delay(300);
    await listMembers(); // Ensure members are populated for fine calculation
    const loans = MOCK_LOANS.filter(l => l.memberId === memberId);
    const enriched: EnrichedLoan[] = [];
    for (const loan of loans) {
        const copy = MOCK_COPIES.find(c => c.id === loan.copyId);
        const book = MOCK_BOOKS.find(b => b.id === copy?.bookId);
        const member = await getMember(loan.memberId);
        enriched.push({
            ...loan,
            bookTitle: book?.title || 'Unknown',
            bookAuthor: book?.author || 'Unknown',
            copyBarcode: copy?.barcode || 'Unknown',
            memberName: member?.name || 'Unknown',
            fine: calculateFine(loan),
        });
    }
    return enriched.sort((a,b) => b.issuedAt.localeCompare(a.issuedAt));
};

export const issueBook = async (copyId: string, memberId: string, actor: User): Promise<Loan> => {
    await delay(600);
    const member = await getMember(memberId);
    const copy = MOCK_COPIES.find(c => c.id === copyId);
    if (!member || !copy || copy.status !== 'Available') throw new Error("Validation failed");

    const policy = MOCK_POLICIES.find(p => p.memberType === member.memberType)!;
    const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        copyId, memberId,
        issuedAt: new Date().toISOString(),
        dueAt: getISODateDaysFromNow(policy.loanDays),
        renewals: 0,
    };
    MOCK_LOANS.push(newLoan);
    copy.status = 'On Loan';
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'LIBRARY', entityType: 'Loan', entityId: newLoan.id, entityDisplay: `Loan to ${member.name}`, meta: { memberId, copyId }});
    return newLoan;
};

export const returnBook = async (copyId: string, actor: User): Promise<{ fine: number }> => {
    await delay(600);
    const loan = MOCK_LOANS.find(l => l.copyId === copyId && !l.returnedAt);
    const copy = MOCK_COPIES.find(c => c.id === copyId);
    if (!loan || !copy) throw new Error("Loan or copy not found");
    
    const fine = calculateFine(loan);
    loan.returnedAt = new Date().toISOString();
    copy.status = 'Available';
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'LIBRARY', entityType: 'Loan', entityId: loan.id, entityDisplay: `Return from member ${loan.memberId}`, meta: { fine }});
    return { fine };
};

// Policies & Reports
export const getPolicies = async (): Promise<LibraryPolicy[]> => {
    await delay(150);
    return [...MOCK_POLICIES];
};

export const updatePolicy = async (policy: LibraryPolicy, actor: User): Promise<void> => {
    await delay(400);
    const index = MOCK_POLICIES.findIndex(p => p.memberType === policy.memberType);
    if (index > -1) MOCK_POLICIES[index] = policy;
};

export const listOverdueItems = async (): Promise<EnrichedLoan[]> => {
    await delay(500);
    await listMembers();
    const overdueLoans = MOCK_LOANS.filter(l => !l.returnedAt && new Date(l.dueAt) < new Date());
    const enriched: EnrichedLoan[] = [];
    for (const loan of overdueLoans) {
         const copy = MOCK_COPIES.find(c => c.id === loan.copyId);
         const book = MOCK_BOOKS.find(b => b.id === copy?.bookId);
         const member = await getMember(loan.memberId);
         enriched.push({
            ...loan,
            bookTitle: book?.title || 'Unknown',
            bookAuthor: book?.author || 'Unknown',
            copyBarcode: copy?.barcode || 'Unknown',
            memberName: member?.name || 'Unknown',
            fine: calculateFine(loan),
        });
    }
    return enriched;
};