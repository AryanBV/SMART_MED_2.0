// client/src/components/profile/CreateProfileForm/index.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProfileSchema, type CreateProfileSchema } from '@/validations/profileSchemas';
import { Gender } from '@/interfaces/profile';

interface CreateProfileFormProps {
  onSubmit: (data: CreateProfileSchema) => Promise<void>;
  isLoading?: boolean;
}

const genderTypes: Gender[] = ['male', 'female', 'other'];

export const CreateProfileForm: React.FC<CreateProfileFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<CreateProfileSchema>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      full_name: '',
      date_of_birth: '',
      gender: 'male',
    },
  });

  const navigate = useNavigate();

  const handleSubmit = async (data: CreateProfileSchema) => {
    try {
      await onSubmit(data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile creation failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Profile</CardTitle>
        <CardDescription>
          Please provide your basic information to complete your profile setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {genderTypes.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="flex justify-between px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating Profile...' : 'Create Profile'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateProfileForm;