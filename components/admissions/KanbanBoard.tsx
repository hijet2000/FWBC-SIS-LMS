import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Application, ApplicationStatus } from '../../types';

const columns: ApplicationStatus[] = ['New', 'Screening', 'DocsMissing', 'Interview', 'Offer', 'Accepted', 'Approved', 'Rejected', 'Waitlist', 'Withdrawn'];

const statusStyles: Record<ApplicationStatus, { bg: string, text: string }> = {
    New: { bg: 'bg-blue-100', text: 'text-blue-800' },
    Screening: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    DocsMissing: { bg: 'bg-orange-100', text: 'text-orange-800' },
    Interview: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    Offer: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    Accepted: { bg: 'bg-green-100', text: 'text-green-800' },
    Approved: { bg: 'bg-teal-100', text: 'text-teal-800' },
    Rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    Waitlist: { bg: 'bg-purple-100', text: 'text-purple-800' },
    Withdrawn: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const KanbanCard: React.FC<{ application: Application; classMap: Map<string, string> }> = ({ application, classMap }) => {
    const { siteId } = useParams<{ siteId: string }>();
    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('applicationId', application.id);
    };

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            className="bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-3 cursor-grab active:cursor-grabbing"
        >
            <Link to={`/school/${siteId}/admissions/applications/${application.id}`} className="block hover:bg-gray-50 -m-3 p-3 rounded-md">
                <p className="font-semibold text-sm text-gray-800">{application.applicantName}</p>
                <p className="text-xs text-gray-500">{classMap.get(application.desiredClassId) || 'Unknown Class'}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(application.submittedAt).toLocaleDateString()}</p>
            </Link>
        </div>
    );
};

interface KanbanColumnProps {
    status: ApplicationStatus;
    applications: Application[];
    classMap: Map<string, string>;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}
const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, applications, classMap, onDrop }) => {
    const [isOver, setIsOver] = useState(false);
    
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };
    
    const onDragLeave = () => setIsOver(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        onDrop(e);
        setIsOver(false);
    };

    return (
        <div 
            onDrop={handleDrop} 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`flex-1 bg-gray-50 p-3 rounded-lg border-2 ${isOver ? 'border-indigo-500' : 'border-dashed border-gray-200'} min-w-[280px]`}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">{status}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyles[status].bg} ${statusStyles[status].text}`}>{applications.length}</span>
            </div>
            <div className="space-y-2 h-full overflow-y-auto">
                {applications.map(app => (
                    <KanbanCard key={app.id} application={app} classMap={classMap} />
                ))}
            </div>
        </div>
    );
};

interface KanbanBoardProps {
    applications: Application[];
    onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
    classMap: Map<string, string>;
}
const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, onStatusChange, classMap }) => {
    const handleDrop = (status: ApplicationStatus) => (e: React.DragEvent<HTMLElement>) => {
        const applicationId = e.dataTransfer.getData('applicationId');
        onStatusChange(applicationId, status);
    };

    return (
        <div className="flex space-x-4 h-full overflow-x-auto p-2 -m-2">
            {columns.map(status => (
                <KanbanColumn 
                    key={status}
                    status={status}
                    applications={applications.filter(app => app.status === status)}
                    classMap={classMap}
                    onDrop={handleDrop(status)}
                />
            ))}
        </div>
    );
};

export default KanbanBoard;