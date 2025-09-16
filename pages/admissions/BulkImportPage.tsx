import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { bulkImportApplications } from '../../lib/admissionsService';
import type { CsvValidationError, Application } from '../../types';

// Simple CSV parser
const parseCsv = (csvText: string): { headers: string[], rows: Record<string, string>[] } => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
            row[header] = values[i]?.trim() || '';
        });
        return row;
    });
    return { headers, rows };
};


const BulkImportPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [csvText, setCsvText] = useState('');
    const [validationResult, setValidationResult] = useState<{ valid: Partial<Application>[], errors: CsvValidationError[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleValidate = () => {
        if (!csvText.trim()) {
            addToast('Please paste CSV data first.', 'warning');
            return;
        }

        const { headers, rows } = parseCsv(csvText);
        const requiredHeaders = ['fullName', 'dob', 'guardianEmail', 'desiredClassId'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            addToast(`CSV must contain headers: ${requiredHeaders.join(', ')}`, 'error');
            return;
        }
        
        const valid: Partial<Application>[] = [];
        const errors: CsvValidationError[] = [];

        rows.forEach((row, i) => {
            let hasError = false;
            requiredHeaders.forEach(header => {
                if (!row[header]) {
                    errors.push({ rowIndex: i + 1, field: header, message: 'Missing required field' });
                    hasError = true;
                }
            });
            if (!/^\S+@\S+\.\S+$/.test(row.guardianEmail)) {
                 errors.push({ rowIndex: i + 1, field: 'guardianEmail', message: 'Invalid email format' });
                 hasError = true;
            }

            if (!hasError) {
                valid.push({
                    applicantDetails: { fullName: row.fullName, dob: row.dob, gender: 'Other', nationality: '', priorSchool: '' },
                    guardians: [{ name: 'Guardian', relationship: 'Guardian', email: row.guardianEmail, phone: '', address: '' }],
                    desiredClassId: row.desiredClassId,
                    documents: [],
                    intakeSession: '2025-2026',
                    applicantName: row.fullName,
                    screeningChecklist: { ageEligibility: false, prerequisitesMet: false, catchmentArea: false },
                    interviewDetails: {},
                    decisionDetails: {},
                });
            }
        });

        setValidationResult({ valid, errors });
    };

    const handleImport = async () => {
        if (!user || !validationResult || validationResult.errors.length > 0 || validationResult.valid.length === 0) {
            addToast('Cannot import data with errors or no valid records.', 'error');
            return;
        }
        setIsImporting(true);
        try {
            await bulkImportApplications(validationResult.valid as any, user);
            addToast(`${validationResult.valid.length} applications imported successfully!`, 'success');
            setCsvText('');
            setValidationResult(null);
        } catch {
            addToast('Bulk import failed on the server.', 'error');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Bulk Import Applications</h1>
            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                <textarea
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    placeholder="Paste CSV data here. Required headers: fullName, dob, guardianEmail, desiredClassId"
                    className="w-full h-48 font-mono text-sm"
                />
                <div className="flex gap-4">
                    <button onClick={handleValidate} className="px-4 py-2 bg-blue-600 text-white rounded-md">Validate Data</button>
                    <button onClick={handleImport} disabled={isImporting || !validationResult || validationResult.errors.length > 0 || validationResult.valid.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">
                        {isImporting ? 'Importing...' : `Import ${validationResult?.valid.length || 0} Records`}
                    </button>
                </div>
            </div>
            {validationResult && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold">Validation Report</h2>
                    <p className="text-green-600">{validationResult.valid.length} valid records found.</p>
                    <p className="text-red-600">{validationResult.errors.length} errors found.</p>
                    {validationResult.errors.length > 0 && (
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside max-h-48 overflow-y-auto">
                            {validationResult.errors.map((err, i) => (
                                <li key={i}>Row {err.rowIndex + 1}: Field '{err.field}' - {err.message}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default BulkImportPage;