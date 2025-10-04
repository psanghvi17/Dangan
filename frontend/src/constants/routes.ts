// Route constants for the application
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ITEMS: '/items',
  HOLIDAY: '/holiday',
  
  // Client routes
  CLIENT: {
    LIST: '/client',
    MANAGE: '/client/manage-client',
    EDIT: (clientId: string | number) => `/client/edit/${clientId}`,
  },
  
  // Candidate routes
  CANDIDATE: {
    LIST: '/candidate',
    MANAGE: '/candidate/manage-candidate',
  },
  
  // Timesheet routes
  TIMESHEET: {
    LIST: '/timesheet',
    MANAGE: '/timesheet/manage-timesheet',
    MANAGE_WITH_ID: (timesheetId?: string | number) => 
      timesheetId ? `/timesheet/manage-timesheet/${timesheetId}` : '/timesheet/manage-timesheet',
    VIEW: (timesheetId: string | number) => `/timesheet/manage-timesheet/${timesheetId}?mode=view`,
    EDIT: (timesheetId: string | number) => `/timesheet/manage-timesheet/${timesheetId}?mode=edit`,
  },
  
  // Invoice routes
  INVOICE: {
    LIST: '/invoices',
  },
} as const;

// Navigation helper functions
export const getTimesheetManageRoute = (timesheetId?: string | number) => {
  return ROUTES.TIMESHEET.MANAGE_WITH_ID(timesheetId);
};

export const getClientEditRoute = (clientId: string | number) => {
  return ROUTES.CLIENT.EDIT(clientId);
};
