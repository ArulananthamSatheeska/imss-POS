import { useState, useEffect } from "react";
import ProjectForm from "../../components/TaskManager/ProjectForm";
import TaskForm from "../../components/TaskManager/TaskForm";
import SubtaskForm from "../../components/TaskManager/SubtaskForm";
import api from "../../services/taskapi";

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // State for selected task to show details

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleProjectSave = (project) => {
    setProjects((prev) => [...prev, project]);
    setShowProjectForm(false);
  };

  const getStatusStyle = (status, dueDate) => {
    const today = new Date();
    const taskDueDate = new Date(dueDate);
    const isOverdue = taskDueDate < today && status !== "Finished";

    if (isOverdue) {
      return "bg-red-500 text-white animate-pulse"; // Blink in red for overdue tasks
    }

    const statusColors = {
      "Not Started": "bg-gray-400 text-white",
      "In Progress": "bg-yellow-500 text-white",
      Finished: "bg-green-500 text-white",
      Overdue: "bg-red-500 text-white animate-pulse",
    };
    return statusColors[status] || "bg-gray-300";
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task); // Set the selected task to show details
  };

  const closeTaskDetails = () => {
    setSelectedTask(null); // Close the task details modal
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Extracts YYYY-MM-DD
  };

  return (
    <div className="p-8 pt-20">
      <div className="flex justify-start my-4 space-x-4">
        <button
          onClick={() => setShowProjectForm(true)}
          className="px-4 py-2 text-white bg-blue-500 rounded"
        >
          Add Project
        </button>
        <button
          onClick={() => setShowTaskForm(true)}
          className="px-4 py-2 text-white bg-green-500 rounded"
        >
          Add Task
        </button>
        <button
          onClick={() => setShowSubtaskForm(true)}
          className="px-4 py-2 text-white bg-purple-500 rounded"
        >
          Add Subtask
        </button>
      </div>

      {showProjectForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-96">
            <ProjectForm
              onSave={handleProjectSave}
              onClose={() => setShowProjectForm(false)}
            />
          </div>
        </div>
      )}

      {showTaskForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-96">
            <TaskForm
              onSave={() => {
                setShowTaskForm(false);
                fetchProjects();
              }}
              onClose={() => setShowTaskForm(false)}
            />
          </div>
        </div>
      )}

      {showSubtaskForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-96">
            <SubtaskForm
              onSave={() => {
                setShowSubtaskForm(false);
                fetchProjects();
              }}
              onClose={() => setShowSubtaskForm(false)}
            />
          </div>
        </div>
      )}

      {/* Display Projects, Tasks, and Subtasks in columns */}
      <div className="flex mt-8 space-x-8 overflow-x-auto">
        {projects.map((project) => (
          <div
            key={project.id}
            className="w-64 p-4 bg-white rounded-lg shadow-md min-w-64"
          >
            <h3 className="text-xl font-bold text-gray-800">{project.name}</h3>
            <div className="mt-4 space-y-2">
              {project.tasks && project.tasks.length > 0 ? (
                project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg cursor-pointer ${getStatusStyle(
                      task.status,
                      task.due_date
                    )}`}
                    onClick={() => handleTaskClick(task)} // Click to view task details
                  >
                    <h4 className="font-semibold text-md">{task.name}</h4>
                    {task.subtasks && task.subtasks.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {task.subtasks.map((subtask) => (
                          <li
                            key={subtask.id}
                            className={`p-2 rounded ${getStatusStyle(
                              subtask.status,
                              subtask.due_date
                            )}`}
                          >
                            {subtask.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tasks yet</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold text-gray-600">
              {selectedTask.name}
            </h3>
            <p className="mt-2 text-gray-700">
              <strong>Status:</strong> {selectedTask.status}
            </p>
            <p className="mt-2 text-gray-700">
              <strong>Priority:</strong> {selectedTask.priority}
            </p>
            <p className="mt-2 text-gray-700">
              <strong>Due Date:</strong> {formatDate(selectedTask.due_date)}
            </p>
            <p className="mt-2 text-gray-700">
              <strong>Created At:</strong> {formatDate(selectedTask.created_at)}
            </p>
            <p className="mt-2 text-gray-700">
              <strong>Started:</strong>{" "}
              {selectedTask.started_at
                ? new Date(selectedTask.started_at).toLocaleDateString()
                : "Not Started"}
            </p>
            <p className="mt-2 text-gray-700">
              <strong>Finished:</strong>{" "}
              {selectedTask.finished_at
                ? new Date(selectedTask.finished_at).toLocaleDateString()
                : "Not Finished"}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeTaskDetails}
                className="px-4 py-2 text-white bg-gray-500 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
