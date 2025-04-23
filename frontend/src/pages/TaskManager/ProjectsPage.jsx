import { useState, useEffect } from "react";
import ProjectForm from "../../components/TaskManager/ProjectForm";
import api from "../../services/taskapi";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await api.delete(`/projects/${projectToDelete.id}`);
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== projectToDelete.id)
      );
      setShowConfirmDelete(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleSave = (project) => {
    setProjects((prev) =>
      selectedProject
        ? prev.map((p) => (p.id === project.id ? project : p))
        : [project, ...prev]
    );
    setShowForm(false);
    setSelectedProject(null);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-100 pt-24">
      <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Projects</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setSelectedProject(null);
          }}
          className="px-4 py-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Add Project
        </button>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="p-6 bg-white rounded-lg shadow-lg w-96">
              <ProjectForm
                project={selectedProject}
                onSave={handleSave}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between p-4 rounded-lg shadow-md bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  {project.name}
                </h3>
                <p className="text-gray-600">{project.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setShowForm(true);
                  }}
                  className="px-3 py-1 text-white transition bg-yellow-500 rounded-md hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDelete(true);
                    setProjectToDelete(project);
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
              Are you sure you want to delete this project? This will also
              delete all related tasks and subtasks.
            </p>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleDeleteProject}
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
