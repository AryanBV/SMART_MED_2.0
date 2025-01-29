import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

const LoginPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.profileId) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/create-profile', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-600 mt-2">Please login to your account</p>
      </div>
      <LoginForm />
    </div>
  );
};

export default LoginPage;