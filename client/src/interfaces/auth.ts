export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterCredentials extends LoginCredentials {
    confirmPassword: string;
    name: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: 'parent' | 'child';
    };
  }
  
  export interface AuthContextType {
    user: AuthResponse['user'] | null;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => void;
  }