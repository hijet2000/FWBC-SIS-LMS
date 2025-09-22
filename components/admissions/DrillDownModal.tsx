
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Application } from '../../types';
import Modal from '../ui/Modal';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  applications: Application[];
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({ isOpen, onClose, title, applications }) => {
    const { siteId } = useParams<{ siteId: string }>();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                {applications.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {applications.map(app => (
                            <li key={app.id} className="py-3">
                                <Link to={`/school/${siteId}/admissions/applications/${app.id}`} className="text-indigo-600 hover:underline font-medium text-sm">
                                    {app.applicantName}
                                </Link>
                                <p className="text-xs text-gray-500">Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-sm">No applications to display for this category.</p>
                )}
            </div>
             <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default DrillDownModal;