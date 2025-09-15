import type { DigitalAsset } from '../types';

// --- MOCK DATA ---
const ASSETS: DigitalAsset[] = [
  // Videos
  { id: 'vid01', title: 'Introduction to Algebra', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Mathematics', createdAt: '2024-05-10' },
  { id: 'vid02', title: 'The Laws of Motion', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Physics', createdAt: '2024-05-11' },
  { id: 'vid03', title: 'Sonnet 18 Analysis', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Literature', createdAt: '2024-05-12' },
  { id: 'vid04', title: 'Cell Mitosis Explained', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Biology', createdAt: '2024-05-13' },
  { id: 'vid05', title: 'Lab Safety Procedures', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'General', createdAt: '2024-05-14' },
  { id: 'vid06', title: 'WWII: A Brief Overview', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'History', createdAt: '2024-05-15' },
  // Audios
  { id: 'aud01', title: 'The Great Gatsby - Chapter 1', kind: 'AUDIO', url: 'https://archive.org/download/great_gatsby_librivox/great_gatsby_01_fitzgerald.mp3', category: 'Literature', createdAt: '2024-05-16' },
  { id: 'aud02', title: 'Beethoven\'s Symphony No. 5', kind: 'AUDIO', url: 'https://archive.org/download/Symphony_No_5_in_C_Minor_Op_67/beethoven_symphony_5_1_allegro_con_brio.mp3', category: 'Music', createdAt: '2024-05-17' },
  { id: 'aud03', title: 'Martin Luther King "I Have a Dream"', kind: 'AUDIO', url: 'https://archive.org/download/MLKDream/MLK_IHaveADream.mp3', category: 'History', createdAt: '2024-05-18' },
  // Ebooks
  { id: 'ebk01', title: 'The Declaration of Independence', kind: 'EBOOK', url: 'https://www.archives.gov/founding-docs/declaration-transcript', category: 'History', createdAt: '2024-05-19' },
  { id: 'ebk02', title: 'Periodic Table of Elements', kind: 'EBOOK', url: 'https://pubchem.ncbi.nlm.nih.gov/ptable/periodic-table.pdf', category: 'Chemistry', createdAt: '2024-05-20' },
  { id: 'ebk03', title: 'A Tale of Two Cities', kind: 'EBOOK', url: 'https://www.gutenberg.org/files/98/98-h/98-h.htm', category: 'Literature', createdAt: '2024-05-21' },
];

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listAssets = async (): Promise<DigitalAsset[]> => {
  await delay(500);
  return Promise.resolve([...ASSETS]);
};

export const getAsset = async (id: string): Promise<DigitalAsset | null> => {
  await delay(300);
  const asset = ASSETS.find(a => a.id === id);
  return Promise.resolve(asset || null);
};
