"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card } from "../../../components/ui/card";
import { createOrUpdateInternProfile, uploadResume, getInternProfile } from "../../../lib/user-profile";
import { useToast } from "@/app/components/ui/use-toast";
import { initStorage, validateConnection } from "../../../lib/supabase";
import { useAuth } from "@/app/context/auth-context";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  githubUrl: string;
  location: string;
  phoneNumber: string;
  university: string;
  major: string;
  graduationYear: string;
  resumeUrl: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    githubUrl: '',
    location: '',
    phoneNumber: '',
    university: '',
    major: '',
    graduationYear: '',
    resumeUrl: ''
  });
  const [resume, setResume] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [profile, setProfile] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      console.log('User not loaded yet');
      return;
    }
    
    console.log('Loading profile for user:', {
      id: user.id,
      email: user.email,
      has_email: Boolean(user.email)
    });
    
    try {
      // Get the profile using the user ID from Supabase
      const data = await getInternProfile(user.id);
      
      if (data) {
        console.log('Existing profile found:', data);
        setProfile(data);
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || user.email || '',
          phone: data.phone_number || '',
          githubUrl: data.github_url || '',
          location: data.location || '',
          phoneNumber: data.phone_number || '',
          university: data.university || '',
          major: data.major || '',
          graduationYear: data.graduation_year || '',
          resumeUrl: data.resume_url || '',
        });
      } else {
        console.log('No existing profile found, creating initial profile');
        if (!user.email) {
          console.warn('Warning: Creating profile with no email. User object:', user);
        }
        
        await createOrUpdateInternProfile({
          user_id: user.id,
          email: user.email || '',
          first_name: '',
          last_name: '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load profile",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const initialize = useCallback(async () => {
    try {
      // Initialize Supabase storage
      await initStorage();
      
      // Validate Supabase connection
      const isConnected = await validateConnection();
      
      if (!isConnected) {
        console.error('Supabase connection validation failed');
        setConnectionError('Failed to connect to database. Please try again later.');
        toast({
          title: "Connection Error",
          description: "Failed to connect to database. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('User state:', {
        isLoaded: !!user,
        userId: user?.id,
        userEmail: user?.email
      });

      if (!user || !user.email) {
        console.log('User not loaded yet, waiting...');
        return;
      }

      // Load user profile
      await loadProfile();
      
    } catch (error) {
      console.error('Profile initialization error:', {
        error,
        errorType: error instanceof Error ? 'Error' : typeof error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // Handle empty error objects
      let errorMessage = 'Failed to initialize profile page';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        errorMessage = 'Database connection failed. Please check your Supabase configuration and connection.';
      }
      
      setConnectionError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadProfile, toast, user]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      initialize();
    }
  }, [user, isAuthLoading, initialize]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting profile update...');
      console.log('User ID:', user.id);
      console.log('User ID type:', typeof user.id);
      console.log('Form data:', JSON.stringify(formData, null, 2));
      console.log('User email from auth:', user.email);
      
      // Test Supabase connection before proceeding
      console.log('Testing Supabase connection...');
      const isConnected = await validateConnection();
      console.log('Connection test result:', isConnected);
      
      if (!isConnected) {
        throw new Error('Database connection failed. Please check your Supabase configuration and connection.');
      }
      
      // Ensure we have an email - use user.email as fallback if formData.email is empty
      const email = formData.email || user.email || '';
      
      if (!email) {
        throw new Error('Email is required. Please provide an email address.');
      }
      
      console.log('Using email for profile update:', email);
      
      // Create/update profile
      console.log('Calling createOrUpdateInternProfile...');
      try {
        await createOrUpdateInternProfile({
          user_id: user.id,
          email: email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phone,
          github_url: formData.githubUrl,
          location: formData.location,
          university: formData.university,
          major: formData.major,
          graduation_year: formData.graduationYear,
          resume_url: formData.resumeUrl
        });
      } catch (profileError: any) {
        // Check for RLS policy violation
        if (profileError?.message?.includes('row-level security policy') || 
            (profileError?.code === '42501')) {
          console.error('RLS policy violation:', profileError);
          throw new Error('Permission denied: You do not have permission to update this profile. Please ensure you are properly authenticated.');
        }
        // Re-throw other errors
        throw profileError;
      }

      // Upload resume if provided
      if (resume) {
        await uploadResume(user.id, resume);
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', {
        type: error instanceof Error ? 'Error' : typeof error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your profile.</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to view this page.</p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h1>
          <p className="text-gray-600 mb-4">{connectionError}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Please check:</p>
            <ul className="list-disc list-inside">
              <li>Your Supabase configuration in .env.local</li>
              <li>Your database connection and permissions</li>
              <li>Your network connection</li>
            </ul>
          </div>
          
          {connectionError.includes('table does not exist') && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Database Setup Required</h2>
              <p className="text-sm text-yellow-700 mb-2">
                It looks like you need to run the SQL setup script to create the necessary tables.
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                <li>Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase Dashboard</a></li>
                <li>Select your project</li>
                <li>Go to the SQL Editor</li>
                <li>Copy and paste the contents of the <code className="bg-gray-100 px-1 py-0.5 rounded">supabase-setup.sql</code> file</li>
                <li>Run the SQL script</li>
              </ol>
            </div>
          )}
          
          <Button 
            onClick={() => {
              setConnectionError(null);
              setIsInitialized(false);
              initialize();
            }}
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Your first name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Your last name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Your email address"
              disabled
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Your phone number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              value={formData.githubUrl}
              onChange={handleInputChange}
              placeholder="https://github.com/yourusername"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State, Country"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              name="university"
              value={formData.university}
              onChange={handleInputChange}
              placeholder="Your university or school"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="major">Major</Label>
            <Input
              id="major"
              name="major"
              value={formData.major}
              onChange={handleInputChange}
              placeholder="Your field of study"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              name="graduationYear"
              value={formData.graduationYear}
              onChange={handleInputChange}
              placeholder="Expected graduation year"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resume">Resume</Label>
            <Input
              id="resume"
              name="resume"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
            />
            {formData.resumeUrl && (
              <p className="text-sm text-gray-500">
                Current resume: <a href={formData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
              </p>
            )}
          </div>
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </div>
  );
} 