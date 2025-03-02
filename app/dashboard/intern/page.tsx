export default async function InternDashboard() {
  // TODO: Replace with your own authentication mechanism
  const userId = "placeholder-user-id";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Welcome to your Dashboard!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Current Tasks</h2>
          {/* Task list will go here */}
          <p className="text-gray-500">No tasks assigned yet.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
          <div className="space-y-2">
            <p>Total Points: 0</p>
            <p>Tasks Completed: 0</p>
          </div>
        </div>
      </div>
    </div>
  );
} 