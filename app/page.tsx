import Hero from "./components/Hero"
import TrendingInternships from "./components/trending-internships"
import { InternTable } from "./components/InternTable"
import StatsSection from "./components/stats-section"
import { Navbar } from "./components/Navbar"
import { Features } from "./components/Features"

export default async function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8">Interns Leaderboard</h2>
          <InternTable />
        </div>
        <TrendingInternships />
        <StatsSection />
      </main>
    </>
  )
}
