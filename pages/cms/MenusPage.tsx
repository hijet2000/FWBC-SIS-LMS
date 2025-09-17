
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listMenus, saveMenu } from '../../lib/cmsService';
import { Menu, MenuItem } from '../../types';

const MenusPage: React.FC = () => {
    const { user } = useAuth();
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

    const fetchData = () => {
        listMenus().then(data => {
            setMenus(data);
            if (data.length > 0 && !editingMenu) {
                setEditingMenu(JSON.parse(JSON.stringify(data[0])));
            }
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    
    const handleItemChange = (index: number, field: keyof MenuItem, value: string) => {
        if (!editingMenu) return;
        const newItems = [...editingMenu.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditingMenu({ ...editingMenu, items: newItems });
    };
    
    const handleSave = async () => {
        if (!user || !editingMenu) return;
        await saveMenu(editingMenu, user);
        fetchData(); // Refetch
    };

    if (loading) return <p>Loading menus...</p>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Menu Editor</h1>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold">{editingMenu?.name}</h2>
                <div className="mt-4 space-y-2">
                    {editingMenu?.items.map((item, index) => (
                        <div key={index} className="flex gap-2 p-2 border rounded-md">
                            <input value={item.title} onChange={e => handleItemChange(index, 'title', e.target.value)} placeholder="Title" className="w-full rounded-md border-gray-300" />
                            <input value={item.url} onChange={e => handleItemChange(index, 'url', e.target.value)} placeholder="URL (e.g. /about)" className="w-full rounded-md border-gray-300" />
                        </div>
                    ))}
                </div>
                <button onClick={handleSave} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">Save Menu</button>
            </div>
        </div>
    );
};

export default MenusPage;
