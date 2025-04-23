import { useState, useEffect } from "react";
import api from "../../services/taskapi";
import SubtaskForm from "../../components/TaskManager/SubtaskForm";

export default function SubtasksPage() {
  const [subtasks, setSubtasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState(null);

  useEffect(() => {
    fetchSubtasks();
  }, []);

  const fetchSubtasks = async () => {
    try {
      const response = await api.get("/subtasks");
      const updatedSubtasks = response.data.map((subtask) => ({
        ...subtask,
        status: checkIfOverdue(subtask),
      }));
      setSubtasks(updatedSubtasks);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    }
  };

  const updateSubtaskStatus = async (subtaskId, newStatus) => {
    try {
      await api.put(`/subtasks/${subtaskId}`, { status: newStatus });
      setSubtasks((prevSubtasks) =>
        prevSubtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, status: newStatus } : subtask
        )
      );
    } catch (error) {
      console.error("Error updating subtask status:", error);
    }
  };

  const checkIfOverdue = (subtask) => {
    const today = new Date();
    const dueDate = new Date(subtask.due_date);
    return dueDate < today && subtask.status !== "Finished"
      ? "Overdue"
      : subtask.status;
  };

  const handleDeleteSubtask = async () => {
    if (!subtaskToDelete) return;
    try {
      await api.delete(`/subtasks/${subtaskToDelete.id}`);
      setSubtasks((prevSubtasks) =>
        prevSubtasks.filter((subtask) => subtask.id !== subtaskToDelete.id)
      );
      setShowConfirmDelete(false);
      setSubtaskToDelete(null);
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  const getStatusStyle = (subtask) => {
    const today = new Date();
    const dueDate = new Date(subtask.due_date);
    const isOverdue = dueDate < today && subtask.status !== "Finished";

    if (isOverdue) {
      return "bg-red-500 text-white animate-pulse";
    }

    const statusColors = {
      "Not Started": "bg-gray-400 text-white",
      "In Progress": "bg-yellow-500 text-white",
      Finished: "bg-green-500 text-white",
    };

    return statusColors[subtask.status] || "bg-gray-300";
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 pt-24">
      <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Subtasks</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setSelectedSubtask(null);
          }}
          className="px-4 py-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Add Subtask
        </button>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="p-6 bg-white rounded-lg shadow-lg w-96">
              <SubtaskForm
                subtask={selectedSubtask}
                onSave={() => {
                  setShowForm(false);
                  fetchSubtasks();
                }}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center justify-between p-4 rounded-lg shadow-md bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  {subtask.name}
                </h3>
                <p className="text-gray-600">Due Date: {subtask.due_date}</p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  className={`px-3 py-1 rounded-full text-sm font-semibold focus:outline-none ${getStatusStyle(
                    subtask
                  )}`}
                  value={subtask.status}
                  onChange={(e) =>
                    updateSubtaskStatus(subtask.id, e.target.value)
                  }
                >
                  {["Not Started", "In Progress", "Finished"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setSelectedSubtask(subtask);
                    setShowForm(true);
                  }}
                  className="px-3 py-1 text-white transition bg-yellow-500 rounded-md hover:bg-yellow-600"
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    setShowConfirmDelete(true);
                    setSubtaskToDelete(subtask);
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
              Are you sure you want to delete this subtask?
            </p>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleDeleteSubtask}
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
