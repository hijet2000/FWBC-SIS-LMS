
import type { CmsPage, PageStatus, User, WebsiteSettings, Menu, CmsPost, MediaAsset, CmsPostType } from '../types';
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

let MOCK_POSTS: CmsPost[] = [
    { id: 'post-1', postType: 'News', title: 'School Reopens for 2025 Term', slug: 'school-reopens-2025', status: 'Published', authorId: 'user-evelyn-reed', createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), updatedAt: new Date().toISOString(), publishedAt: new Date().toISOString(), seo: {title: 'School Reopening', description: '', keywords: ''}, excerpt: 'We are excited to welcome all students back for the new term.', content: 'Full article content about the reopening would go here.' },
    { id: 'post-2', postType: 'Event', title: 'Annual Sports Day', slug: 'annual-sports-day-2025', status: 'Published', authorId: 'user-evelyn-reed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), publishedAt: new Date().toISOString(), seo: {title: 'Sports Day', description: '', keywords: ''}, excerpt: 'Join us for a day of fun and competition.', content: 'Detailed schedule and information about the sports day.', eventDate: '2025-10-25', eventTime: '09:00', eventLocation: 'Main Sports Field' },
    { id: 'post-3', postType: 'News', title: 'New Science Lab - Draft', slug: 'new-science-lab-draft', status: 'Draft', authorId: 'user-evelyn-reed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), seo: {title: '', description: '', keywords: ''}, excerpt: 'Construction is underway for our new state-of-the-art science facility.', content: 'More details to come.' },
];

let MOCK_MEDIA_ASSETS: MediaAsset[] = [
    { id: 'media-1', fileName: 'campus.jpg', mimeType: 'image/jpeg', sizeBytes: 120400, url: 'https://placehold.co/800x400/EBF4FF/7F8A9A?text=Campus+Image', altText: 'A view of the main school building.', uploadedAt: new Date().toISOString(), uploadedBy: 'user-evelyn-reed' },
    { id: 'media-2', fileName: 'library.jpg', mimeType: 'image/jpeg', sizeBytes: 98600, url: 'https://placehold.co/800x400/EBF4FF/7F8A9A?text=Library+Image', altText: 'The school library.', uploadedAt: new Date().toISOString(), uploadedBy: 'user-evelyn-reed' },
    { id: 'media-3', fileName: 'sports_day.jpg', mimeType: 'image/jpeg', sizeBytes: 215000, url: 'https://placehold.co/800x400/EBF4FF/7F8A9A?text=Sports+Day', altText: 'Students competing in a race.', uploadedAt: new Date().toISOString(), uploadedBy: 'user-evelyn-reed' },
];


let MOCK_WEBSITE_SETTINGS: WebsiteSettings = {
    siteTitle: 'FWBC School 2025',
    primaryColor: '#4f46e5',
    logoUrl: '/logo.png',
};

let MOCK_MENUS: Menu[] = [
    {
        id: 'main-nav',
        name: 'Main Navigation',
        items: [
            { id: 'item-1', label: 'Home', type: 'page', value: 'homepage', order: 1, children: [] },
            { id: 'item-2', label: 'About Us', type: 'page', value: 'about-us', order: 2, children: [] },
            { id: 'item-3', label: 'Admissions', type: 'page', value: 'admissions-process', order: 3, children: [] },
            { id: 'item-4', label: 'News', type: 'url', value: '/fwbc/news', order: 4, children: [] },
            { id: 'item-5', label: 'Events', type: 'url', value: '/fwbc/events', order: 5, children: [] },
        ]
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
    } else if (before.status === 'Published') {
        action = 'UNPUBLISH';
    }

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action, module: 'CMS', entityType: 'Page', entityId: id, entityDisplay: page.title, before, after: page });
    
    return page;
};

export const getSettings = async (): Promise<WebsiteSettings> => {
    await delay(150);
    return JSON.parse(JSON.stringify(MOCK_WEBSITE_SETTINGS));
};

export const updateSettings = async (settings: WebsiteSettings, actor: User): Promise<WebsiteSettings> => {
    await delay(400);
    const before = { ...MOCK_WEBSITE_SETTINGS };
    MOCK_WEBSITE_SETTINGS = settings;
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'CMS', entityType: 'Settings', entityId: 'website-settings', entityDisplay: 'Website Settings', before, after: settings });
    return MOCK_WEBSITE_SETTINGS;
};

export const getMenu = async (id: string): Promise<Menu | null> => {
    await delay(200);
    const menu = MOCK_MENUS.find(m => m.id === id);
    return menu ? JSON.parse(JSON.stringify(menu)) : null;
};

export const updateMenu = async (id: string, menu: Menu, actor: User): Promise<Menu> => {
    await delay(500);
    const index = MOCK_MENUS.findIndex(m => m.id === id);
    if (index === -1) throw new Error("Menu not found");
    MOCK_MENUS[index] = menu;
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'MENU_UPDATE', module: 'CMS', entityType: 'Menu', entityId: id, entityDisplay: menu.name });
    return menu;
};

export const listMediaAssets = async (): Promise<MediaAsset[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(MOCK_MEDIA_ASSETS));
};

export const uploadMediaAsset = async (file: { name: string, type: string, size: number }, actor: User): Promise<MediaAsset> => {
    await delay(800);
    const newAsset: MediaAsset = {
        id: `media-${Date.now()}`,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        url: `https://placehold.co/800x400/EBF4FF/7F8A9A?text=${file.name}`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: actor.id,
    };
    MOCK_MEDIA_ASSETS.push(newAsset);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'MEDIA_UPLOAD', module: 'CMS', entityType: 'Media', entityId: newAsset.id, entityDisplay: newAsset.fileName });
    return newAsset;
};

export const listPosts = async (params: { postType?: CmsPostType } = {}): Promise<CmsPost[]> => {
    await delay(400);
    let results = [...MOCK_POSTS];
    if (params.postType) {
        results = results.filter(p => p.postType === params.postType);
    }
    return JSON.parse(JSON.stringify(results.sort((a,b) => b.createdAt.localeCompare(a.createdAt))));
};

export const getPost = async (id: string): Promise<CmsPost | null> => {
    await delay(300);
    const post = MOCK_POSTS.find(p => p.id === id);
    return post ? JSON.parse(JSON.stringify(post)) : null;
};

export const getPostBySlug = async (slug: string): Promise<CmsPost | null> => {
    await delay(300);
    const post = MOCK_POSTS.find(p => p.slug === slug && p.status === 'Published');
    return post ? JSON.parse(JSON.stringify(post)) : null;
};

export const createPost = async (input: Pick<CmsPost, 'title' | 'slug' | 'postType'>, actor: User): Promise<CmsPost> => {
    await delay(500);
    const newPost: CmsPost = {
        ...input,
        id: `post-${Date.now()}`,
        status: 'Draft',
        authorId: actor.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        seo: { title: '', description: '', keywords: '' },
        excerpt: '',
        content: '',
    };
    MOCK_POSTS.push(newPost);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'CMS', entityType: 'Post', entityId: newPost.id, entityDisplay: newPost.title });
    return newPost;
};

export const updatePost = async (id: string, update: Partial<Omit<CmsPost, 'id'>>, actor: User): Promise<CmsPost> => {
    await delay(500);
    const index = MOCK_POSTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Post not found");

    if (update.status && update.status !== MOCK_POSTS[index].status) {
        if (update.status === 'Published') {
            update.publishedAt = new Date().toISOString();
        }
    }
    
    const before = { ...MOCK_POSTS[index] };
    MOCK_POSTS[index] = { ...MOCK_POSTS[index], ...update, updatedAt: new Date().toISOString() };
    const after = MOCK_POSTS[index];

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'CMS', entityType: 'Post', entityId: id, entityDisplay: after.title, before, after });
    return after;
};
