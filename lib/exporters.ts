interface CsvHeader {
    key: string;
    label: string;
}

export const exportToCsv = (filename: string, headers: CsvHeader[], data: Record<string, any>[]) => {
    const processRow = (row: Record<string, any>): string => {
        const values = headers.map(header => {
            const value = row[header.key];
            if (value === null || value === undefined) {
                return '';
            }
            const stringValue = String(value);
            // Escape quotes and wrap in quotes if it contains a comma, newline, or quote
            if (/[",\n]/.test(stringValue)) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        return values.join(',');
    };

    const csvContent = [
        headers.map(h => h.label).join(','),
        ...data.map(processRow)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
