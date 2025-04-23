import { useState, useEffect } from "react";
import api from "../../services/taskapi";
import { Card, Input, Button, Typography } from "@material-tailwind/react";

export default function TaskForm({ task, onSave, onClose }) {
  const [name, setName] = useState(task ? task.name : "");
  const [description, setDescription] = useState(task ? task.description : "");
  const [status, setStatus] = useState(task ? task.status : "Not Started");
  const [priority, setPriority] = useState(
    task ? task.priority : "Medium Priority"
  );
  const [dueDate, setDueDate] = useState(task ? task.due_date : "");
  const [projectId, setProjectId] = useState(task ? task.project_id : "");
  const [projects, setProjects] = useState([]);
  const [startedAt, setStartedAt] = useState(task ? task.started_at : "");
  const [finishedAt, setFinishedAt] = useState(task ? task.finished_at : "");

  useEffect(() => {
    api
      .get("/projects")
      .then((response) => setProjects(response.data))
      .catch((error) => console.error("Error fetching projects:", error));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name,
      description,
      status,
      priority,
      due_date: dueDate,
      project_id: projectId,
      started_at: startedAt, // Include these fields
      finished_at: finishedAt,
    };

    console.log("Request data:", data); // Debugging the request data
    try {
      let response = task
        ? await api.put(`/tasks/${task.id}`, data)
        : await api.post("/tasks", data);
      onSave(response.data);
      setName("");
      setDescription("");
      setStatus("Not Started");
      setPriority("Medium Priority");
      setDueDate("");
      setProjectId("");
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  return (
    <div className="flex items-center justify-center bg-white overflow-y-auto max-h-96 pt-36">
      <Card className="block w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <Typography
          variant="h4"
          className="font-bold text-center text-gray-800"
        >
          {task ? "Edit Task" : "Add Task"}
        </Typography>
        <Typography className="mb-6 text-center text-gray-600">
          {task
            ? "Modify the task details."
            : "Fill in the task details below."}
        </Typography>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Task Name"
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Task Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
          <select
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {["High Priority", "Medium Priority", "Low Priority"].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
          <Input
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Input
            label="Started Date"
            value={
              startedAt
                ? new Date(startedAt).toLocaleDateString()
                : "Not Started"
            }
            disabled
          />
          <Input
            label="Finished Date"
            value={
              finishedAt
                ? new Date(finishedAt).toLocaleDateString()
                : "Not Finished"
            }
            disabled
          />

          <select
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            <option value="">select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <div className="flex justify-between">
            <Button type="submit" className="w-1/2 mr-2">
              {task ? "Update" : "Create"}
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
