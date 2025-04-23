import { useState, useEffect } from "react";
import api from "../../services/taskapi";
import { Card, Input, Button, Typography } from "@material-tailwind/react";

export default function SubtaskForm({ subtask, onSave, onClose }) {
  const [name, setName] = useState(subtask ? subtask.name : "");
  const [status, setStatus] = useState(
    subtask ? subtask.status : "Not Started"
  );
  const [dueDate, setDueDate] = useState(subtask ? subtask.due_date : "");
  const [taskId, setTaskId] = useState(subtask ? subtask.task_id : "");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    api
      .get("/tasks")
      .then((response) => setTasks(response.data))
      .catch((error) => console.error("Error fetching tasks:", error));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = { name, status, due_date: dueDate, task_id: taskId };

    try {
      let response = subtask
        ? await api.put(`/subtasks/${subtask.id}`, data)
        : await api.post("/subtasks", data);
      onSave(response.data);
      setName("");
      setStatus("Not Started");
      setDueDate("");
      setTaskId("");
    } catch (error) {
      console.error("Error saving subtask:", error);
    }
  };

  return (
    <div className="flex items-center justify-center bg-white">
      <Card className="block w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <Typography
          variant="h4"
          className="font-bold text-center text-gray-800"
        >
          {subtask ? "Edit Subtask" : "Add Subtask"}
        </Typography>
        <Typography className="mb-6 text-center text-gray-600">
          {subtask
            ? "Modify the subtask details."
            : "Fill in the subtask details below."}
        </Typography>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Subtask Name"
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["Not Started", "In Progress", "Finished", "Overdue"].map(
              (val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              )
            )}
          </select>
          <Input
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <select
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            label="Task"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            required
          >
            <option value="">Select a task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
          <div className="flex justify-between">
            <Button type="submit" className="w-1/2 mr-2">
              {subtask ? "Update" : "Create"}
            </Button>
            <Button type="button" className="w-1/2 ml-2" onClick={onClose}>
              Close
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
