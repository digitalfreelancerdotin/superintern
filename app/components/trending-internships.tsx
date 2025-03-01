import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const trendingCards = [
  {
    title: "Online Tasks",
    description: "Complete tasks and earn points",
    image: "/assets/online-tasks.svg"
  },
  {
    title: "Real-time Progress",
    description: "Track your performance daily",
    image: "/assets/progress.svg"
  },
  {
    title: "Get Recognized",
    description: "Top performers get featured",
    image: "/assets/recognition.svg"
  }
]

export default function TrendingInternships() {
  return (
    <section className="py-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">
        Trending on TopInterns 🔥
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {trendingCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md mb-4">
                {/* Add actual images later */}
              </div>
              <p className="text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
} 