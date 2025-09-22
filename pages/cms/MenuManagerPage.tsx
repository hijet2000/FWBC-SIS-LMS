
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as cmsService from '../../lib/cmsService';
import type { Menu, MenuItem, CmsPage } from '../../types';
import Modal from '../../components/ui/Modal';

// --- MenuItemForm Modal ---
interface MenuItemFormProps {
  item: Partial<MenuItem> | null;
  onSave: (item: Omit<MenuItem, 'id' | 'order' | 'children'>) => void;
  onClose: () => void;
  pages: CmsPage[];
}
const MenuItemForm: React.FC<MenuItemFormProps> = ({ item, onSave, onClose, pages }) => {
    const [formData, setFormData] = useState({
        label: item?.label || '',
        type: item?.type || 'page' as 'page' | 'url',
        value: item?.value || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} placeholder="Label (e.g., Home)" required className="w-full rounded-md" />
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any, value: '' })} className="w-full rounded-md">
                <option value="page">Page Link</option>
                <option value="url">Custom URL</option>
            </select>
            {formData.type === 'page' ? (
                <select value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} className="w-full rounded-md" required>
                    <option value="">-- Select a Page --</option>
                    {pages.map(p => <option key={p.id} value={p.slug}>{p.title}</option>)}
                </select>
            ) : (
                <input value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder="https://example.com" required className="w-full rounded-md" />
            )}
             <div className="bg-gray-50 -mx-6 -mb-6 mt-6 px-6 py-3 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-md">Save Item</button>
            </div>
        </form>
    );
};

// --- Main Menu Manager Page ---
const MenuManagerPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [menu, setMenu] = useState<Menu | null>(null);
    const [pages, setPages] = useState<CmsPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            cmsService.getMenu('main-nav'),
            cmsService.listPages()
        ]).then(([menuData, pageData]) => {
            setMenu(menuData);
            setPages(pageData.filter(p => p.status === 'Published'));
        }).catch(() => addToast('Failed to load menu data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveMenu = async () => {
        if (!menu || !user) return;
        setIsSaving(true);
        try {
            await cmsService.updateMenu('main-nav', menu, user);
            addToast('Menu saved successfully!', 'success');
        } catch {
            addToast('Failed to save menu.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleModalSave = (itemData: Omit<MenuItem, 'id' | 'order' | 'children'>) => {
        if (!menu) return;
        if (editingItem && 'id' in editingItem) { // Editing existing
            setMenu({ ...menu, items: menu.items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i) });
        } else { // Adding new
            const newItem: MenuItem = { ...itemData, id: `item-${Date.now()}`, order: menu.items.length + 1, children: [] };
            setMenu({ ...menu, items: [...menu.items, newItem] });
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };
    
    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (!menu) return;
        const newItems = [...menu.items];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newItems.length) return;
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        setMenu({ ...menu, items: newItems.map((item, i) => ({ ...item, order: i + 1 })) });
    };

    const handleDelete = (id: string) => {
        if (!menu) return;
        setMenu({ ...menu, items: menu.items.filter(i => i.id !== id).map((item, i) => ({ ...item, order: i + 1 })) });
    };

    if (loading) return <div>Loading menu manager...</div>;
    if (!menu) return <div>Menu not found.</div>;

    return (
        <div className="space-y-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Menu Item" : "Add Menu Item"}>
                <div className="p-6">
                    <MenuItemForm item={editingItem} onSave={handleModalSave} onClose={() => setIsModalOpen(false)} pages={pages} />
                </div>
            </Modal>
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Menu Manager</h1>
                <div className="flex gap-2">
                    <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-4 py-2 text-sm bg-white border rounded-md">Add Item</button>
                    <button onClick={handleSaveMenu} disabled={isSaving} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Menu'}
                    </button>
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <ul className="space-y-2">
                    {menu.items.sort((a,b) => a.order - b.order).map((item, index) => (
                        <li key={item.id} className="p-3 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-xs text-gray-500">{item.type === 'page' ? `/p/${item.value}` : item.value}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleMove(index, 'up')} disabled={index === 0}>↑</button>
                                <button onClick={() => handleMove(index, 'down')} disabled={index === menu.items.length - 1}>↓</button>
                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-sm text-blue-600">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="text-sm text-red-600">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MenuManagerPage;
