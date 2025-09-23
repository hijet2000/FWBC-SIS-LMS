import type { Employee, LeaveApplication, User, LeaveStatus, Payslip } from '../types';
import { logAuditEvent } from './auditService';

// MOCK DATA
// Using teacher IDs where possible to link data
let MOCK_EMPLOYEES: Employee[] = [
    { id: 't-1', staffId: 'ST-001', fullName: 'Mr. Alan Turing', role: 'Mathematics Teacher', department: 'Academics', status: 'Active', contract: { type: 'Full-time', startDate: '2022-08-01' }, contact: { email: 'a.turing@fwbc.edu', phone: '555-0201' }, payroll: { basicSalary: 45000, allowances: [] } },
    { id: 't-2', staffId: 'ST-002', fullName: 'Ms. Marie Curie', role: 'Physics Teacher', department: 'Academics', status: 'Active', contract: { type: 'Full-time', startDate: '2021-09-01' }, contact: { email: 'm.curie@fwbc.edu', phone: '555-0202' }, payroll: { basicSalary: 48000, allowances: [{ name: 'Lab Supervisor', amount: 2000 }] } },
    { id: 'user-evelyn-reed', staffId: 'ST-000', fullName: 'Dr. Evelyn Reed', role: 'Head Teacher', department: 'Management', status: 'Active', contract: { type: 'Full-time', startDate: '2019-01-15' }, contact: { email: 'e.reed@fwbc.edu', phone: '555-0200' }, payroll: { basicSalary: 75000, allowances: [] } },
    { id: 'admin-01', staffId: 'ST-101', fullName: 'Mr. David Brent', role: 'Office Manager', department: 'Administration', status: 'Active', contract: { type: 'Full-time', startDate: '2023-02-01' }, contact: { email: 'd.brent@fwbc.edu', phone: '555-0301' }, payroll: { basicSalary: 35000, allowances: [] } },
    { id: 'admin-02', staffId: 'ST-102', fullName: 'Ms. Janine Melnitz', role: 'Receptionist', department: 'Administration', status: 'On Leave', contract: { type: 'Part-time', startDate: '2023-05-10' }, contact: { email: 'j.melnitz@fwbc.edu', phone: '555-0302' }, payroll: { basicSalary: 22000, allowances: [] } },
];

let MOCK_LEAVE: LeaveApplication[] = [
    { id: 'leave-1', employeeId: 't-1', leaveType: 'Sick', startDate: '2025-09-10', endDate: '2025-09-11', reason: 'Flu', status: 'Approved', requestedAt: new Date().toISOString() },
    { id: 'leave-2', employeeId: 't-2', leaveType: 'Annual', startDate: '2025-10-20', endDate: '2025-10-24', reason: 'Family vacation', status: 'Pending', requestedAt: new Date().toISOString() },
    { id: 'leave-3', employeeId: 'admin-02', leaveType: 'Maternity', startDate: '2025-08-01', endDate: '2026-02-01', reason: 'Maternity Leave', status: 'Approved', requestedAt: new Date().toISOString() },
];

let MOCK_PAYSLIPS: Payslip[] = [];


const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getHrDashboardSummary = async (): Promise<{ totalEmployees: number, onLeave: number, pendingLeave: number }> => {
    await delay(400);
    const totalEmployees = MOCK_EMPLOYEES.filter(e => e.status !== 'Terminated').length;
    const onLeave = MOCK_EMPLOYEES.filter(e => e.status === 'On Leave').length;
    const pendingLeave = MOCK_LEAVE.filter(l => l.status === 'Pending').length;
    return { totalEmployees, onLeave, pendingLeave };
};

export const listEmployees = async (): Promise<Employee[]> => {
    await delay(500);
    return JSON.parse(JSON.stringify(MOCK_EMPLOYEES));
};

export const listLeaveApplications = async (): Promise<LeaveApplication[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(MOCK_LEAVE.sort((a,b) => b.requestedAt.localeCompare(a.requestedAt))));
};

export const updateLeaveApplicationStatus = async (id: string, status: 'Approved' | 'Rejected', actor: User): Promise<LeaveApplication> => {
    await delay(500);
    const index = MOCK_LEAVE.findIndex(l => l.id === id);
    if (index === -1) throw new Error("Leave application not found");
    
    const before = { ...MOCK_LEAVE[index] };
    MOCK_LEAVE[index].status = status;
    MOCK_LEAVE[index].reviewedBy = actor.id;
    MOCK_LEAVE[index].reviewedAt = new Date().toISOString();
    const after = MOCK_LEAVE[index];

    // If approved, update employee status to 'On Leave' if the leave period covers today
    const today = new Date();
    const startDate = new Date(after.startDate);
    const endDate = new Date(after.endDate);
    if (status === 'Approved' && today >= startDate && today <= endDate) {
        const employee = MOCK_EMPLOYEES.find(e => e.id === after.employeeId);
        if (employee) {
            employee.status = 'On Leave';
        }
    }

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HR', entityType: 'LeaveApplication', entityId: id, entityDisplay: `Leave for ${after.employeeId}`, before, after });

    return after;
};

// --- Payroll Functions ---

export const listPayslips = async (period: string): Promise<Payslip[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(MOCK_PAYSLIPS.filter(p => p.period === period)));
};

export const runPayrollForPeriod = async (period: string, actor: User): Promise<{ payslipCount: number; totalGross: number; totalNet: number; }> => {
    await delay(1500); // Simulate a longer process
    
    // Prevent re-running payroll for the same period
    if (MOCK_PAYSLIPS.some(p => p.period === period)) {
        throw new Error("Payroll has already been run for this period.");
    }
    
    const employeesToPay = MOCK_EMPLOYEES.filter(e => e.status === 'Active');
    const newPayslips: Payslip[] = [];
    let totalGross = 0;
    let totalNet = 0;
    
    employeesToPay.forEach(employee => {
        const grossSalary = (employee.payroll.basicSalary / 12) + employee.payroll.allowances.reduce((sum, a) => sum + a.amount, 0);
        // Simple mock tax deduction
        const taxDeduction = { name: 'PAYE Tax', amount: grossSalary * 0.20 };
        const deductions = [taxDeduction];
        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
        const netSalary = grossSalary - totalDeductions;

        const payslip: Payslip = {
            id: `ps-${period}-${employee.id}`,
            employeeId: employee.id,
            period,
            grossSalary: parseFloat(grossSalary.toFixed(2)),
            deductions: deductions.map(d => ({...d, amount: parseFloat(d.amount.toFixed(2))})),
            netSalary: parseFloat(netSalary.toFixed(2)),
            generatedAt: new Date().toISOString(),
        };
        newPayslips.push(payslip);
        totalGross += payslip.grossSalary;
        totalNet += payslip.netSalary;
    });

    MOCK_PAYSLIPS.push(...newPayslips);

    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'RUN_PAYROLL',
        module: 'PAYROLL',
        entityType: 'PayrollRun',
        entityId: period,
        entityDisplay: `Payroll for ${period}`,
        meta: {
            payslipCount: newPayslips.length,
            totalGross,
            totalNet
        }
    });

    return { payslipCount: newPayslips.length, totalGross, totalNet };
};