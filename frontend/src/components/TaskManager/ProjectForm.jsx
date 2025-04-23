import { useState } from "react";
// import { postData, putData } from "../../services/api";
import { Card, Input, Button, Typography } from "@material-tailwind/react";

export default function ProjectForm({ project, onSave, onClose }) {
  const [name, setName] = useState(project ? project.name : "");
  const [description, setDescription] = useState(
    project ? project.description : ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = { name, description };

    try {
      let response;
      if (project) {
        // Update existing project
        response = await api.put(`/projects/${project.id}`, data);
      } else {
        // Create new project
        response = await api.post("/projects", data);
      }
      onSave(response.data);
      setName(""); // Clear form fields
      setDescription(""); // Clear form fields
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  return (
    <div className="flex items-center justify-center bg-white">
      <Card className="block w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <Typography
          variant="h4"
          className="font-bold text-center text-gray-800"
        >
          {project ? "Edit Project" : "Add Project"}
        </Typography>
        <Typography className="mb-6 text-center text-gray-600">
          {project
            ? "Edit the project details below."
            : "Fill in the project details below."}
        </Typography>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Project Name"
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Project Description"
            className="w-full p-2 bg-gray-300 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-between">
            <Button type="submit" className="w-1/2 mr-2">
              {project ? "Update Project" : "Create Project"}
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
