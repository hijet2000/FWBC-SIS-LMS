import React, { useState, useEffect } from 'react';
import { Outlet, Link, useParams } from 'react-router-dom';
import * as cmsService from '../../lib/cmsService';
import type { WebsiteSettings, Menu } from '../../types';

const PublicLayout: React.FC = () => {
    const { siteSlug } = useParams<{ siteSlug: string }>();
    const [settings, setSettings] = useState<WebsiteSettings | null>(null);
    const [mainMenu, setMainMenu] = useState<Menu | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            cmsService.getSettings(),
            cmsService.getMenu('main-nav')
        ]).then(([settingsData, menuData]) => {
            setSettings(settingsData);
            setMainMenu(menuData);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (settings) {
            document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
        }
        return () => {
             document.documentElement.style.removeProperty('--primary-color');
        }
    }, [settings]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
             {settings?.primaryColor && (
                <style>{`:root { --primary-color: ${settings.primaryColor}; }`}</style>
            )}
            <header className="bg-white shadow-sm">
                <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to={`/${siteSlug}`} className="text-xl font-bold text-gray-800">{settings?.siteTitle || 'FWBC School'}</Link>
                        <div className="flex space-x-4">
                            {!loading && mainMenu?.items.map(item => (
                                <Link key={item.id} to={item.type === 'page' ? `/${siteSlug}/p/${item.value}` : item.value} className="text-gray-600 hover:text-gray-900">{item.label}</Link>
                            ))}
                            <Link to="/school/site_123" className="font-semibold" style={{ color: 'var(--primary-color)' }}>Staff Login</Link>
                        </div>
                    </div>
                </nav>
            </header>
            <main className="flex-grow">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet />
                </div>
            </main>
            <footer className="bg-gray-800 text-white">
                 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm">
                    <p>&copy; {new Date().getFullYear()} {settings?.siteTitle || 'FWBC School'}. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;