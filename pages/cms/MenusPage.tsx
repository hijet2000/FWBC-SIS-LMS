
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listMenus, saveMenu } from '../../lib/cmsService';

const MenusPage: React.FC = () => {
    const { user } = useAuth();
    const [menus, setMenus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingMenu, setEditingMenu] = useState<any>(null);

    const fetchData = () => {
        listMenus().then(setMenus).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    useEffect(() => {
        if(menus.length > 0 && !editingMenu) {
            setEditingMenu(JSON.parse(JSON.stringify(menus[0]))); // Deep copy
        }
    }, [menus, editingMenu]);

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...editingMenu.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditingMenu({ ...editingMenu, items: newItems });
    };
    
    const handleSave = async () => {
        if (!user) return;
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
                    {editingMenu?.items.map((item: any, index: number) => (
                        <div key={index} className="flex gap-2">
                            <input value={item.title} onChange={e => handleItemChange(index, 'title', e.target.value)} placeholder="Title" className="w-full" />
                            <input value={item.url} onChange={e => handleItemChange(index, 'url', e.target.value)} placeholder="URL" className="w-full" />
                        </div>
                    ))}
                </div>
                <button onClick={handleSave} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md">Save Menu</button>
            </div>
        </div>
    );
};

export default MenusPage;
