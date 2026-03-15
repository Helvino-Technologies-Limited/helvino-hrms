'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronDown, ChevronRight, Download, BookOpen, HelpCircle } from 'lucide-react'

interface Section {
  heading: string
  body: string[]
}
interface Chapter {
  id: string
  title: string
  sections: Section[]
}

// ─── Content per role ────────────────────────────────────────────────────────

const STARTED: Chapter = {
  id: 'getting-started',
  title: '1. Getting Started',
  sections: [
    {
      heading: 'Accessing the System',
      body: [
        'Open your browser and navigate to https://helvino-hrms.onrender.com/login.',
        'Staff members (HR, Finance, Department Heads, Employees, Sales) log in using the "Staff Identity Login" tab: enter your National ID, Date of Birth (DD/MM/YYYY), and the Secret Code provided by HR.',
        'Administrators log in using the "Admin / Staff Login" tab: enter your email address and password.',
        'If you enter incorrect credentials 5 times in a row, your account will be locked for 30 minutes. Contact HR or your system administrator to unlock it sooner.',
      ],
    },
    {
      heading: 'Navigating the Dashboard',
      body: [
        'After login you land on the Dashboard. The left sidebar shows all modules available to your role.',
        'The top bar displays the current page title and today\'s date. Click the bell icon to view notifications.',
        'Click your avatar in the top-right corner to go to your profile.',
        'On mobile, tap the ☰ menu icon to open the sidebar. Tap outside it to close.',
        'To sign out, scroll to the bottom of the sidebar and click "Sign Out".',
      ],
    },
  ],
}

const PROFILE_CHAPTER: Chapter = {
  id: 'profile',
  title: 'My Profile & Business Card',
  sections: [
    {
      heading: 'Updating Your Profile',
      body: [
        'Go to My Profile in the sidebar.',
        'Update your personal details: phone number, personal email, address, emergency contact.',
        'Upload a profile photo by clicking the photo area and selecting an image.',
        'Click Save to apply changes.',
      ],
    },
    {
      heading: 'My Business Card',
      body: [
        'Go to My Business Card in the sidebar.',
        'Your digital business card is automatically generated from your profile data.',
        'Click "Download" to save it as an image you can share or print.',
      ],
    },
  ],
}

const SUPPORT_CHAPTER: Chapter = {
  id: 'support',
  title: 'Support & Help',
  sections: [
    {
      heading: 'Raising a Support Ticket',
      body: [
        'Go to Support Tickets in the sidebar.',
        'Click "New Ticket" and fill in the subject, description, and priority level.',
        'The support team will respond within 24 hours. You will see replies in the ticket thread.',
        'Once your issue is resolved, click "Close Ticket".',
      ],
    },
    {
      heading: 'Common Issues',
      body: [
        'Locked account: contact HR or your administrator — they can unlock via HR → Auth Credentials.',
        'Forgot secret code: contact HR to generate a new one. Your old code becomes invalid.',
        'Cannot see a module: your role may not have access. Contact your administrator.',
        'For urgent issues, call Helvino Technologies Ltd: 0703 445 756.',
      ],
    },
  ],
}

const ANNOUNCEMENTS_CHAPTER: Chapter = {
  id: 'announcements',
  title: 'Announcements',
  sections: [
    {
      heading: 'Viewing Announcements',
      body: [
        'Go to Announcements in the sidebar to see all company-wide notices.',
        'Urgent announcements appear with a red badge. High-priority ones appear in amber.',
        'The bell icon in the top bar shows a red dot when you have unread announcements. Click it to see a preview, then click "View all announcements" for the full list.',
        'Click "Mark all read" in the notification dropdown to clear the unread indicator.',
      ],
    },
  ],
}

const POLICIES_CHAPTER: Chapter = {
  id: 'policies',
  title: 'HR Policies',
  sections: [
    {
      heading: 'Reading Company Policies',
      body: [
        'Go to HR Policies in the sidebar.',
        'Browse the list of company policies. Click any policy to read it in full.',
        'Some policies require your acknowledgement. Click "Acknowledge" after reading to confirm compliance.',
        'Your acknowledgement date is recorded and visible to HR.',
      ],
    },
  ],
}

// ─── Role chapters ────────────────────────────────────────────────────────────

const CHAPTERS: Record<string, Chapter[]> = {

  SUPER_ADMIN: [
    STARTED,
    {
      id: 'admin-panel',
      title: '2. Administration Panel',
      sections: [
        {
          heading: 'Admin Overview',
          body: [
            'Go to Admin Panel in the sidebar (red Administration section).',
            'The admin panel provides a system-wide overview: total users, active sessions, and recent activity.',
            'From here you can manage system-level settings and perform bulk operations.',
          ],
        },
      ],
    },
    {
      id: 'employees',
      title: '3. Employee Management',
      sections: [
        {
          heading: 'Adding a New Employee',
          body: [
            'Go to Employees in the sidebar.',
            'Click "Add Employee". Fill in all tabs: Personal Info, Employment, Financial, and optionally Auth Credentials.',
            'Employee Code is auto-generated (e.g. HTL-0001). You can override it.',
            'Set the System Role to match the employee\'s access level: Employee, Sales Agent, Sales Manager, Department Head, HR Manager, Finance Officer, or Super Admin.',
            'Set Employment Status (Active, Probation, On Leave, etc.) and Employment Type (Full Time, Part Time, Contract, etc.).',
            'Click Save. The employee will appear in the list.',
          ],
        },
        {
          heading: 'Editing an Employee',
          body: [
            'Click the edit (pencil) icon on any employee row.',
            'Update any field across the tabs. Changing the System Role immediately changes what that employee sees when they log in.',
            'To deactivate an employee, set Employment Status to "Resigned" or "Terminated".',
          ],
        },
        {
          heading: 'Searching and Filtering',
          body: [
            'Use the search box to find employees by name, code, or email.',
            'Use the Department and Status dropdowns to filter the list.',
          ],
        },
      ],
    },
    {
      id: 'auth-creds',
      title: '4. Auth Credentials',
      sections: [
        {
          heading: 'Generating a Secret Code',
          body: [
            'Go to HR → Auth Credentials in the sidebar.',
            'Find the employee. The employee must have their National ID and Date of Birth saved in their profile first.',
            'Click "Generate Code". A unique secret code (e.g. HVN-XXXXX) is shown once — copy it and give it to the employee.',
            'The employee uses: their National ID + Date of Birth + this secret code to log in.',
            'If you need to reset the code, click "Generate Code" again. The old code stops working immediately.',
          ],
        },
        {
          heading: 'Locking and Unlocking Accounts',
          body: [
            'An employee account is locked automatically after 5 failed login attempts.',
            'To unlock it: find the employee in Auth Credentials and click "Unlock".',
            'To manually lock an account: click "Lock". This prevents the employee from logging in until unlocked.',
            'The login attempt history shows every login — date, IP address, and success/failure reason.',
          ],
        },
      ],
    },
    {
      id: 'departments',
      title: '5. Department Management',
      sections: [
        {
          heading: 'Creating and Managing Departments',
          body: [
            'Go to Departments in the sidebar.',
            'Click "Add Department". Enter the department name and assign a Department Head (must be an existing employee).',
            'Employees are assigned to departments when their profile is created or edited.',
            'Deleting a department is only possible if no employees are assigned to it.',
          ],
        },
      ],
    },
    {
      id: 'attendance-admin',
      title: '6. Attendance Management',
      sections: [
        {
          heading: 'Viewing Attendance Records',
          body: [
            'Go to Attendance in the sidebar.',
            'Select the month and year to view all staff attendance for that period.',
            'The table shows each record: employee, date, clock-in time, clock-out time, hours worked, and status (PRESENT, LATE, ABSENT).',
            'LATE is recorded when an employee clocks in after the official start time.',
          ],
        },
      ],
    },
    {
      id: 'leaves-admin',
      title: '7. Leave Management',
      sections: [
        {
          heading: 'Approving Leave Requests',
          body: [
            'Go to Leave Management in the sidebar.',
            'The Pending tab shows all requests awaiting approval.',
            'Click Approve or Reject on each request. Add a comment when rejecting.',
            'Approved leave deducts from the employee\'s leave balance for that leave type.',
          ],
        },
        {
          heading: 'Leave Types and Balances',
          body: [
            'Leave types include Annual Leave, Sick Leave, Maternity/Paternity Leave, and others.',
            'Leave balances are set per employee. Allocate them in the employee\'s profile under the Financial tab.',
            'HR can view all employees\' current leave balances from the Leave Management page.',
          ],
        },
      ],
    },
    {
      id: 'payroll-admin',
      title: '8. Payroll',
      sections: [
        {
          heading: 'Running Payroll',
          body: [
            'Go to Payroll in the sidebar.',
            'Click "Run Payroll" and select the month and year.',
            'The system calculates gross salary, PAYE (income tax), NHIF/SHA, and NSSF for each employee based on their basic salary and allowances in their profile.',
            'Review the summary and click Confirm to finalise the run.',
            'Once confirmed, employees can view their payslips under Payroll → My Payslip.',
          ],
        },
        {
          heading: 'Viewing Payroll History',
          body: [
            'The payroll list shows all runs by month. Click any row to see the full breakdown per employee.',
            'To export payslips, open an individual record and use the Download button.',
          ],
        },
      ],
    },
    {
      id: 'performance-admin',
      title: '9. Performance Management',
      sections: [
        {
          heading: 'Creating a Performance Review',
          body: [
            'Go to Performance in the sidebar.',
            'Click "New Review". Select the employee being reviewed, the review period, and the reviewer (usually their manager).',
            'Set a rating (1–5 stars) and fill in Strengths, Areas for Improvement, and Comments.',
            'Save the review. The employee can see it under their own Performance page.',
          ],
        },
      ],
    },
    {
      id: 'announcements-admin',
      title: '10. Announcements',
      sections: [
        {
          heading: 'Creating an Announcement',
          body: [
            'Go to Announcements in the sidebar.',
            'Click "New Announcement". Enter the title, content, and set the priority: Normal, High, or Urgent.',
            'Urgent announcements trigger a red notification badge for all staff.',
            'Set an expiry date to automatically hide the announcement after a certain date.',
            'Click Publish. All staff with access to announcements will see it in their notification feed.',
          ],
        },
      ],
    },
    {
      id: 'analytics-admin',
      title: '11. Analytics',
      sections: [
        {
          heading: 'Using the Analytics Dashboard',
          body: [
            'Go to Analytics in the sidebar.',
            'View: Total Employees, Active Employees, Present Today, Pending Leaves, Open Positions.',
            'Charts include: Headcount by Department (bar chart), Employment Type breakdown (pie chart), Headcount Growth over 12 months (line chart), and Payroll Summary.',
            'Data is live — it reflects the current state of the database.',
          ],
        },
      ],
    },
    {
      id: 'recruitment-admin',
      title: '12. Recruitment & ATS',
      sections: [
        {
          heading: 'Job Postings',
          body: [
            'Go to Recruitment → Job Postings.',
            'Click "Post a Job". Fill in the job title, department, description, requirements, and deadline.',
            'Set the status to Published to make it visible on the careers portal.',
            'Close a job posting when recruitment is complete.',
          ],
        },
        {
          heading: 'Managing Applications',
          body: [
            'Go to Recruitment → Applications.',
            'Each application shows the candidate\'s name, CV, cover letter, and current pipeline stage.',
            'Move candidates through stages: Applied → Screening → Interview → Offer → Hired / Rejected.',
          ],
        },
        {
          heading: 'Interviews',
          body: [
            'Go to Recruitment → Interviews to schedule and record interview outcomes.',
            'Set the interview date, time, interviewer, and format (in-person / video).',
            'Record the outcome and notes after the interview.',
          ],
        },
        {
          heading: 'Talent Pool & Onboarding',
          body: [
            'Talent Pool stores promising candidates who weren\'t hired yet but may be contacted in future.',
            'Onboarding Documents lets you upload documents new hires need to complete before starting.',
            'Offer Letters: generate a formal offer letter PDF for accepted candidates.',
          ],
        },
      ],
    },
    {
      id: 'sales-admin',
      title: '13. Sales & CRM',
      sections: [
        {
          heading: 'Sales Overview',
          body: [
            'Go to Sales & CRM → Sales Overview for KPIs: total leads, active clients, revenue, pending quotations.',
          ],
        },
        {
          heading: 'Leads',
          body: [
            'Go to Sales → Leads. All leads from all agents are visible.',
            'Add a lead: name, company, contact info, source, assigned agent, and expected close date.',
            'Move leads through stages: New → Contacted → Qualified → Proposal → Won / Lost.',
          ],
        },
        {
          heading: 'Quotations',
          body: [
            'Go to Sales → Quotations. Create a quotation: select a client, add line items from the service catalog, set quantities and prices.',
            'Send the quotation to the client. Status changes: Draft → Sent → Approved / Rejected.',
            'Approved quotations can be converted to invoices in Accounting.',
          ],
        },
        {
          heading: 'Clients, Subscriptions, Tasks, Services, Portfolio, Letters & Reports',
          body: [
            'Clients: add and manage client companies, assign a responsible agent.',
            'Subscriptions: manage recurring service subscriptions, track renewal dates and expiry.',
            'Sales Tasks: create tasks for agents, assign due dates and priorities.',
            'Service Catalog: define services the company offers (name, category, unit price). Only admins and HR can add/edit services.',
            'Portfolio: manage company portfolio items visible to clients.',
            'Official Letters: generate formal letters (proposal, termination, etc.) with company letterhead.',
            'Sales Reports: view revenue pipeline, lead conversion rates, and monthly performance charts.',
          ],
        },
      ],
    },
    {
      id: 'accounting-admin',
      title: '14. Accounting & Finance',
      sections: [
        {
          heading: 'Finance Dashboard',
          body: [
            'Go to Accounting → Finance Dashboard for KPIs: total revenue, outstanding invoices, expenses, and net position.',
          ],
        },
        {
          heading: 'Chart of Accounts',
          body: [
            'Go to Accounting → Chart of Accounts.',
            'This is the foundation of your accounting system — a structured list of all accounts (assets, liabilities, equity, income, expenses).',
            'Add an account: code, name, account type, and normal balance.',
          ],
        },
        {
          heading: 'Invoices',
          body: [
            'Go to Accounting → Invoices. Create invoices for clients.',
            'Invoice lifecycle: Draft → Sent → Partially Paid → Paid → Overdue / Cancelled.',
            'Each invoice links to a client and can include tax (VAT).',
          ],
        },
        {
          heading: 'Payments',
          body: [
            'Go to Accounting → Payments. Record payments received against invoices.',
            'Select the invoice, enter amount paid, date, and payment method (bank transfer, M-Pesa, cash, cheque).',
          ],
        },
        {
          heading: 'Expenses & Suppliers',
          body: [
            'Expenses: record company expenses by category, attach receipts, assign to cost centres.',
            'Suppliers & Bills: manage supplier records and the bills they issue. Record bill payments.',
          ],
        },
        {
          heading: 'Bank, Taxes & Budgets',
          body: [
            'Bank Accounts: record company bank accounts, track balances, and reconcile transactions.',
            'Tax Management: define tax rates (VAT 16%, WHT, etc.) applied to invoices and bills.',
            'Budgets: set monthly/annual budgets per department or account. Compare actuals vs budget in reports.',
          ],
        },
        {
          heading: 'Financial Reports',
          body: [
            'Go to Accounting → Financial Reports.',
            'Generate: Profit & Loss (Income Statement), Balance Sheet, Cash Flow statement, and Tax Summary.',
            'Select a date range and click Generate. Reports can be printed or saved as PDF.',
          ],
        },
      ],
    },
    {
      id: 'hr-policies-admin',
      title: '15. HR Policies',
      sections: [
        {
          heading: 'Managing Policies',
          body: [
            'Go to HR Policies in the sidebar.',
            'Create a new policy: title, category, content. Publish it so all staff can see it.',
            'Versioning: when a policy changes, create a new version. Employees must re-acknowledge updated policies.',
          ],
        },
        {
          heading: 'Policy Compliance',
          body: [
            'Go to HR Policies → Policy Compliance.',
            'See which employees have acknowledged each policy and which haven\'t.',
            'Send a reminder to non-compliant employees.',
          ],
        },
      ],
    },
    {
      id: 'tickets-admin',
      title: '16. Support Tickets',
      sections: [
        {
          heading: 'Managing All Tickets',
          body: [
            'Go to Support Tickets in the sidebar.',
            'As an admin you see all tickets from all users.',
            'Filter by status (Open, In Progress, Resolved, Closed) and priority.',
            'Open a ticket, read the thread, and reply. Change the status as you work through the issue.',
            'Close a ticket when resolved. The user who raised it can re-open it if needed.',
          ],
        },
      ],
    },
    {
      id: 'client-portal-overview',
      title: '17. Client Portal Overview',
      sections: [
        {
          heading: 'How Clients Access the System',
          body: [
            'Clients have a separate login at /login using the "Client Portal" tab — email and password.',
            'When a client is created in Sales → Clients, a Client Portal user account can be generated for them.',
            'Clients can view: their subscriptions, invoices, service requests, support tickets, and shared documents.',
            'Clients cannot see any internal HR, payroll, or employee data.',
          ],
        },
      ],
    },
    PROFILE_CHAPTER,
    SUPPORT_CHAPTER,
  ],

  // ── HR MANAGER ──────────────────────────────────────────────────────────────
  HR_MANAGER: [
    STARTED,
    {
      id: 'employees-hr',
      title: '2. Employee Management',
      sections: [
        {
          heading: 'Adding and Editing Employees',
          body: [
            'Go to Employees in the sidebar.',
            'Click "Add Employee" and fill in all tabs: Personal Info, Employment, Financial.',
            'Employee Code is auto-generated (HTL-XXXX). Set the correct System Role so the employee sees the right dashboard.',
            'To edit, click the pencil icon on the employee row and update any field.',
          ],
        },
        {
          heading: 'Managing Employee Status',
          body: [
            'Employment Status options: Active, Probation, On Leave, Resigned, Terminated, Suspended.',
            'Changing status to Resigned or Terminated should be done when an employee leaves.',
          ],
        },
      ],
    },
    {
      id: 'auth-creds-hr',
      title: '3. Auth Credentials',
      sections: [
        {
          heading: 'Generating Secret Codes',
          body: [
            'Go to HR → Auth Credentials in the sidebar.',
            'The employee must have National ID and Date of Birth saved in their profile before generating.',
            'Click "Generate Code" — a unique code (e.g. HVN-XXXXX) is displayed once. Share it securely with the employee.',
            'The employee logs in with: National ID + Date of Birth + Secret Code.',
            'Reset the code at any time by clicking Generate Code again.',
          ],
        },
        {
          heading: 'Account Lockout',
          body: [
            'After 5 failed login attempts the account is locked for 30 minutes.',
            'To unlock immediately: click Unlock on the employee\'s row in Auth Credentials.',
            'You can also manually lock an account to prevent login (e.g. while investigating a security issue).',
          ],
        },
      ],
    },
    {
      id: 'attendance-hr',
      title: '4. Attendance',
      sections: [
        {
          heading: 'Viewing Staff Attendance',
          body: [
            'Go to Attendance in the sidebar.',
            'Use the month/year selector to browse any period.',
            'The table lists all employees\' records: clock-in, clock-out, hours, and status.',
            'LATE status is set automatically when an employee clocks in after the official start time.',
          ],
        },
      ],
    },
    {
      id: 'leaves-hr',
      title: '5. Leave Management',
      sections: [
        {
          heading: 'Approving Leave Requests',
          body: [
            'Go to Leave Management in the sidebar.',
            'The Pending tab shows requests awaiting your action.',
            'Click Approve or Reject. For rejections, provide a reason.',
            'Approved leaves automatically reduce the employee\'s leave balance.',
          ],
        },
      ],
    },
    {
      id: 'payroll-hr',
      title: '6. Payroll',
      sections: [
        {
          heading: 'Running Payroll',
          body: [
            'Go to Payroll in the sidebar.',
            'Click "Run Payroll", select the month and year.',
            'The system calculates gross salary, PAYE, NHIF/SHA, and NSSF based on each employee\'s basic salary.',
            'Review the results, then click Confirm to finalise.',
          ],
        },
      ],
    },
    {
      id: 'performance-hr',
      title: '7. Performance Management',
      sections: [
        {
          heading: 'Creating Performance Reviews',
          body: [
            'Go to Performance in the sidebar.',
            'Click "New Review". Select the employee, reviewer, and review period.',
            'Rate 1–5 stars. Fill Strengths, Areas for Improvement, and Comments.',
            'Save. The employee can view their review in their own Performance page.',
          ],
        },
      ],
    },
    {
      id: 'announcements-hr',
      title: '8. Announcements',
      sections: [
        {
          heading: 'Creating Announcements',
          body: [
            'Go to Announcements → New Announcement.',
            'Set title, content, priority (Normal / High / Urgent), and optional expiry date.',
            'Publish to notify all staff immediately.',
          ],
        },
      ],
    },
    {
      id: 'recruitment-hr',
      title: '9. Recruitment & ATS',
      sections: [
        {
          heading: 'Full Recruitment Pipeline',
          body: [
            'Job Postings: create, publish, and close job ads.',
            'Applications: review CVs, move candidates through stages (Applied → Screening → Interview → Offer → Hired/Rejected).',
            'Interviews: schedule interviews, record outcomes.',
            'Talent Pool: store candidates for future roles.',
            'Onboarding Documents: upload forms for new hires.',
            'Offer Letters: generate PDF offer letters.',
            'ATS Analytics: view conversion rates and time-to-hire metrics.',
          ],
        },
      ],
    },
    {
      id: 'hr-policies-hr',
      title: '10. HR Policies',
      sections: [
        {
          heading: 'Managing Policies',
          body: [
            'Create, version, and publish company policies.',
            'Track employee acknowledgements under Policy Compliance.',
            'Send reminders to employees who haven\'t acknowledged a required policy.',
          ],
        },
      ],
    },
    ANNOUNCEMENTS_CHAPTER,
    POLICIES_CHAPTER,
    SUPPORT_CHAPTER,
    PROFILE_CHAPTER,
  ],

  // ── DEPARTMENT HEAD ──────────────────────────────────────────────────────────
  DEPARTMENT_HEAD: [
    STARTED,
    {
      id: 'attendance-dh',
      title: '2. Attendance',
      sections: [
        {
          heading: 'Viewing Team Attendance',
          body: [
            'Go to Attendance in the sidebar.',
            'You can see attendance records for all employees. Use the month/year filter.',
            'Employees clock themselves in and out — you cannot clock in on their behalf.',
          ],
        },
      ],
    },
    {
      id: 'leaves-dh',
      title: '3. Leave Management',
      sections: [
        {
          heading: 'Approving Team Leave Requests',
          body: [
            'Go to Leave Management in the sidebar.',
            'The Pending tab shows all leave requests. Approve or Reject with a comment.',
            'You can see your team\'s approved and rejected history in the All Leaves tab.',
          ],
        },
      ],
    },
    {
      id: 'performance-dh',
      title: '4. Performance Reviews',
      sections: [
        {
          heading: 'Conducting Reviews for Your Team',
          body: [
            'Go to Performance in the sidebar.',
            'Click "New Review". Select the employee you are reviewing.',
            'Set the review period, give a rating (1–5 stars), and provide written feedback in Strengths, Areas for Improvement, and Comments.',
            'Save. The employee will see their review results when they check their Performance page.',
          ],
        },
      ],
    },
    {
      id: 'analytics-dh',
      title: '5. Analytics',
      sections: [
        {
          heading: 'Department Analytics',
          body: [
            'Go to Analytics in the sidebar.',
            'View headcount by department, employment type breakdown, and monthly growth.',
            'These charts are read-only — they are automatically updated as employee data changes.',
          ],
        },
      ],
    },
    ANNOUNCEMENTS_CHAPTER,
    POLICIES_CHAPTER,
    SUPPORT_CHAPTER,
    PROFILE_CHAPTER,
  ],

  // ── FINANCE OFFICER ──────────────────────────────────────────────────────────
  FINANCE_OFFICER: [
    STARTED,
    {
      id: 'payroll-fo',
      title: '2. Payroll',
      sections: [
        {
          heading: 'Processing Payroll',
          body: [
            'Go to Payroll in the sidebar.',
            'Click "Run Payroll". Select the month and year.',
            'The system calculates: Gross Salary = Basic Salary + Allowances. Then deducts PAYE (income tax), NHIF/SHA, and NSSF.',
            'Review each employee\'s computation, then click Confirm.',
            'Payroll runs are locked after confirmation and cannot be edited.',
          ],
        },
        {
          heading: 'Understanding Statutory Deductions (Kenya)',
          body: [
            'PAYE: Pay As You Earn income tax. Calculated on a progressive band set by KRA.',
            'SHA (formerly NHIF): Social Health Authority contribution. Deducted from gross pay.',
            'NSSF: National Social Security Fund. Employee and employer contributions are calculated per the NSSF Act.',
            'Net Pay = Gross Pay − PAYE − SHA − NSSF.',
          ],
        },
      ],
    },
    {
      id: 'accounting-fo',
      title: '3. Accounting & Finance',
      sections: [
        {
          heading: 'Finance Dashboard',
          body: ['Go to Accounting → Finance Dashboard for KPIs: total revenue, outstanding invoices, total expenses, and net position.'],
        },
        {
          heading: 'Chart of Accounts',
          body: [
            'Go to Accounting → Chart of Accounts.',
            'Manage the full list of accounts (assets, liabilities, equity, income, expenses).',
            'Add accounts: enter code, name, type, and normal balance (Debit or Credit).',
          ],
        },
        {
          heading: 'Invoices',
          body: [
            'Create invoices for clients. Invoice lifecycle: Draft → Sent → Partially Paid → Paid → Overdue / Cancelled.',
            'Apply VAT (16%) where applicable. The system calculates tax automatically.',
          ],
        },
        {
          heading: 'Payments, Expenses, Suppliers',
          body: [
            'Payments: record money received against invoices. Select payment method (bank transfer, M-Pesa, cash, cheque).',
            'Expenses: log all company expenditure by category. Attach digital receipts.',
            'Suppliers & Bills: manage supplier records. Record bills received and payments made.',
          ],
        },
        {
          heading: 'Bank, Taxes, Budgets & Reports',
          body: [
            'Bank Accounts: list company accounts, track balances, reconcile transactions.',
            'Tax Management: define and manage VAT rates, withholding tax, etc.',
            'Budgets: set monthly/annual budgets per account or department. View actual vs budget variance.',
            'Financial Reports: generate Profit & Loss, Balance Sheet, Cash Flow, and Tax Summary. Select date range, then print or save as PDF.',
          ],
        },
      ],
    },
    {
      id: 'sales-fo',
      title: '4. Sales Overview (Finance View)',
      sections: [
        {
          heading: 'What Finance Can See in Sales',
          body: [
            'Go to Sales & CRM → Sales Overview for high-level KPIs.',
            'Quotations: view all quotations; approved ones feed into invoice creation.',
            'Subscriptions: view all active and expiring subscriptions.',
            'Service Catalog: view the services offered.',
            'Sales Reports: view revenue pipeline and conversion data.',
          ],
        },
      ],
    },
    ANNOUNCEMENTS_CHAPTER,
    POLICIES_CHAPTER,
    SUPPORT_CHAPTER,
    PROFILE_CHAPTER,
  ],

  // ── EMPLOYEE ──────────────────────────────────────────────────────────────────
  EMPLOYEE: [
    STARTED,
    {
      id: 'dashboard-emp',
      title: '2. Your Dashboard',
      sections: [
        {
          heading: 'What You See on Your Dashboard',
          body: [
            'Today\'s Attendance card: shows whether you are clocked in or not, and your clock-in time.',
            'Days This Month: total attendance records for the current month.',
            'Pending Leaves: number of your leave requests waiting for approval.',
            'My Payslip: your most recent payslip net pay amount.',
            'Announcements: latest company announcements.',
            'Your recent leave requests appear at the bottom of the dashboard.',
          ],
        },
      ],
    },
    {
      id: 'attendance-emp',
      title: '3. Attendance — Clocking In and Out',
      sections: [
        {
          heading: 'How to Clock In',
          body: [
            'Go to Attendance in the sidebar.',
            'The large clock widget shows the current time.',
            'Click the green "Clock In" button when you arrive at work.',
            'If you clock in after the official start time, your record will show status "LATE".',
          ],
        },
        {
          heading: 'How to Clock Out',
          body: [
            'Return to Attendance at the end of your workday.',
            'Click the red "Clock Out" button.',
            'Your total hours worked for the day will be calculated automatically.',
            'Once clocked out, you cannot edit the record. Contact HR if there is a mistake.',
          ],
        },
        {
          heading: 'What You Cannot See',
          body: [
            'The attendance page shows ONLY your clock-in/out widget.',
            'You cannot see other employees\' attendance records — that information is only for HR and managers.',
          ],
        },
      ],
    },
    {
      id: 'leaves-emp',
      title: '4. Leave Management',
      sections: [
        {
          heading: 'Applying for Leave',
          body: [
            'Go to Leave Management in the sidebar.',
            'Click "Apply for Leave".',
            'Select the leave type (Annual Leave, Sick Leave, etc.), start date, end date, and add a reason.',
            'Click Submit. Your request will be sent to your manager or HR for approval.',
          ],
        },
        {
          heading: 'Checking Your Leave Status',
          body: [
            'Your submitted requests appear in the leave list with a status badge: Pending, Approved, or Rejected.',
            'You will receive a notification when your request is actioned.',
            'To cancel a pending request, click Cancel on the request row.',
          ],
        },
        {
          heading: 'Leave Balances',
          body: [
            'Your remaining leave days per type are shown at the top of the Leave Management page.',
            'Annual leave accrues based on your employment terms. Contact HR if your balance looks incorrect.',
          ],
        },
      ],
    },
    {
      id: 'payroll-emp',
      title: '5. My Payslip',
      sections: [
        {
          heading: 'Viewing Your Payslip',
          body: [
            'Go to Payroll in the sidebar.',
            'Your payslips are listed by month. Click any row to see the full breakdown.',
            'Payslip shows: Basic Salary, Allowances, Gross Pay, PAYE deduction, NHIF/SHA deduction, NSSF deduction, and Net Pay.',
            'Net Pay is the amount deposited into your bank account.',
            'Contact HR if you believe there is an error in your payslip.',
          ],
        },
      ],
    },
    {
      id: 'performance-emp',
      title: '6. Performance Reviews',
      sections: [
        {
          heading: 'Viewing Your Reviews',
          body: [
            'Go to Performance in the sidebar.',
            'Your completed performance reviews are listed here.',
            'Each review shows: review period, rating (1–5 stars), strengths, areas for improvement, and comments from your reviewer.',
            'Reviews are set by your manager or HR. You cannot edit them.',
          ],
        },
      ],
    },
    ANNOUNCEMENTS_CHAPTER,
    POLICIES_CHAPTER,
    {
      id: 'support-emp',
      title: '8. Support Tickets',
      sections: [
        {
          heading: 'Raising a Support Ticket',
          body: [
            'Go to Support Tickets in the sidebar.',
            'Click "New Ticket". Enter the subject, describe the issue, and set the priority (Low, Medium, High, Urgent).',
            'Click Submit. The support team will respond in your ticket thread.',
            'Check back regularly for replies. You can add more information to the thread at any time.',
            'Once the issue is resolved, click "Close Ticket".',
          ],
        },
      ],
    },
    PROFILE_CHAPTER,
  ],

  // ── SALES MANAGER ───────────────────────────────────────────────────────────
  SALES_MANAGER: [
    STARTED,
    {
      id: 'dashboard-sm',
      title: '2. Sales Dashboard',
      sections: [
        {
          heading: 'Reading Your Dashboard',
          body: [
            'The monthly Client Acquisition Target banner shows your team\'s progress toward the 5-client-per-month goal.',
            'KPI cards show: My Leads, My Quotations, My Clients, My Tasks — with "added this month" counts.',
            'The Lead Activity chart shows lead volume over the last 6 months.',
            'Recent Leads lists the 5 most recently added leads.',
            'Quick Action buttons let you jump straight to Add Lead, New Quotation, Add Client, Add Task, or Service Catalog.',
          ],
        },
      ],
    },
    {
      id: 'leads-sm',
      title: '3. Leads',
      sections: [
        {
          heading: 'Adding a Lead',
          body: [
            'Go to Sales → Leads.',
            'Click "Add Lead". Fill in: name, company, email, phone, source (where the lead came from), and assign to an agent.',
            'Set the pipeline stage: New, Contacted, Qualified, Proposal, Won, or Lost.',
            'Add an expected close date and estimated deal value.',
            'Click Save.',
          ],
        },
        {
          heading: 'Managing the Pipeline',
          body: [
            'View leads by stage using the filter at the top.',
            'Click a lead row to open it and update the stage, add notes, or edit details.',
            'Won leads can be converted to clients: open the lead and click "Convert to Client".',
            'Lost leads remain in the system for reporting purposes.',
          ],
        },
      ],
    },
    {
      id: 'quotations-sm',
      title: '4. Quotations',
      sections: [
        {
          heading: 'Creating a Quotation',
          body: [
            'Go to Sales → Quotations.',
            'Click "New Quotation". Select the client, validity date, and add line items.',
            'Each line item: select a service from the catalog, enter quantity and unit price.',
            'Add tax (VAT 16%) if applicable. The total is calculated automatically.',
            'Save as Draft, or Send directly to the client (changes status to "Sent").',
          ],
        },
        {
          heading: 'Quotation Lifecycle',
          body: [
            'Draft → Sent → Approved / Rejected.',
            'When a client approves, update the status to Approved.',
            'Approved quotations can be shared with Finance to create an invoice.',
          ],
        },
      ],
    },
    {
      id: 'clients-sm',
      title: '5. Client Management',
      sections: [
        {
          heading: 'Adding a Client',
          body: [
            'Go to Sales → Clients.',
            'Click "Add Client". Fill in: company name, contact person, phone, email, address, industry, and category (Corporate, SME, Individual, etc.).',
            'Assign a responsible sales agent.',
            'Click Save.',
          ],
        },
        {
          heading: 'Client Profiles',
          body: [
            'Click a client row to open the full profile.',
            'The profile shows: contact details, linked subscriptions, quotations, and service history.',
          ],
        },
      ],
    },
    {
      id: 'subscriptions-sm',
      title: '6. Subscriptions',
      sections: [
        {
          heading: 'Managing Subscriptions',
          body: [
            'Go to Sales → Subscriptions.',
            'Create a subscription for a client: select the client, service, start date, end/renewal date, and billing frequency.',
            'The dashboard warns you 30 days before a subscription expires.',
            'Renew a subscription by extending the end date.',
          ],
        },
      ],
    },
    {
      id: 'tasks-sm',
      title: '7. Sales Tasks',
      sections: [
        {
          heading: 'Creating and Assigning Tasks',
          body: [
            'Go to Sales → Sales Tasks.',
            'Click "Add Task". Fill in: title, description, assign to an agent, client (optional), deadline, and priority (Low, Medium, High, Urgent).',
            'Tasks appear on the assignee\'s dashboard under My Tasks.',
            'View tasks by status (To Do, In Progress, Done) using the Kanban or List view toggle.',
            'Overdue tasks are highlighted automatically.',
          ],
        },
      ],
    },
    {
      id: 'services-sm',
      title: '8. Service Catalog',
      sections: [
        {
          heading: 'Viewing and Managing Services',
          body: [
            'Go to Sales → Service Catalog.',
            'The catalog lists all services the company offers: name, category, unit price, and description.',
            'As a Sales Manager you can add and edit services.',
            'Services appear as selectable line items when building quotations.',
          ],
        },
      ],
    },
    {
      id: 'reports-sm',
      title: '9. Sales Reports',
      sections: [
        {
          heading: 'Viewing Sales Performance',
          body: [
            'Go to Sales → Sales Reports.',
            'View: total revenue, lead conversion rate, average deal size, top-performing agents, and monthly trends.',
            'Filter by date range and agent.',
            'Use these reports for team performance reviews and target setting.',
          ],
        },
      ],
    },
    ANNOUNCEMENTS_CHAPTER,
    POLICIES_CHAPTER,
    SUPPORT_CHAPTER,
    PROFILE_CHAPTER,
  ],

  // ── SALES AGENT ─────────────────────────────────────────────────────────────
  SALES_AGENT: [
    STARTED,
    {
      id: 'dashboard-sa',
      title: '2. Your Sales Dashboard',
      sections: [
        {
          heading: 'Monthly Client Target Tracker',
          body: [
            'At the top of your dashboard is your Client Acquisition Target for the month.',
            'Your monthly target is 5 clients. The progress bar fills as you add clients.',
            'The banner shows exactly how many more clients you need: e.g. "3 more clients needed" or "1 client away from your target!"',
            'When you hit 5 clients the banner turns green and says "Target Achieved!"',
            'The target resets on the 1st of each month.',
          ],
        },
        {
          heading: 'KPI Cards',
          body: [
            'My Leads: total leads you have created or are assigned to, with "X added this month".',
            'My Quotations: total quotations you have created, with how many this month.',
            'My Clients: total active clients assigned to you, with how many added this month.',
            'My Tasks: total tasks assigned to you, with overdue count.',
            'Click any card to go directly to that module.',
          ],
        },
        {
          heading: 'Quick Actions',
          body: [
            'Use the Quick Actions bar to jump straight to: Add Lead, New Quotation, Add Client, Add Task, or Service Catalog.',
            'These are the fastest way to record new work without navigating the sidebar.',
          ],
        },
      ],
    },
    {
      id: 'leads-sa',
      title: '3. Managing Leads',
      sections: [
        {
          heading: 'Adding a New Lead',
          body: [
            'Go to Sales → Leads (or click "Add Lead" in Quick Actions).',
            'Click "Add Lead". Fill in: name, company/organisation, phone, email, and source (how you found them: referral, cold call, website, social media, etc.).',
            'Set the initial stage to "New".',
            'Add an expected close date and estimated deal value if known.',
            'Click Save.',
          ],
        },
        {
          heading: 'Moving Leads Through the Pipeline',
          body: [
            'Open a lead and update the stage as you progress: New → Contacted → Qualified → Proposal → Won or Lost.',
            'New: just captured, no contact made yet.',
            'Contacted: you have made first contact (call, email, meeting).',
            'Qualified: confirmed the prospect has budget and interest.',
            'Proposal: you have sent a quotation or formal proposal.',
            'Won: deal closed — convert to client.',
            'Lost: prospect declined — record a loss reason.',
          ],
        },
        {
          heading: 'You Only See Your Own Leads',
          body: [
            'The leads list shows only leads assigned to you or created by you.',
            'Your Sales Manager can see all leads across the team.',
          ],
        },
      ],
    },
    {
      id: 'quotations-sa',
      title: '4. Creating Quotations',
      sections: [
        {
          heading: 'How to Create a Quotation',
          body: [
            'Go to Sales → Quotations (or click "New Quotation" in Quick Actions).',
            'Click "New Quotation". Select the client from your client list.',
            'Add line items: click "Add Item", select a service from the catalog, enter quantity and unit price.',
            'The subtotal, tax, and total are calculated automatically.',
            'Set a validity date (how long the quote is valid — typically 30 days).',
            'Save as Draft to work on it later, or change status to Sent once ready to share with the client.',
          ],
        },
        {
          heading: 'Quotation Follow-up',
          body: [
            'Contact the client after sending the quotation.',
            'When the client accepts, change the status to Approved.',
            'If they decline, mark it as Rejected and note the reason.',
          ],
        },
      ],
    },
    {
      id: 'clients-sa',
      title: '5. Adding Clients',
      sections: [
        {
          heading: 'How to Add a Client',
          body: [
            'Go to Sales → Clients (or click "Add Client" in Quick Actions).',
            'Click "Add Client". Required fields: Company Name and Contact Person.',
            'Also fill in: phone, WhatsApp number, email, address, industry, and category.',
            'Add any relevant tags (e.g. "VIP", "Referral", "Government").',
            'Click Save. The client appears in your clients list and counts toward your monthly target.',
          ],
        },
        {
          heading: 'Each Client Counts Toward Your Target',
          body: [
            'Every new client you add in the current calendar month is counted toward your 5-client monthly target.',
            'Check your dashboard to see real-time progress.',
            'Focus on converting Won leads into clients to maximise your count.',
          ],
        },
      ],
    },
    {
      id: 'tasks-sa',
      title: '6. Sales Tasks',
      sections: [
        {
          heading: 'Managing Your Tasks',
          body: [
            'Go to Sales → Sales Tasks (or click "Add Task" in Quick Actions).',
            'Click "Add Task". Fill in: title, description, linked client (optional), deadline, and priority.',
            'Use tasks to track follow-ups, calls, meetings, and proposals.',
            'View tasks in Kanban (board) or List view using the toggle.',
            'Move a task to Done when completed.',
            'Overdue tasks (past deadline and not Done) are highlighted automatically.',
          ],
        },
      ],
    },
    {
      id: 'services-sa',
      title: '7. Service Catalog (View Only)',
      sections: [
        {
          heading: 'Using the Service Catalog',
          body: [
            'Go to Sales → Service Catalog.',
            'The catalog lists all services offered by the company: name, category, unit price, and description.',
            'Use this as a reference when discussing services with prospects.',
            'Services in the catalog are the items you select when building a quotation.',
            'You cannot add or edit services — only admins and HR managers can manage the catalog.',
          ],
        },
      ],
    },
    ANNOUNCEMENTS_CHAPTER,
    POLICIES_CHAPTER,
    SUPPORT_CHAPTER,
    PROFILE_CHAPTER,
  ],
}

// Fallback for unrecognised roles
CHAPTERS['DEFAULT'] = CHAPTERS['EMPLOYEE']

// ─── Component ───────────────────────────────────────────────────────────────

export default function HelpPage() {
  const { data: session } = useSession()
  const role = (session?.user?.role as string) || 'EMPLOYEE'
  const chapters: Chapter[] = CHAPTERS[role] || CHAPTERS['DEFAULT']

  const [open, setOpen] = useState<Set<string>>(new Set([chapters[0]?.id]))

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function expandAll() {
    setOpen(new Set(chapters.map(c => c.id)))
  }

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: 'System Administrator',
    HR_MANAGER: 'HR Manager',
    DEPARTMENT_HEAD: 'Department Head',
    FINANCE_OFFICER: 'Finance Officer',
    EMPLOYEE: 'Employee',
    SALES_MANAGER: 'Sales Manager',
    SALES_AGENT: 'Sales Agent',
    CLIENT: 'Client',
  }

  return (
    <>
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, nav, header, footer,
          [data-print-hide] { display: none !important; }
          body, html { background: white !important; }
          main { padding: 0 !important; overflow: visible !important; }
          [data-accordion-body] {
            display: block !important;
            max-height: none !important;
            overflow: visible !important;
            opacity: 1 !important;
          }
          [data-chapter] { page-break-before: always; break-before: page; }
          [data-chapter]:first-of-type { page-break-before: avoid; break-before: avoid; }
          [data-toc] { page-break-after: always; break-after: page; }
          h2 { page-break-after: avoid; font-size: 14pt; }
          h3 { page-break-after: avoid; font-size: 12pt; }
          p, li { page-break-inside: avoid; font-size: 10pt; line-height: 1.5; }
          ul { padding-left: 1.2em; }
          @page { margin: 18mm 15mm; size: A4; }
          .print-footer { display: block !important; }
          .print-watermark { display: block !important; }
        }
      ` }} />

      <div className="max-w-4xl space-y-6">

        {/* Cover */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-blue-200 text-sm font-semibold tracking-wider uppercase">Helvino Technologies Ltd</div>
                  <h1 className="text-2xl font-black">User Manual</h1>
                </div>
              </div>
              <p className="text-blue-200 text-sm">
                Role: <span className="text-white font-bold">{roleLabel[role] || role}</span>
                &nbsp;·&nbsp;Helvino HRMS &amp; CRM
                &nbsp;·&nbsp;{new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-blue-300 text-xs mt-1">
                This manual covers all features available to your role. Sections not listed are restricted to other roles.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap" data-print-hide>
              <button
                onClick={expandAll}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <HelpCircle className="w-4 h-4" /> Expand All
              </button>
              <button
                onClick={() => { expandAll(); setTimeout(() => window.print(), 300) }}
                className="flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-sm font-black transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100" data-toc>
          <h2 className="text-lg font-black text-slate-900 mb-4">Table of Contents</h2>
          <ol className="space-y-1.5">
            {chapters.map((ch, idx) => (
              <li key={ch.id} className="flex items-center gap-3">
                <span className="text-blue-600 font-bold text-sm w-6 flex-shrink-0">{idx + 1}.</span>
                <button
                  data-print-hide
                  onClick={() => {
                    setOpen(prev => new Set([...prev, ch.id]))
                    setTimeout(() => document.getElementById(ch.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                  }}
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 text-left transition-colors"
                >
                  {ch.title.replace(/^\d+\.\s*/, '')}
                </button>
                <span className="print-only hidden text-sm text-slate-700">{ch.title.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Chapters */}
        {chapters.map((ch) => {
          const isOpen = open.has(ch.id)
          return (
            <div key={ch.id} id={ch.id} data-chapter className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Chapter header */}
              <button
                data-print-hide
                onClick={() => toggle(ch.id)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <h2 className="text-base font-black text-slate-900">{ch.title}</h2>
                {isOpen
                  ? <ChevronDown className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  : <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />}
              </button>
              {/* Print-only chapter title (always visible in print) */}
              <div className="hidden print-chapter-title px-6 pt-4">
                <h2 className="text-base font-black text-slate-900">{ch.title}</h2>
              </div>

              {/* Chapter body */}
              <div
                data-accordion-body
                style={{ display: isOpen ? 'block' : 'none' }}
              >
                <div className="px-6 pb-6 space-y-5 border-t border-slate-100">
                  {ch.sections.map((sec, si) => (
                    <div key={si} className="pt-4">
                      <h3 className="text-sm font-black text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
                        {sec.heading}
                      </h3>
                      <ul className="space-y-2">
                        {sec.body.map((line, li) => (
                          <li key={li} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                            <span className="text-blue-400 mt-0.5 flex-shrink-0">›</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {/* Print footer inside chapter */}
                <div className="print-footer hidden px-6 pb-4 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Helvino Technologies Ltd — Helvino HRMS User Manual — {roleLabel[role] || role}</p>
                </div>
              </div>
            </div>
          )
        })}

        {/* Bottom tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800" data-print-hide>
          <strong>Tip:</strong> Click "Download PDF" at the top to save this manual. In the print dialog, choose "Save as PDF" as the destination. For best results use Google Chrome.
        </div>

      </div>
    </>
  )
}
