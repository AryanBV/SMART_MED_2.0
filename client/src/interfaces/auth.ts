// client/src/interfaces/auth.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string; // Changed to string for UUID
  name: string;
  email: string;
  role: string;
  profileId: string | null; // Changed to string for UUID
  status?: string;
  lastLogin?: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;  // Changed from AuthResponse['user'] to User
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;  // Changed to use User type
  validateAuth: () => Promise<void>;
}