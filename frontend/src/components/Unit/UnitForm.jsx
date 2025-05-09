import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Trash } from "lucide-react"; // Icons
import Notification from "../notification/Notification"; // Notification component

const UnitForm = () => {
  const [unitName, setUnitName] = useState("");
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
    onConfirm: null,
  });

  // Fetch units from the API
  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await axios.get(
        "https://imssposerp.com/backend/public/api/units"
      );
      setUnits(response.data);
    } catch (error) {
      console.error("Error fetching units:", error);
      showNotification("Failed to fetch units.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedUnit) {
        await axios.put(
          `https://imssposerp.com/backend/public/api/units/${selectedUnit.id}`,
          {
            unit_name: unitName,
          }
        );
        setNotification({
          message: "Unit updated successfully!",
          type: "success",
          visible: true,
        });
        fetchUnits();
      } else {
        await axios.post("https://imssposerp.com/backend/public/api/units", {
          unit_name: unitName,
        });
        setNotification({
          message: "Unit added successfully!",
          type: "success",
          visible: true,
        });
        fetchUnits();
      }
      setUnitName(""); // Clear input after submission
      setSelectedUnit(null); // Reset selected unit
    } catch (error) {
      console.error("Error saving unit:", error);
      const errorMessage =
        error.response?.data?.message || "Unit already exists!";
      setNotification({ message: errorMessage, type: "error", visible: true });
    }
  };

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setUnitName(unit.unit_name);
  };

  const handleDelete = (id) => {
    setNotification({
      message: "Are you sure you want to delete this unit?",
      type: "confirm",
      visible: true,
      onConfirm: () => confirmDelete(id),
    });
  };

  const confirmDelete = async (id) => {
    try {
      await axios.delete(
        `https://imssposerp.com/backend/public/api/units/${id}`
      );
      fetchUnits(); // Re-fetch units after deletion
      setNotification({
        message: "Unit deleted successfully!",
        type: "success",
        visible: true,
        onConfirm: null, // No further action required
      });
    } catch (error) {
      console.error("Error deleting unit:", error);
      setNotification({
        message: "Error deleting unit!",
        type: "error",
        visible: true,
        onConfirm: null, // No further action required
      });
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification({ ...notification, visible: false });
    }, 3000); // Hide notification after 3 seconds
  };

  return (
    <div className="container mx-auto p-4">
      {/* Notification Component */}
      {notification.visible && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, visible: false })}
          onConfirm={notification.onConfirm}
        >
          {notification.type === "confirm" && (
            <div className="flex justify-center mt-4 space-x-4">
              <button
                onClick={notification.onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Yes, Delete
              </button>
              <button
                onClick={() =>
                  setNotification({ ...notification, visible: false })
                }
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}
        </Notification>
      )}

      {/* Flex container for form and table */}
      <div className="flex space-x-8">
        {/* Unit Form */}
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out mb-6"
        >
          <h2 className="text-2xl font-bold text-center mb-4 text-amber-600">
            {selectedUnit ? "Update" : "Add"} Unit
          </h2>

          <div className="mb-4">
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="Unit Name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-105"
          >
            {selectedUnit ? "Update" : "Add"} Unit
          </button>
        </form>

        {/* Unit Table */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full border border-collapse">
            <thead className="bg-gray-500">
              <tr className="text-left">
                <th className="px-4 py-2 border-b-2 border-gray-300">S.No</th>
                <th className="px-4 py-2 border-b-2 border-gray-300">
                  Unit Name
                </th>
                <th className="px-4 py-2 border-b-2 border-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-center">
              {units.map((unit, index) => (
                <tr key={unit.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b border-gray-300">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-300">
                    {unit.unit_name}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-300">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(unit)}
                        className="px-2 py-1 text-blue-600 bg-blue-200 rounded-lg hover:bg-blue-300"
                        title="Edit Unit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
                        className="px-2 py-1 text-red-600 bg-red-200 rounded-lg hover:bg-red-300"
                        title="Delete Unit"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnitForm;
