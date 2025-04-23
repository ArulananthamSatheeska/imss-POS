import { useState, useEffect } from "react";
import api from "../../services/taskapi";

export default function ReportPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks"); // Adjust API endpoint as needed
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const calculateDaysTaken = (started, finished) => {
    if (!started || !finished) return "-";
    const startDate = new Date(started);
    const finishDate = new Date(finished);
    const differenceInTime = finishDate - startDate;
    return Math.ceil(differenceInTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-8 pt-20">
      <h2 className="text-2xl font-bold mb-4">Task Report</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Task Name</th>
              <th className="border p-2">Project</th>
              <th className="border p-2">Assignee</th>
              <th className="border p-2">Created Date</th>
              <th className="border p-2">Due Date</th>
              <th className="border p-2">Started Date</th>
              <th className="border p-2">Finished Date</th>
              <th className="border p-2">Days Taken</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="text-center">
                <td className="border p-2">{task.name}</td>
                <td className="border p-2">{task.project?.name || "-"}</td>
                <td className="border p-2">{task.assignee?.name || "-"}</td>
                <td className="border p-2">{task.created_at?.split("T")[0]}</td>
                <td className="border p-2">{task.due_date?.split("T")[0]}</td>
                <td className="border p-2">
                  {task.started_at ? task.started_at.split("T")[0] : "-"}
                </td>
                <td className="border p-2">
                  {task.finished_at ? task.finished_at.split("T")[0] : "-"}
                </td>
                <td className="border p-2">
                  {calculateDaysTaken(task.started_at, task.finished_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
