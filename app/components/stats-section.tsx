import { Card, CardContent } from "@/components/ui/card"

const stats = [
  { value: "300K+", label: "registered users" },
  { value: "10K+", label: "daily active users" },
  { value: "21M+", label: "tasks completed" },
  { value: "600K+", label: "reviews" }
]

export default function StatsSection() {
  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Top companies trust us
        </h2>
        
        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-center">
            Join the pool of 21M+ students and get started with your career
          </h3>
        </div>
      </div>
    </section>
  )
} 