import React from 'react';

interface JsonDiffViewerProps {
  before?: any;
  after?: any;
}

const getDiff = (before: any, after: any) => {
    if (!before || !after || typeof before !== 'object' || typeof after !== 'object') {
        return null;
    }
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    const diff: Record<string, { before: any, after: any, type: 'added' | 'removed' | 'changed' | 'same'}> = {};

    for (const key of allKeys) {
        const beforeVal = JSON.stringify(before[key]);
        const afterVal = JSON.stringify(after[key]);

        if (!(key in before)) {
            diff[key] = { before: undefined, after: after[key], type: 'added' };
        } else if (!(key in after)) {
            diff[key] = { before: before[key], after: undefined, type: 'removed' };
        } else if (beforeVal !== afterVal) {
            diff[key] = { before: before[key], after: after[key], type: 'changed' };
        }
    }
    return diff;
};

const JsonDiffViewer: React.FC<JsonDiffViewerProps> = ({ before, after }) => {
    const diff = getDiff(before, after);

    if (!diff || Object.keys(diff).length === 0) {
        return null;
    }

    return (
        <div>
            <h3 className="font-semibold text-gray-700 mb-2">Changes</h3>
            <div className="text-xs font-mono bg-gray-50 p-3 rounded-md border space-y-1">
                {Object.entries(diff).map(([key, value]) => {
                    if (value.type === 'added') {
                        return <div key={key} className="text-green-700">+ {key}: {JSON.stringify(value.after)}</div>;
                    }
                    if (value.type === 'removed') {
                        return <div key={key} className="text-red-700">- {key}: {JSON.stringify(value.before)}</div>;
                    }
                    if (value.type === 'changed') {
                        return (
                            <div key={key}>
                                <span className="text-amber-700">~ {key}: </span>
                                <span className="text-red-700 line-through">{JSON.stringify(value.before)}</span>
                                <span className="text-green-700"> {'->'} {JSON.stringify(value.after)}</span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

export default JsonDiffViewer;