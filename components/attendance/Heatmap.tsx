import React, { useMemo } from 'react';
import type { AttendanceRecord } from '../../types';

interface HeatmapProps {
    records: AttendanceRecord[];
    from: string;
    to: string;
}

const getColorClass = (rate: number | null): string => {
    if (rate === null) return 'bg-gray-100';
    if (rate < 70) return 'bg-red-300 hover:bg-red-400';
    if (rate < 80) return 'bg-amber-300 hover:bg-amber-400';
    if (rate < 90) return 'bg-green-200 hover:bg-green-300';
    if (rate < 95) return 'bg-green-300 hover:bg-green-400';
    return 'bg-green-500 hover:bg-green-600';
};

const Heatmap: React.FC<HeatmapProps> = ({ records, from, to }) => {
    const dailyData = useMemo(() => {
        const groupedByDate: Record<string, { present: number; total: number }> = {};
        for (const record of records) {
            if (!groupedByDate[record.date]) {
                groupedByDate[record.date] = { present: 0, total: 0 };
            }
            groupedByDate[record.date].total++;
            if (record.status === 'PRESENT' || record.status === 'LATE') {
                groupedByDate[record.date].present++;
            }
        }
        return groupedByDate;
    }, [records]);

    const dateRange = useMemo(() => {
        const dates = [];
        let currentDate = new Date(from);
        const endDate = new Date(to);
        
        // Adjust for timezone offset to prevent off-by-one day errors
        currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());
        endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());

        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }, [from, to]);
    
    if (dateRange.length === 0) {
        return <p className="text-sm text-gray-500">Select a valid date range to view the heatmap.</p>
    }

    return (
        <div>
            <div className="flex flex-wrap gap-1.5">
                {dateRange.map(dateStr => {
                    const data = dailyData[dateStr];
                    const rate = data && data.total > 0 ? (data.present / data.total) * 100 : null;
                    const colorClass = getColorClass(rate);
                    const title = rate !== null
                        ? `${dateStr}: ${rate.toFixed(1)}% present (${data.present}/${data.total})`
                        : `${dateStr}: No data`;
                    
                    return (
                        <div
                            key={dateStr}
                            title={title}
                            className={`w-8 h-8 rounded-sm ${colorClass} transition-colors`}
                            aria-label={title}
                        />
                    );
                })}
            </div>
            <div className="flex items-center space-x-4 mt-4 text-xs text-gray-600">
                <span>Less</span>
                <div className="w-4 h-4 rounded-sm bg-gray-100" title="No Data"></div>
                <div className="w-4 h-4 rounded-sm bg-red-300" title="<70%"></div>
                <div className="w-4 h-4 rounded-sm bg-amber-300" title="70-80%"></div>
                <div className="w-4 h-4 rounded-sm bg-green-200" title="80-90%"></div>
                <div className="w-4 h-4 rounded-sm bg-green-300" title="90-95%"></div>
                <div className="w-4 h-4 rounded-sm bg-green-500" title=">95%"></div>
                <span>More</span>
            </div>
        </div>
    );
};

export default Heatmap;