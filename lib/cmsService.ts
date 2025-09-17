
import type { User, Page, PageVersion, Menu, NewsArticle, Event, MediaAsset, CmsSettings } from '../types';
import { logAuditEvent } from './auditService';

// This is a complete mock service for a Content Management System (CMS).
// In a real application, this would interact with a database (like a headless CMS or a custom DB).

// --- MOCK DATA STORE ---
let MOCK_PAGES: Page[] = [
    { id: 'pg-1', title: 'Home', slug: '/', content: '<h1>Welcome to FWBC</h1><p>Our school is great.</p>', status: 'Published', lastModified: new Date().toISOString() },
    { id: 'pg-2', title: 'About Us', slug: '/about', content: '<h2>Our History</h2><p>Founded in 1900...</p>', status: 'Published', lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'pg-3', title: 'Contact', slug: '/contact', content: '<p>Contact us at...</p>', status: 'Draft', lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
];

let MOCK_PAGE_VERSIONS: Record<string, PageVersion[]> = {
    'pg-2': [
        { versionId: 'v-1', content: '<h2>Our History</h2><p>Founded in 1920...</p>', savedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), savedBy: 'Dr. Evelyn Reed' },
        { versionId: 'v-2', content: '<h2>Our History</h2><p>Founded in 1900...</p>', savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), savedBy: 'Dr. Evelyn Reed' },
    ]
};

let MOCK_MENUS: Menu[] = [
    { id: 'menu-1', name: 'Main Navigation', items: [{ title: 'Home', url: '/' }, { title: 'About', url: '/about' }, { title: 'Contact Us', url: '/contact' }] },
];

let MOCK_NEWS: NewsArticle[] = [
    { id: 'news-1', title: 'Sports Day Success!', content: '<p>A fantastic day of competition...</p>', author: 'Admin', publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Published', slug: 'sports-day-2025' },
    { id: 'news-2', title: 'Upcoming Parent-Teacher Meetings', content: '<p>Meetings will be held next week...</p>', author: 'Admin', publishedAt: new Date().toISOString(), status: 'Draft', slug: 'parent-teacher-meetings' },
];

let MOCK_EVENTS: Event[] = [
    { id: 'evt-1', title: 'School Play: Hamlet', description: 'The drama club presents...', startDate: '2025-10-15T19:00', endDate: '2025-10-15T21:00', location: 'Main Hall', isAllDay: false },
    { id: 'evt-2', title: 'Charity Bake Sale', description: 'Raising money for a good cause.', startDate: '2025-10-20', isAllDay: true },
];

let MOCK_MEDIA: MediaAsset[] = [
    { id: 'med-1', fileName: 'school-campus.jpg', url: 'https://placehold.co/600x400/EBF4FF/7F8A9A?text=Campus', type: 'image/jpeg', size: 120 * 1024, uploadedAt: new Date().toISOString() },
    { id: 'med-2', fileName: 'prospectus.pdf', url: '#', type: 'application/pdf', size: 2.5 * 1024 * 1024, uploadedAt: new Date().toISOString() },
];

let MOCK_SETTINGS: CmsSettings = {
    siteTitle: 'FWBC School',
    tagline: 'A Tradition of Excellence',
    maintenanceMode: false,
};


// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Pages ---
export const listPages = async (): Promise<Page[]> => {
    await delay(300);
    return [...MOCK_PAGES];
};

export const getPage = async (id: string): Promise<Page | null> => {
    await delay(200);
    return MOCK_PAGES.find(p => p.id === id) || null;
};

export const savePage = async (pageData: Partial<Page> & { id?: string }, actor: User) => {
    await delay(500);
    const now = new Date().toISOString();
    if (pageData.id) { // Update
        const index = MOCK_PAGES.findIndex(p => p.id === pageData.id);
        if (index > -1) {
            const oldPage = MOCK_PAGES[index];
            const newPage = { ...oldPage, ...pageData, lastModified: now };
            MOCK_PAGES[index] = newPage;
            // Save a version
            if (!MOCK_PAGE_VERSIONS[pageData.id]) MOCK_PAGE_VERSIONS[pageData.id] = [];
            MOCK_PAGE_VERSIONS[pageData.id].push({ versionId: `v-${Date.now()}`, content: oldPage.content, savedAt: oldPage.lastModified, savedBy: actor.name });
            logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'CMS', entityType: 'Page', entityId: newPage.id, entityDisplay: newPage.title, before: oldPage, after: newPage });

        }
    } else { // Create
        const newPage: Page = {
            id: `pg-${Date.now()}`,
            title: pageData.title || 'Untitled',
            slug: pageData.slug || 'untitled',
            content: pageData.content || '',
            status: pageData.status || 'Draft',
            lastModified: now
        };
        MOCK_PAGES.push(newPage);
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'CMS', entityType: 'Page', entityId: newPage.id, entityDisplay: newPage.title, after: newPage });
    }
};

export const getPageVersions = async (pageId: string): Promise<PageVersion[]> => {
    await delay(250);
    return MOCK_PAGE_VERSIONS[pageId] || [];
};

// --- Menus ---
export const listMenus = async (): Promise<Menu[]> => {
    await delay(200);
    return [...MOCK_MENUS];
};

export const saveMenu = async (menuData: Menu, actor: User) => {
    await delay(400);
    const index = MOCK_MENUS.findIndex(m => m.id === menuData.id);
    if (index > -1) {
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'CMS', entityType: 'Menu', entityId: menuData.id, entityDisplay: menuData.name, before: MOCK_MENUS[index], after: menuData });
        MOCK_MENUS[index] = menuData;
    }
};

// --- News & Events ---
export const listNews = async (): Promise<NewsArticle[]> => {
    await delay(300);
    return [...MOCK_NEWS];
};

export const saveNews = async (article: Partial<NewsArticle> & { id?: string }, actor: User) => {
    await delay(500);
    if (article.id) {
         const index = MOCK_NEWS.findIndex(a => a.id === article.id);
        if (index > -1) MOCK_NEWS[index] = { ...MOCK_NEWS[index], ...article } as NewsArticle;
    } else {
        const newArticle: NewsArticle = {
            id: `news-${Date.now()}`,
            title: article.title || 'Untitled',
            slug: article.title?.toLowerCase().replace(/\s+/g, '-') || 'untitled',
            content: article.content || '',
            author: actor.name,
            status: article.status || 'Draft',
            publishedAt: new Date().toISOString()
        };
        MOCK_NEWS.push(newArticle);
    }
};

export const listEvents = async (): Promise<Event[]> => {
    await delay(300);
    return [...MOCK_EVENTS];
};

export const saveEvent = async (event: Partial<Event> & { id?: string }, actor: User) => {
    await delay(500);
    if (event.id) {
         const index = MOCK_EVENTS.findIndex(e => e.id === event.id);
        if (index > -1) MOCK_EVENTS[index] = { ...MOCK_EVENTS[index], ...event } as Event;
    } else {
        const newEvent: Event = {
            id: `evt-${Date.now()}`,
            title: event.title || 'Untitled Event',
            description: event.description || '',
            startDate: event.startDate || new Date().toISOString(),
            isAllDay: event.isAllDay || false,
        };
        MOCK_EVENTS.push(newEvent);
    }
};

// --- Media ---
export const listMedia = async (): Promise<MediaAsset[]> => {
    await delay(400);
    return [...MOCK_MEDIA];
};

export const uploadMedia = async (file: File, actor: User): Promise<MediaAsset> => {
    await delay(800);
    const newMedia: MediaAsset = {
        id: `med-${Date.now()}`,
        fileName: file.name,
        url: URL.createObjectURL(file), // Not persistent, just for demo
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
    };
    MOCK_MEDIA.unshift(newMedia);
    return newMedia;
};

// --- Settings ---
export const getCmsSettings = async (): Promise<CmsSettings> => {
    await delay(150);
    return { ...MOCK_SETTINGS };
};

export const saveCmsSettings = async (settings: CmsSettings, actor: User) => {
    await delay(400);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'CMS', entityType: 'Settings', entityId: 'cms-settings', entityDisplay: 'Site Settings', before: MOCK_SETTINGS, after: settings });
    MOCK_SETTINGS = settings;
};
