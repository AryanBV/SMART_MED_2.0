import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="mt-2 text-gray-600">Sign up for a new account</p>
        </div>
        
        <RegisterForm />
  
      </div>
    </div>
  );
};

export default RegisterPage;