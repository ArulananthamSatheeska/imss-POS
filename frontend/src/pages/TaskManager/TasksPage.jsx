import { useState, useEffect } from "react";
import api from "../../services/taskapi";
import TaskForm from "../../components/TaskManager/TaskForm";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks");
      const updatedTasks = response.data.map((task) => ({
        ...task,
        status: checkIfOverdue(task),
      }));
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, ...response.data } : task
        )
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const checkIfOverdue = (task) => {
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate < today && task.status !== "Finished"
      ? "Overdue"
      : task.status;
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskToDelete.id)
      );
      setShowConfirmDelete(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getStatusStyle = (task) => {
    const today = new Date();
    const dueDate = new Date(task.due_date);
    const isOverdue = dueDate < today && task.status !== "Finished";

    if (isOverdue) {
      return "bg-red-500 text-white animate-pulse";
    }

    const statusColors = {
      "Not Started": "bg-gray-400 text-white",
      "In Progress": "bg-yellow-500 text-white",
      Finished: "bg-green-500 text-white",
    };

    return statusColors[task.status] || "bg-gray-300";
  };

  const getPriorityStyle = (priority) => {
    // Remove spaces from the priority string to match the keys in priorityColors
    const normalizedPriority = priority.replace(/\s/g, ""); // e.g., "High Priority" -> "HighPriority"
    const priorityColors = {
      HighPriority: "bg-red-500 text-white",
      MediumPriority: "bg-yellow-500 text-white",
      LowPriority: "bg-green-500 text-white",
    };

    return priorityColors[normalizedPriority] || "bg-gray-300";
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 pt-24">
      <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Tasks</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setSelectedTask(null);
          }}
          className="px-4 py-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Add Task
        </button>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="p-6 bg-white rounded-lg shadow-lg w-96">
              <TaskForm
                task={selectedTask}
                onSave={() => {
                  setShowForm(false);
                  fetchTasks();
                }}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between p-4 rounded-lg shadow-md bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  {task.name}
                </h3>
                <p className="text-gray-600">Due Date: {task.due_date}</p>
                <p className="text-gray-600">
                  Started:{" "}
                  {task.started_at
                    ? new Date(task.started_at).toLocaleDateString()
                    : "Not Started"}
                </p>
                <p className="text-gray-600">
                  Finished:{" "}
                  {task.finished_at
                    ? new Date(task.finished_at).toLocaleDateString()
                    : "Not Finished"}
                </p>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityStyle(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <select
                  className={`px-3 py-1 rounded-full text-sm font-semibold focus:outline-none ${getStatusStyle(
                    task
                  )}`}
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                >
                  {["Not Started", "In Progress", "Finished"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                {/* <button
                  onClick={() => {
                    setSelectedTask(task);
                    setShowForm(true);
                  }}
                  className="px-3 py-1 text-white transition bg-yellow-500 rounded-md hover:bg-yellow-600"
                >
                  Edit
                </button> */}

                <button
                  onClick={() => {
                    setShowConfirmDelete(true);
                    setTaskToDelete(task);
                  }}
                  className="px-3 py-1 text-white transition bg-red-500 rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showConfirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold text-gray-800">Confirm Delete</h3>
            <p className="text-gray-600">
              Are you sure you want to delete this task? This will also delete
              all related subtasks.
            </p>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 text-white bg-red-500 rounded-md"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-white bg-gray-500 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
