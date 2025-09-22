import React from 'react';
import { Outlet, Link, useParams } from 'react-router-dom';

const PublicLayout: React.FC = () => {
    const { siteSlug } = useParams<{ siteSlug: string }>();
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-white shadow-sm">
                <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to={`/${siteSlug}`} className="text-xl font-bold text-gray-800">FWBC School</Link>
                        <div className="flex space-x-4">
                            <Link to={`/${siteSlug}`} className="text-gray-600 hover:text-gray-900">Home</Link>
                            <Link to={`/${siteSlug}/p/about-us`} className="text-gray-600 hover:text-gray-900">About Us</Link>
                            <Link to={`/${siteSlug}/p/admissions-process`} className="text-gray-600 hover:text-gray-900">Admissions</Link>
                            <Link to="/school/site_123" className="text-indigo-600 font-semibold">Staff Login</Link>
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
                    <p>&copy; {new Date().getFullYear()} FWBC School. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
