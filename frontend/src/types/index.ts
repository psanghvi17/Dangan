export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Item {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

// MUser types
export interface MUser {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email_id: string;
  created_on?: string;
}

export interface MUserSignup {
  first_name: string;
  email_id: string;
  password: string;
}

export interface MUserLogin {
  email_id: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email_id: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  // MUser methods
  mUser: MUser | null;
  loginMUser: (credentials: MUserLogin) => Promise<void>;
  signupMUser: (data: MUserSignup) => Promise<void>;
  forgotPassword: (email: string) => Promise<PasswordResetResponse>;
  resetPassword: (token: string, newPassword: string) => Promise<PasswordResetResponse>;
}
