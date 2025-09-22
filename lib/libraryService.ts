

import type { Book, BookCopy, User, BookCopyStatus, LibraryMember, Loan, PotentialMember, LoanPolicy, LibrarySettings, MemberType } from '../types';
import { getStudents } from './schoolService';
import { listTeachers } from './academicsService';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
let MOCK_BOOKS: Book[] = [
    { id: 'book-1', isbn: '978-0743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Classic Literature', publisher: 'Scribner', publishedYear: 1925 },
    { id: 'book-2', isbn: '978-0061120084', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Classic Literature', publisher: 'Harper Perennial Modern Classics', publishedYear: 1960 },
    { id: 'book-3', isbn: '978-0439023528', title: 'The Hunger Games', author: 'Suzanne Collins', category: 'Young Adult', publisher: 'Scholastic Press', publishedYear: 2008 },
    { id: 'book-4', isbn: '978-0132350884', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', category: 'Computer Science', publisher: 'Prentice Hall', publishedYear: 2008 },
];

let MOCK_COPIES: BookCopy[] = [
    // Gatsby
    { id: 'copy-1', bookId: 'book-1', barcode: 'LIB-00001', status: 'On Loan', rack: 'A1', shelf: '3' },
    { id: 'copy-2', bookId: 'book-1', barcode: 'LIB-00002', status: 'Available', rack: 'A1', shelf: '3' },
    { id: 'copy-3', bookId: 'book-1', barcode: 'LIB-00003', status: 'Maintenance', rack: 'M1', shelf: '1', condition: 'Poor' },
    // Mockingbird
    { id: 'copy-4', bookId: 'book-2', barcode: 'LIB-00004', status: 'Available', rack: 'A1', shelf: '4' },
    { id: 'copy-5', bookId: 'book-2', barcode: 'LIB-00005', status: 'Available', rack: 'A1', shelf: '4' },
    // Hunger Games
    { id: 'copy-6', bookId: 'book-3', barcode: 'LIB-00006', status: 'On Loan', rack: 'B2', shelf: '1' },
    { id: 'copy-7', bookId: 'book-3', barcode: 'LIB-00007', status: 'On Loan', rack: 'B2', shelf: '1' },
    { id: 'copy-8', bookId: 'book-3', barcode: 'LIB-00008', status: 'Lost', rack: 'B2', shelf: '1' },
    // Clean Code
    { id: 'copy-9', bookId: 'book-4', barcode: 'LIB-00009', status: 'Available', rack: 'C3', shelf: '2' },
];

let MOCK_MEMBERS: LibraryMember[] = [
    { id: 's01', type: 'Student', barcode: 'MEM-S-00001', active: true },
    { id: 's02', type: 'Student', barcode: 'MEM-S-00002', active: true },
    { id: 't-2', type: 'Staff', barcode: 'MEM-T-00001', active: true },
];

let MOCK_LOANS: Loan[] = [
    // Current Loans
    { id: 'loan-1', copyId: 'copy-1', memberId: 's01', issuedAt: '2025-08-15T10:00:00Z', dueAt: '2025-08-29T10:00:00Z', fineIncurred: 5 },
    { id: 'loan-2', copyId: 'copy-6', memberId: 's02', issuedAt: '2025-08-20T14:00:00Z', dueAt: '2025-09-03T14:00:00Z' },
    // Past Loans
    { id: 'loan-3', copyId: 'copy-7', memberId: 's01', issuedAt: '2025-07-01T11:00:00Z', dueAt: '2025-07-15T11:00:00Z', returnedAt: '2025-07-14T16:00:00Z' },
];

let MOCK_SETTINGS: LibrarySettings = {
    loanPolicy: {
        loanDays: 14,
        maxRenewals: 2,
        graceDays: 3,
        finePerDay: 1.50,
    },
    memberTypePolicies: [
        { type: 'Student', maxConcurrentLoans: 3 },
        { type: 'Staff', maxConcurrentLoans: 5 },
    ],
    taxonomy: {
        racks: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3'],
        shelves: ['1', '2', '3', '4', '5'],
    },
    labelFormats: {
        bookBarcode: 'LIB-{NNNNN}',
        memberBarcode: 'MEM-{T}-{NNNNN}',
    },
    fineRounding: 'nearest_0.5',
};

export interface BookWithCopies extends Book {
    copies: BookCopy[];
}

export interface MemberLoanDetails extends Loan {
    bookTitle: string;
    bookAuthor: string;
    copyBarcode: string;
}
export interface MemberDetails {
    member: LibraryMember;
    user: { id: string, name: string, type: 'Student' | 'Staff' };
    currentLoans: MemberLoanDetails[];
    loanHistory: MemberLoanDetails[];
    totalFines: number;
}


// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listBooksWithCopies = async (): Promise<BookWithCopies[]> => {
    await delay(500);
    return MOCK_BOOKS.map(book => ({
        ...book,
        copies: MOCK_COPIES.filter(copy => copy.bookId === book.id),
    })).sort((a,b) => a.title.localeCompare(b.title));
};

export const createBook = async (input: Omit<Book, 'id'>, actor: User): Promise<Book> => {
    await delay(600);
    const newBook: Book = { ...input, id: `book-${Date.now()}` };
    MOCK_BOOKS.push(newBook);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'LIBRARY', entityType: 'Book', entityId: newBook.id, entityDisplay: newBook.title, after: newBook });
    return newBook;
};

export const updateBook = async (id: string, input: Omit<Book, 'id'>, actor: User): Promise<Book> => {
    await delay(600);
    const index = MOCK_BOOKS.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Book not found");
    const before = { ...MOCK_BOOKS[index] };
    MOCK_BOOKS[index] = { ...input, id };
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'LIBRARY', entityType: 'Book', entityId: id, entityDisplay: input.title, before, after: MOCK_BOOKS[index] });
    return MOCK_BOOKS[index];
};

export const createCopy = async (bookId: string, input: Pick<BookCopy, 'rack' | 'shelf' | 'condition'>, actor: User): Promise<BookCopy> => {
    await delay(400);
    const lastBarcode = MOCK_COPIES.reduce((max, c) => Math.max(max, parseInt(c.barcode.split('-')[1])), 0);
    const newCopy: BookCopy = {
        id: `copy-${Date.now()}`,
        bookId,
        barcode: `LIB-${(lastBarcode + 1).toString().padStart(5, '0')}`,
        status: 'Available',
        ...input
    };
    MOCK_COPIES.push(newCopy);
    const book = MOCK_BOOKS.find(b => b.id === bookId);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'LIBRARY', entityType: 'BookCopy', entityId: newCopy.id, entityDisplay: newCopy.barcode, after: newCopy, meta: { bookId, bookTitle: book?.title } });
    return newCopy;
};

export const lookupIsbn = async (isbn: string): Promise<Partial<Book> | null> => {
    await delay(500);
    if (isbn === '978-0743273565') {
        return { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: 'Scribner', publishedYear: 1925 };
    }
    if (isbn === '978-0061120084') {
        return { title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'Harper Collins', publishedYear: 1960 };
    }
    return null;
};

// --- Members API ---
export const listPotentialMembers = async (): Promise<PotentialMember[]> => {
    await delay(700);
    const [students, teachers] = await Promise.all([
        getStudents({ limit: 1000 }).then(res => res.students),
        listTeachers()
    ]);

    const memberMap = new Map(MOCK_MEMBERS.map(m => [m.id, m]));

    const potentialStudents: PotentialMember[] = students.map(s => ({
        id: s.id,
        name: s.name,
        type: 'Student',
        isMember: memberMap.has(s.id),
        libraryMemberId: memberMap.get(s.id)?.id,
    }));
    
    const potentialTeachers: PotentialMember[] = teachers.map(t => ({
        id: t.id,
        name: t.name,
        type: 'Staff',
        isMember: memberMap.has(t.id),
        libraryMemberId: memberMap.get(t.id)?.id,
    }));

    return [...potentialStudents, ...potentialTeachers].sort((a,b) => a.name.localeCompare(b.name));
};

export const enrollMember = async (id: string, type: 'Student' | 'Staff', name: string, actor: User): Promise<LibraryMember> => {
    await delay(500);
    if (MOCK_MEMBERS.some(m => m.id === id)) {
        throw new Error("User is already a library member.");
    }
    const lastBarcodeNum = MOCK_MEMBERS.reduce((max, m) => Math.max(max, parseInt(m.barcode.split('-')[2])), 0);
    const newMember: LibraryMember = {
        id,
        type,
        barcode: `MEM-${type.charAt(0)}-${(lastBarcodeNum + 1).toString().padStart(5, '0')}`,
        active: true,
    };
    MOCK_MEMBERS.push(newMember);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'LIBRARY', entityType: 'LibraryMember', entityId: newMember.id, entityDisplay: name, after: newMember });
    return newMember;
};

export const getMemberDetails = async (memberId: string): Promise<MemberDetails | null> => {
    await delay(600);
    const member = MOCK_MEMBERS.find(m => m.id === memberId);
    if (!member) return null;

    const [students, teachers] = await Promise.all([ getStudents({limit: 1000}).then(res => res.students), listTeachers()]);
    const allUsers = [...students, ...teachers];
    const user = allUsers.find(u => u.id === memberId);
    if (!user) return null;

    const bookMap = new Map(MOCK_BOOKS.map(b => [b.id, b]));
    const copyMap = new Map(MOCK_COPIES.map(c => [c.id, c]));

    const memberLoans = MOCK_LOANS.filter(l => l.memberId === memberId).map(loan => {
        const copy = copyMap.get(loan.copyId);
        const book = copy ? bookMap.get(copy.bookId) : null;
        return {
            ...loan,
            bookTitle: book?.title || 'Unknown Book',
            bookAuthor: book?.author || 'Unknown',
            copyBarcode: copy?.barcode || 'N/A',
        };
    });

    return {
        member,
        user: { id: user.id, name: user.name, type: member.type },
        currentLoans: memberLoans.filter(l => !l.returnedAt),
        loanHistory: memberLoans.filter(l => l.returnedAt),
        totalFines: memberLoans.reduce((sum, l) => sum + (l.fineIncurred || 0), 0),
    };
};

// --- Circulation API ---
export type CirculationDetails = {
    member?: MemberDetails['member'] & { name: string; maxConcurrentLoans?: number; };
    book?: Book;
    copy?: BookCopy;
    loan?: Loan;
    policyViolations: string[];
};

export const getCirculationDetails = async (memberBarcode?: string, bookBarcode?: string): Promise<CirculationDetails> => {
    await delay(300);
    const result: CirculationDetails = { policyViolations: [] };
    const settings = await getLibrarySettings();

    let member: (LibraryMember & { name: string, maxConcurrentLoans?: number }) | undefined;

    if (memberBarcode) {
        const foundMember = MOCK_MEMBERS.find(m => m.barcode === memberBarcode);
        if (foundMember) {
            const memberDetails = await getMemberDetails(foundMember.id);
            if(memberDetails) {
                const memberPolicy = settings.memberTypePolicies.find(p => p.type === foundMember.type);
                const maxLoans = memberPolicy?.maxConcurrentLoans;

                member = { ...memberDetails.member, name: memberDetails.user.name, maxConcurrentLoans: maxLoans };
                result.member = member;
            }
        }
    }

    if (bookBarcode) {
        const copy = MOCK_COPIES.find(c => c.barcode === bookBarcode);
        if (copy) {
            result.copy = copy;
            result.book = MOCK_BOOKS.find(b => b.id === copy.bookId);
            if (copy.status === 'On Loan') {
                const loan = MOCK_LOANS.find(l => l.copyId === copy.id && !l.returnedAt);
                result.loan = loan;
            }
        }
    }
    
    // Policy checks
    if (member && result.copy?.status === 'Available') {
         const memberPolicy = settings.memberTypePolicies.find(p => p.type === member.type);
         const maxLoans = memberPolicy?.maxConcurrentLoans || 3;
         const currentLoansCount = MOCK_LOANS.filter(l => l.memberId === member.id && !l.returnedAt).length;
         if (currentLoansCount >= maxLoans) {
             result.policyViolations.push(`Member has reached their loan limit of ${maxLoans}.`);
         }
    }

    return result;
};

export const issueBook = async (memberId: string, copyId: string, actor: User, overrideReason?: string): Promise<Loan> => {
    await delay(500);
    const member = MOCK_MEMBERS.find(m => m.id === memberId);
    const copy = MOCK_COPIES.find(c => c.id === copyId);
    const settings = await getLibrarySettings();
    
    if (!member || !copy || copy.status !== 'Available') throw new Error("Invalid issue conditions.");

    const memberPolicy = settings.memberTypePolicies.find(p => p.type === member.type);
    const maxLoans = memberPolicy?.maxConcurrentLoans || 3;
    const currentLoansCount = MOCK_LOANS.filter(l => l.memberId === member.id && !l.returnedAt).length;
    if (currentLoansCount >= maxLoans && !overrideReason) {
        throw new Error("Policy Violation: Member at loan limit.");
    }
    
    const issuedAt = new Date();
    const dueAt = new Date();
    dueAt.setDate(issuedAt.getDate() + settings.loanPolicy.loanDays);

    const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        copyId,
        memberId,
        issuedAt: issuedAt.toISOString(),
        dueAt: dueAt.toISOString(),
        renewals: 0
    };
    MOCK_LOANS.push(newLoan);
    copy.status = 'On Loan';
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'ISSUE', module: 'LIBRARY', entityType: 'Loan', entityId: newLoan.id, entityDisplay: `Loan of ${copy.barcode} to ${member.id}`, after: newLoan, meta: { overrideReason } });

    return newLoan;
};

export const returnBook = async (loanId: string, actor: User, overrideReason?: string): Promise<Loan> => {
    await delay(500);
    const loan = MOCK_LOANS.find(l => l.id === loanId);
    const copy = loan ? MOCK_COPIES.find(c => c.id === loan.copyId) : null;
    const settings = await getLibrarySettings();
    if (!loan || !copy) throw new Error("Loan or copy not found.");
    
    const before = { ...loan };

    loan.returnedAt = new Date().toISOString();
    copy.status = 'Available';

    // Calculate fine
    const dueDate = new Date(loan.dueAt);
    const returnDate = new Date(loan.returnedAt);
    const daysOverdue = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
    
    if (daysOverdue > settings.loanPolicy.graceDays) {
        loan.fineIncurred = (daysOverdue - settings.loanPolicy.graceDays) * settings.loanPolicy.finePerDay;
    }
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'RETURN', module: 'LIBRARY', entityType: 'Loan', entityId: loan.id, entityDisplay: `Return of ${copy.barcode}`, before, after: loan, meta: { overrideReason } });

    return loan;
};

// --- Settings API ---
export const getLibrarySettings = async (): Promise<LibrarySettings> => {
    await delay(400);
    // Return a deep copy to prevent direct mutation
    return JSON.parse(JSON.stringify(MOCK_SETTINGS));
};

export const updateLibrarySettings = async (settings: LibrarySettings, actor: User): Promise<LibrarySettings> => {
    await delay(600);
    const before = JSON.parse(JSON.stringify(MOCK_SETTINGS));
    MOCK_SETTINGS = JSON.parse(JSON.stringify(settings)); // Store a deep copy
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'UPDATE',
        module: 'LIBRARY',
        entityType: 'Settings',
        entityId: 'library-settings',
        entityDisplay: 'Library Policies & Settings',
        before,
        after: MOCK_SETTINGS,
    });
    return MOCK_SETTINGS;
};


// --- Reports API ---
export interface OverdueLoanDetails extends Loan {
    memberName: string;
    memberType: MemberType;
    bookTitle: string;
    copyBarcode: string;
    daysOverdue: number;
}

export interface CirculationStats {
    topTitles: { title: string; count: number }[];
    topCategories: { category: string; count: number }[];
    loansLast30Days: number;
    totalLoans: number;
}


export const getOverdueLoans = async (): Promise<OverdueLoanDetails[]> => {
    await delay(600);
    const now = new Date();
    // Make a past date for demonstration
    const pastDue = new Date();
    pastDue.setDate(now.getDate() - 5);
    MOCK_LOANS[0].dueAt = pastDue.toISOString();

    const overdueLoans = MOCK_LOANS.filter(l => !l.returnedAt && new Date(l.dueAt) < now);

    const [students, teachers] = await Promise.all([ getStudents({limit: 1000}).then(res => res.students), listTeachers()]);
    const userMap = new Map([...students, ...teachers].map(u => [u.id, u.name]));
    const memberMap = new Map(MOCK_MEMBERS.map(m => [m.id, m]));
    const bookMap = new Map(MOCK_BOOKS.map(b => [b.id, b]));
    const copyMap = new Map(MOCK_COPIES.map(c => [c.id, c]));

    return overdueLoans.map(loan => {
        const copy = copyMap.get(loan.copyId);
        const book = copy ? bookMap.get(copy.bookId) : null;
        const member = memberMap.get(loan.memberId);
        const memberName = userMap.get(loan.memberId) || 'Unknown Member';
        const daysOverdue = Math.floor((now.getTime() - new Date(loan.dueAt).getTime()) / (1000 * 3600 * 24));

        return {
            ...loan,
            memberName,
            memberType: member?.type || 'Student',
            bookTitle: book?.title || 'Unknown Book',
            copyBarcode: copy?.barcode || 'N/A',
            daysOverdue,
        };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);
};

export const getCirculationStats = async (): Promise<CirculationStats> => {
    await delay(500);
    const bookMap = new Map(MOCK_BOOKS.map(b => [b.id, b]));
    const copyMap = new Map(MOCK_COPIES.map(c => [c.id, c.bookId]));

    const titleCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    let loansLast30Days = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    MOCK_LOANS.forEach(loan => {
        const bookId = copyMap.get(loan.copyId);
        if (bookId) {
            const book = bookMap.get(bookId);
            if (book) {
                titleCounts.set(book.title, (titleCounts.get(book.title) || 0) + 1);
                if (book.category) {
                    categoryCounts.set(book.category, (categoryCounts.get(book.category) || 0) + 1);
                }
            }
        }
        if (new Date(loan.issuedAt) > thirtyDaysAgo) {
            loansLast30Days++;
        }
    });

    const topTitles = [...titleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([title, count]) => ({ title, count }));
    const topCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([category, count]) => ({ category, count }));

    return {
        topTitles,
        topCategories,
        loansLast30Days,
        totalLoans: MOCK_LOANS.length,
    };
};

export const sendOverdueNotices = async (loanIds: string[], actor: User): Promise<{ success: boolean }> => {
    await delay(1200);
    console.log(`[MOCK SEND] Sending overdue notices for loans: ${loanIds.join(', ')}`);
    
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'NOTIFY',
        module: 'LIBRARY',
        entityType: 'OverdueLoan',
        entityDisplay: `${loanIds.length} overdue notices`,
        meta: { loanIds },
    });
    
    return { success: true };
};