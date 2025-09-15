import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { getClasses, getStudents } from '../lib/schoolService';
import type { SchoolClass, Student } from '../types';

const STUDENTS_PER_PAGE = 10;

// A simple debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// --- Pagination Component ---
interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}
const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6" aria-label="Pagination">
            <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
            </div>
            <div className="flex flex-1 justify-between sm:justify-end">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </nav>
    );
};


const StudentsPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data states
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states from URL
    const classIdFilter = searchParams.get('classId') || '';
    const queryFilter = searchParams.get('q') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    
    // Local state for debouncing search input
    const [searchTerm, setSearchTerm] = useState(queryFilter);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Fetch classes on mount
    useEffect(() => {
        getClasses()
            .then(data => setClasses(data))
            .catch(() => setError('Could not load class information.'));
    }, []);

    // Update URL when debounced search term changes, resetting to page 1
    useEffect(() => {
        if (debouncedSearchTerm !== queryFilter) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                if (debouncedSearchTerm) {
                    newParams.set('q', debouncedSearchTerm);
                } else {
                    newParams.delete('q');
                }
                newParams.set('page', '1');
                return newParams;
            }, { replace: true });
        }
    }, [debouncedSearchTerm, queryFilter, setSearchParams]);

    // Fetch filtered & paginated students when URL filters change
    useEffect(() => {
        setLoading(true);
        setError(null);

        getStudents({ classId: classIdFilter, q: queryFilter, page: currentPage, limit: STUDENTS_PER_PAGE })
            .then(({ students: paginatedStudents, total }) => {
                setStudents(paginatedStudents);
                setTotalStudents(total);
                setTotalPages(Math.ceil(total / STUDENTS_PER_PAGE));
            })
            .catch(() => setError('An error occurred while fetching students.'))
            .finally(() => setLoading(false));

    }, [classIdFilter, queryFilter, currentPage]);
    
    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClassId = e.target.value;
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (newClassId) {
                newParams.set('classId', newClassId);
            } else {
                newParams.delete('classId');
            }
            newParams.set('page', '1'); // Reset to page 1 on filter change
            return newParams;
        }, { replace: true });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('page', newPage.toString());
                return newParams;
            }, { replace: true });
        }
    };
    
    const classMap = new Map(classes.map(c => [c.id, c.name]));
    
    const getStatusText = () => {
        if (loading) return 'Searching...';
        if (totalStudents === 0) return 'Showing 0 of 0 students.';
        const first = (currentPage - 1) * STUDENTS_PER_PAGE + 1;
        const last = first + students.length - 1;
        return `Showing ${first}–${last} of ${totalStudents} students.`;
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    </tr>
                ))
            );
        }

        if (error) {
            return (
                <tr>
                    <td colSpan={4} className="py-8 text-center text-red-600">{error}</td>
                </tr>
            );
        }

        if (students.length === 0) {
            return (
                <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                        No students found. Try adjusting your filters.
                    </td>
                </tr>
            );
        }

        return students.map(student => (
            <tr key={student.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    <Link 
                        to={`/school/${siteId}/students/${student.id}`} 
                        className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    >
                        {student.name}
                    </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{student.admissionNo}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{classMap.get(student.classId) || 'N/A'}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                   <Link to={`/school/${siteId}/students/${student.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                </td>
            </tr>
        ));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Students</h1>
                 <p className="mt-1 text-sm text-gray-500">{getStatusText()}</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 md:max-w-xs">
                    <label htmlFor="class-filter" className="sr-only">Filter by class</label>
                    <select
                        id="class-filter"
                        value={classIdFilter}
                        onChange={handleClassChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label htmlFor="search" className="sr-only">Search</label>
                    <input
                        type="search"
                        id="search"
                        placeholder="Search name or admission no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Admission No</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Class</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {renderTableBody()}
                                </tbody>
                            </table>
                             <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentsPage;