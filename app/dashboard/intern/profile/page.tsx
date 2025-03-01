"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card } from "../../../components/ui/card";
import { useUser } from "@clerk/nextjs";
import { createOrUpdateInternProfile, uploadResume, getInternProfile } from "../../../lib/user-profile";
import { useToast } from "@/app/components/ui/use-toast";
import { initStorage, validateConnection } from "../../../lib/supabase";
import { useClerkSupabase } from "../../../lib/hooks/use-clerk-supabase";

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
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();
  const { supabase, loading: supabaseLoading, error: supabaseError } = useClerkSupabase();
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

  const loadProfile = useCallback(async () => {
    if (!user || !isUserLoaded) {
      console.log('User not loaded yet');
      return;
    }

    try {
      console.log('Loading profile with user ID:', user.id);
      const profile = await getInternProfile(user.id);
      console.log('Profile loaded:', profile);

      if (profile) {
        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone_number || '',
          githubUrl: profile.github_url || '',
          location: profile.location || '',
          phoneNumber: profile.phone_number || '',
          university: profile.university || '',
          major: profile.major || '',
          graduationYear: profile.graduation_year || '',
          resumeUrl: profile.resume_url || '',
        });
      } else {
        console.log('No existing profile found, using default empty form data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, isUserLoaded, toast]);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        console.log('Initializing profile page...');
        
        // Add a small delay to ensure Clerk is fully loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('User state:', {
          isLoaded: isUserLoaded,
          userId: user?.id,
          userEmail: user?.emailAddresses?.[0]?.emailAddress
        });

        if (!user || !isUserLoaded) {
          console.log('User not loaded yet, waiting...');
          return;
        }

        // Check if Supabase client is ready
        if (supabaseLoading || !supabase) {
          console.log('Supabase client not ready yet, waiting...');
          return;
        }

        if (supabaseError) {
          console.error('Supabase client error:', supabaseError);
          if (!isMounted) return;
          setConnectionError(supabaseError.message);
          toast({
            title: "Connection Error",
            description: supabaseError.message,
            variant: "destructive",
          });
          return;
        }

        // First validate the connection
        console.log('About to validate connection...');
        let isConnected = false;
        try {
          isConnected = await validateConnection();
          console.log('Connection validation result:', isConnected);
        } catch (connectionError) {
          console.error('Connection validation error:', connectionError);
          if (!isMounted) return;
          setConnectionError('Failed to connect to the database. Please check your Supabase configuration.');
          toast({
            title: "Connection Error",
            description: "Failed to connect to the database. Please check your Supabase configuration.",
            variant: "destructive",
          });
          return;
        }
        
        if (!isConnected) {
          const errorMsg = 'Unable to connect to the database. Please check your configuration.';
          console.error(errorMsg);
          if (!isMounted) return;
          setConnectionError(errorMsg);
          toast({
            title: "Connection Error",
            description: errorMsg,
            variant: "destructive",
          });
          return;
        }

        // Try to load existing profile
        console.log('About to get intern profile...');
        try {
          // Use the client-side function with Clerk auth
          const profile = await getInternProfile(user.id, true);
          
          if (!profile) {
            console.log('No profile found, creating initial profile...');
            try {
              // Create initial profile with basic information
              const result = await createOrUpdateInternProfile({
                user_id: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                first_name: user.firstName || '',
                last_name: user.lastName || '',
              }, true);
              
              console.log('Profile created successfully:', result);
              
              // Reload profile after creation
              if (isMounted) {
                await loadProfile();
              }
            } catch (createError) {
              console.error('Error creating initial profile:', {
                error: createError,
                errorType: createError instanceof Error ? 'Error' : typeof createError,
                errorMessage: createError instanceof Error ? createError.message : 'Unknown error'
              });
              
              if (!isMounted) return;
              
              const errorMessage = createError instanceof Error 
                ? createError.message 
                : 'Failed to create profile. Please try again later.';
                
              toast({
                title: "Profile Creation Error",
                description: errorMessage,
                variant: "destructive",
              });
              return;
            }
          } else {
            console.log('Existing profile found:', profile);
            if (!isMounted) return;
            setFormData({
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              email: profile.email || '',
              phone: profile.phone_number || '',
              githubUrl: profile.github_url || '',
              location: profile.location || '',
              phoneNumber: profile.phone_number || '',
              university: profile.university || '',
              major: profile.major || '',
              graduationYear: profile.graduation_year || '',
              resumeUrl: profile.resume_url || '',
            });
          }
        } catch (profileError) {
          console.error('Error getting intern profile:', {
            error: profileError,
            errorType: profileError instanceof Error ? 'Error' : typeof profileError,
            errorMessage: profileError instanceof Error ? profileError.message : 'Unknown error'
          });
          
          if (!isMounted) return;
          
          const errorMessage = profileError instanceof Error 
            ? profileError.message 
            : 'Failed to load profile. Please try again later.';
            
          toast({
            title: "Profile Loading Error",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }

        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Profile initialization error:', {
          error,
          errorType: error instanceof Error ? 'Error' : typeof error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined
        });
        
        if (!isMounted) return;
        
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
    };

    if (isUserLoaded && !supabaseLoading) {
      initialize();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, isUserLoaded, loadProfile, toast, supabase, supabaseLoading, supabaseError]);

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
    if (!user) return;

    setIsLoading(true);
    try {
      // Create/update profile with Clerk auth
      await createOrUpdateInternProfile({
        user_id: user.id,
        email: formData.email,
        phone_number: formData.phone,
        github_url: formData.githubUrl,
        location: formData.location,
      }, true);

      // Upload resume if provided
      if (resume) {
        await uploadResume(user.id, resume, true);
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            }}
          >
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <div>Please sign in to access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-6">Profile</h1>
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (234) 567-8900"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Resume</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-gray-500">
                  Accepted formats: PDF, DOC, DOCX
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
} 