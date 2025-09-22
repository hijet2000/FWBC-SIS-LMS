import type { CmsPage, PageStatus, User } from '../types';
import { logAuditEvent } from './auditService';

// --- MOCK DATA ---
let MOCK_PAGES: CmsPage[] = [
    {
        id: 'page-1',
        title: 'Homepage',
        slug: 'homepage',
        status: 'Published',
        authorId: 'user-evelyn-reed',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        currentVersion: 1,
        seo: { title: 'Welcome to FWBC', description: 'Our school website.', keywords: 'school, education' },
        blocks: [
            { id: 'block-1', type: 'text', order: 1, content: { text: 'Welcome to FWBC School. This is the main content of the homepage, managed by the CMS.' } },
            { id: 'block-2', type: 'image', order: 2, content: { mediaId: 'media-1', caption: 'Our beautiful campus' } },
        ],
        versions: [],
    },
    {
        id: 'page-2',
        title: 'About Us',
        slug: 'about-us',
        status: 'Draft',
        authorId: 'user-evelyn-reed',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        currentVersion: 1,
        seo: { title: 'About FWBC', description: 'Learn about our history and mission.', keywords: 'about, history, mission' },
        blocks: [{ id: 'block-3', type: 'text', order: 1, content: { text: 'This is the about us page. It is currently a draft.' } }],
        versions: [],
    },
    {
        id: 'page-3',
        title: 'Admissions Process',
        slug: 'admissions-process',
        status: 'Published',
        authorId: 'user-evelyn-reed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        currentVersion: 1,
        seo: { title: 'Admissions at FWBC', description: 'How to apply.', keywords: 'admissions, apply' },
        blocks: [{ id: 'block-4', type: 'text', order: 1, content: { text: 'Details about the admissions process go here.' } }],
        versions: [],
    }
];

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listPages = async (): Promise<CmsPage[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(MOCK_PAGES));
};

export const getPage = async (id: string): Promise<CmsPage | null> => {
    await delay(300);
    const page = MOCK_PAGES.find(p => p.id === id);
    return page ? JSON.parse(JSON.stringify(page)) : null;
};

export const getPageBySlug = async (slug: string): Promise<CmsPage | null> => {
    await delay(300);
    const page = MOCK_PAGES.find(p => p.slug === slug && p.status === 'Published');
    return page ? JSON.parse(JSON.stringify(page)) : null;
}

export const createPage = async (input: Pick<CmsPage, 'title' | 'slug' | 'blocks' | 'seo'>, actor: User): Promise<CmsPage> => {
    await delay(500);
    const newPage: CmsPage = {
        ...input,
        id: `page-${Date.now()}`,
        status: 'Draft',
        authorId: actor.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentVersion: 1,
        versions: [],
    };
    MOCK_PAGES.push(newPage);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'CMS', entityType: 'Page', entityId: newPage.id, entityDisplay: newPage.title, after: newPage });
    return newPage;
};

export const updatePage = async (id: string, update: Partial<Omit<CmsPage, 'id'>>, actor: User): Promise<CmsPage> => {
    await delay(500);
    const index = MOCK_PAGES.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Page not found");
    
    const before = { ...MOCK_PAGES[index] };
    MOCK_PAGES[index] = { ...MOCK_PAGES[index], ...update, updatedAt: new Date().toISOString() };
    const after = MOCK_PAGES[index];

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'CMS', entityType: 'Page', entityId: id, entityDisplay: after.title, before, after });
    return after;
};

export const updatePageStatus = async (id: string, status: PageStatus, actor: User): Promise<CmsPage> => {
    await delay(600);
    const page = MOCK_PAGES.find(p => p.id === id);
    if (!page) throw new Error("Page not found");
    
    const before = { ...page };
    page.status = status;
    let action: 'PUBLISH' | 'UNPUBLISH' | 'ARCHIVE' | 'UPDATE' = 'UPDATE';
    
    if (status === 'Published') {
        page.publishedAt = new Date().toISOString();
        action = 'PUBLISH';
    // FIX: Removed redundant `status !== 'Published'` check. This condition is always true in the `else` branch of the preceding `if`, so the check was unnecessary and caused a compiler error.
    } else if (before.status === 'Published') {
        action = 'UNPUBLISH';
    }

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action, module: 'CMS', entityType: 'Page', entityId: id, entityDisplay: page.title, before, after: page });
    
    return page;
}