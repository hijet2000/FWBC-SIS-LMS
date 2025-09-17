
import React from 'react';
import { Outlet, Link, useParams } from 'react-router-dom';

const PublicLayout: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    // In a real app, menu items would be fetched from the CMS
    const menuItems = [
        { title: 'Home', slug: `/site/${siteId}` },
        { title: 'About', slug: `/site/${siteId}/about` },
        { title: 'News', slug: `/site/${siteId}/news` },
        { title: 'Contact', slug: `/site/${siteId}/contact` },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow-md">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <span className="font-bold text-lg">FWBC</span>
                        <div className="flex space-x-4">
                            {menuItems.map(item => (
                                <Link key={item.slug} to={item.slug} className="text-gray-600 hover:text-indigo-600">{item.title}</Link>
                            ))}
                        </div>
                    </div>
                </nav>
            </header>
            <main className="flex-grow">
                <Outlet />
            </main>
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto text-center">
                    &copy; {new Date().getFullYear()} FWBC School. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
