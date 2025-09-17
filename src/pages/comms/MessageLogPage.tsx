import React, { useState, useEffect } from 'react';
import { listMessages } from '../../lib/commsService';
import { getStudents } from '../../lib/schoolService';
import type { Message, Student } from '../../types';

const MessageLogPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([listMessages({}), getStudents({limit: 5000})])
            .then(([msgData, { students }]) => {
                setMessages(msgData);
                setStudents(students);
            }).finally(() => setLoading(false));
    }, []);

    const studentMap = new Map(students.map(s => [s.id, s.name]));

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Message Log</h1>
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                 <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Recipient</th>
                        <th className="p-3 text-left text-xs uppercase">Channel</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-left text-xs uppercase">Sent At</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        messages.map(msg => (
                            <tr key={msg.id}>
                                <td className="p-3 font-medium">{studentMap.get(msg.recipientId) || 'Unknown'}</td>
                                <td className="p-3 text-sm">{msg.channel}</td>
                                <td className="p-3 text-sm">{msg.status}</td>
                                <td className="p-3 text-sm">{msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MessageLogPage;