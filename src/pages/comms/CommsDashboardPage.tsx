import React from 'react';
import { Link, useParams } from 'react-router-dom';

const KpiCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-4xl font-bold text-gray-800">{value}</p>
    </div>
);

const ActionCard: React.FC<{ title: string, description: string, to: string }> = ({ title, description, to }) => (
    <Link to={to} className="block bg-white p-6 rounded-lg shadow-sm border hover:shadow-md hover:border-indigo-500 transition-all">
        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
);


const CommsDashboardPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Communications Hub</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Messages Sent (24h)" value="1,204" />
                <KpiCard title="Delivery Rate" value="99.2%" />
                <KpiCard title="Active Campaigns" value="3" />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ActionCard title="New Campaign" description="Send a new message to an audience." to={`/school/${siteId}/communications/campaigns/new`} />
                <ActionCard title="Audiences" description="Manage recipient lists and segments." to={`/school/${siteId}/communications/audiences`} />
                <ActionCard title="Templates" description="Create and edit message templates." to={`/school/${siteId}/communications/templates`} />
                <ActionCard title="Campaign Logs" description="View history and stats of all campaigns." to={`/school/${siteId}/communications/campaigns`} />
                <ActionCard title="Message Logs" description="Search and filter all individual messages." to={`/school/${siteId}/communications/logs`} />
                <ActionCard title="Settings" description="Configure channels and compliance." to={`/school/${siteId}/communications/settings`} />
            </div>
        </div>
    );
};

export default CommsDashboardPage;