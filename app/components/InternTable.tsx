import { Card, CardContent } from "@/components/ui/card"

export function InternTable() {
  return (
    <div className="w-full">
      <Card>
        <CardContent className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-4">Name</th>
                <th className="text-left pb-4">Tasks Completed</th>
                <th className="text-left pb-4">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample data - replace with actual data from your database */}
              <tr className="border-b">
                <td className="py-4">John Doe</td>
                <td className="py-4">15</td>
                <td className="py-4">89</td>
              </tr>
              <tr className="border-b">
                <td className="py-4">Jane Smith</td>
                <td className="py-4">12</td>
                <td className="py-4">78</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
