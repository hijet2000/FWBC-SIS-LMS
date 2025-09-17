
import React from 'react';
import { Link, useParams } from 'react-router-dom';

const ActionCard: React.FC<{ title: string, description: string, to: string }> = ({ title, description, to }) => (
    <Link to={to} className="block bg-white p-6 rounded-lg shadow-sm border hover:shadow-md hover:border-indigo-500">
        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
);

const CmsDashboardPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();

    const actions = [
        { title: 'Pages', description: 'Manage website pages like Home, About, etc.', to: `/school/${siteId}/cms/pages` },
        { title: 'Menus', description: 'Control the main navigation structure.', to: `/school/${siteId}/cms/menus` },
        { title: 'News', description: 'Create and publish news articles.', to: `/school/${siteId}/cms/news` },
        { title: 'Events', description: 'Manage the school events calendar.', to: `/school/${siteId}/cms/events` },
        { title: 'Media Library', description: 'Upload and manage images and documents.', to: `/school/${siteId}/cms/media` },
        { title: 'Settings', description: 'Configure site title and maintenance mode.', to: `/school/${siteId}/cms/settings` },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Content Management System</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {actions.map(action => (
                    <ActionCard key={action.title} {...action} />
                ))}
            </div>
        </div>
    );
};

export default CmsDashboardPage;
