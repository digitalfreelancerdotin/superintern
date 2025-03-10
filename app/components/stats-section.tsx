"use client";

import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "./ui/use-toast"

interface FormData {
  companyName: string;
  email: string;
  requirements: string;
  positions: string;
}

const stats = [
  { value: "300K+", label: "registered users" },
  { value: "10K+", label: "daily active users" },
  { value: "21M+", label: "tasks completed" },
  { value: "600K+", label: "reviews" }
]

export default function StatsSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    email: '',
    requirements: '',
    positions: ''
  });
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('company_requirements')
        .insert([
          {
            company_name: formData.companyName,
            email: formData.email,
            positions: parseInt(formData.positions),
            requirements: formData.requirements
          }
        ]);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        console.error('Error:', error);
        return;
      }

      toast({
        title: "Success!",
        description: "Your requirements have been submitted successfully.",
      });

      // Reset form
      setFormData({
        companyName: '',
        email: '',
        positions: '',
        requirements: ''
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative">
          {/* Content */}
          <div>
            <h2 className="text-3xl font-bold text-center mb-12">
              Looking for Interns?
            </h2>
            
            <div className="mt-16">
              <h3 className="text-2xl font-semibold text-center mb-8">
                We help you hire the Super Interns! 🚀
              </h3>

              {/* Company Requirements Form */}
              <div className="max-w-2xl mx-auto mt-12">
                <Card>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="companyName" className="text-sm font-medium">
                          Company Name
                        </label>
                        <Input
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="Enter your company name"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Business Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@company.com"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="positions" className="text-sm font-medium">
                          Number of Positions
                        </label>
                        <Input
                          id="positions"
                          name="positions"
                          type="number"
                          min="1"
                          value={formData.positions}
                          onChange={handleChange}
                          placeholder="How many interns are you looking for?"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="requirements" className="text-sm font-medium">
                          Requirements
                        </label>
                        <Textarea
                          id="requirements"
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleChange}
                          placeholder="Describe the skills and qualifications you're looking for..."
                          rows={4}
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Requirements"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Image in top right - now with higher z-index */}
          <div className="absolute -top-10 right-0 w-[300px] hidden md:block z-20">
            <img 
              src="/super-interns.png" 
              alt="Super intern heroes"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
} 