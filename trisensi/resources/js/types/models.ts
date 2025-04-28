// models.ts

export interface Role {
    id: number;
    name: string;
    description?: string;
  }
  
  export interface AdminStaff {
    id: number;
    staff_id: number;
    name: string;
    is_active: boolean;
    staff?: Staff;
    role?: Role;
  }
  
  export interface Staff {
    id: number;
    user_id: number;
    role_id: number;
    nip?: string;
    nuptk?: string;
    user?: User;
    role?: Role;
    adminStaff?: AdminStaff;
    teacher?: AdminStaff; // Assuming teacher is similar to AdminStaff
  }
  
  export interface User {
    id: number;
    name: string;
    email: string;
    role?: Role;
    staff?: Staff;
  }
  
  