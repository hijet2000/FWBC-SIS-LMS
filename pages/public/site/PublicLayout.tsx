
import React from 'react';
import { Outlet, Link, useParams, NavLink } from 'react-router-dom';

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
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to={`/site/${siteId}`} className="font-bold text-xl text-gray-800">FWBC</Link>
                        <div className="hidden md:flex space-x-8">
                            {menuItems.map(item => (
                                <NavLink 
                                key={item.slug} 
                                to={item.slug} 
                                className={({ isActive }) => `text-gray-600 hover:text-indigo-600 font-medium ${isActive ? 'text-indigo-600' : ''}`}
                                end={item.slug.split('/').length <= 3} // end=true for home page
                                >
                                    {item.title}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </nav>
            </header>
            <main className="flex-grow">
                <Outlet />
            </main>
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto text-center text-gray-400">
                    &copy; {new Date().getFullYear()} FWBC School. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
