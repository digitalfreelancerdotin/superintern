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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-center mb-8">
            Join the pool of 21M+ students and get started with your career
          </h3>
          <div className="flex justify-center items-center gap-4">
            <div className="flex items-center">
              <span className="text-4xl font-bold">4.2</span>
              <div className="ml-2">
                <div className="text-yellow-400">★★★★☆</div>
                <div className="text-sm text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 