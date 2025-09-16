// A base structure for keys, following TanStack Query conventions.
const createQueryKeys = <T extends string>(key: T) => ({
  all: [key] as const,
  lists: () => [...createQueryKeys(key).all, 'list'] as const,
  list: <F extends object>(filters: F) => [...createQueryKeys(key).lists(), filters] as const,
  details: () => [...createQueryKeys(key).all, 'detail'] as const,
  detail: <I extends string | number>(id: I) => [...createQueryKeys(key).details(), id] as const,
});

// SIS
export const studentKeys = createQueryKeys('students');
export const classKeys = createQueryKeys('classes');
export const attendanceKeys = createQueryKeys('attendance');
export const academicsKeys = {
  ...createQueryKeys('academics'),
  subjects: createQueryKeys('subjects'),
  teachers: createQueryKeys('teachers'),
  mappings: createQueryKeys('mappings'),
  exams: createQueryKeys('exams'),
};

// LMS
export const lmsKeys = {
  ...createQueryKeys('lms'),
  courses: createQueryKeys('courses'),
  digitalAssets: createQueryKeys('digitalAssets'),
  catchup: {
    ...createQueryKeys('catchup'),
    progress: createQueryKeys('watchProgress'),
    policy: createQueryKeys('catchupPolicy'),
    quiz: createQueryKeys('catchupQuiz'),
  },
};

// Homework
export const homeworkKeys = {
    ...createQueryKeys('homework'),
    submissions: createQueryKeys('submissions'),
    reports: createQueryKeys('homeworkReports'),
};


// Fees
export const feeKeys = {
  ...createQueryKeys('fees'),
  items: createQueryKeys('feeItems'),
  invoices: createQueryKeys('invoices'),
};

// Transport
export const transportKeys = {
  ...createQueryKeys('transport'),
  vehicles: createQueryKeys('vehicles'),
  drivers: createQueryKeys('drivers'),
  routes: createQueryKeys('routes'),
  trips: createQueryKeys('trips'),
  eligibleStudents: createQueryKeys('eligibleStudents'),
  boardingEvents: createQueryKeys('boardingEvents'),
  alertSettings: createQueryKeys('alertSettings'),
};

// Admin
export const adminKeys = {
  ...createQueryKeys('admin'),
  auditEvents: createQueryKeys('auditEvents'),
  users: createQueryKeys('users'),
  userSessions: createQueryKeys('userSessions'),
};
