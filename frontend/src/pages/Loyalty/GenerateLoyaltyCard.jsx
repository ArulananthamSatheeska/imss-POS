import React, { useState, useEffect } from "react";
import axios from "axios";

const GenerateLoyaltyCard = () => {
  // State to manage form inputs
  const [cardDetails, setCardDetails] = useState({
    cardName: "",
    calculationType: "Point-wise",
    pointCalculationMode: "Range-wise",
    pointsPerThreshold: "",
    pointsPerThresholdValue: "",
    ranges: [
      { minRange: "", maxRange: "", points: "", discountPercentage: "" },
    ],
  });

  // State to store saved configurations from backend
  const [configurations, setConfigurations] = useState([]);

  // Fetch configurations on component mount
  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/loyalty-cards"
      );
      // Map the response data to match frontend field names
      const mappedConfigs = response.data.map((config) => ({
        ...config,
        ranges: config.ranges
          ? config.ranges.map((range) => ({
              minRange: range.min_range,
              maxRange: range.max_range,
              points: range.points,
              discountPercentage: range.discount_percentage,
            }))
          : [],
      }));
      setConfigurations(mappedConfigs);
    } catch (error) {
      console.error("Error fetching configurations:", error);
    }
  };

  // Handle input changes for card name, calculation type, point calculation mode, and threshold fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle range input changes
  const handleRangeChange = (index, e) => {
    const { name, value } = e.target;
    const updatedRanges = [...cardDetails.ranges];
    updatedRanges[index] = { ...updatedRanges[index], [name]: value };
    setCardDetails((prev) => ({
      ...prev,
      ranges: updatedRanges,
    }));
  };

  // Add new range row
  const addRange = () => {
    setCardDetails((prev) => ({
      ...prev,
      ranges: [
        ...prev.ranges,
        { minRange: "", maxRange: "", points: "", discountPercentage: "" },
      ],
    }));
  };

  // Calculate points based on threshold for Threshold-wise
  const calculatePoints = (billAmount) => {
    const threshold = parseInt(cardDetails.pointsPerThreshold) || 1;
    const pointsPerThreshold =
      parseInt(cardDetails.pointsPerThresholdValue) || 1;
    return Math.floor(parseInt(billAmount) / threshold) * pointsPerThreshold;
  };

  // Save the configuration to the backend
  const handleSave = async () => {
    // Validate form inputs
    if (!cardDetails.cardName) {
      alert("Please enter a card name.");
      return;
    }

    if (
      cardDetails.calculationType === "Point-wise" &&
      cardDetails.pointCalculationMode === "Range-wise"
    ) {
      const hasValidRange = cardDetails.ranges.some(
        (range) => range.minRange && range.maxRange && range.points
      );
      if (!hasValidRange) {
        alert(
          "Please provide at least one range with a minimum amount, maximum amount, and points for Range-wise configuration."
        );
        return;
      }

      for (const range of cardDetails.ranges) {
        if (range.minRange || range.maxRange || range.points) {
          if (!range.minRange || !range.maxRange || !range.points) {
            alert(
              "Minimum range, maximum range, and points are required for Range-wise configuration."
            );
            return;
          }
          if (parseFloat(range.maxRange) <= parseFloat(range.minRange)) {
            alert("Maximum range must be greater than minimum range.");
            return;
          }
          if (parseFloat(range.points) < 0) {
            alert("Points cannot be negative.");
            return;
          }
        }
      }
    } else if (
      cardDetails.calculationType === "Point-wise" &&
      cardDetails.pointCalculationMode === "Threshold-wise"
    ) {
      if (
        !cardDetails.pointsPerThreshold ||
        !cardDetails.pointsPerThresholdValue
      ) {
        alert(
          "Please enter both the threshold and points per threshold for Threshold-wise configuration."
        );
        return;
      }
      if (
        parseInt(cardDetails.pointsPerThreshold) <= 0 ||
        parseInt(cardDetails.pointsPerThresholdValue) <= 0
      ) {
        alert("Threshold and points per threshold must be greater than 0.");
        return;
      }
    } else if (cardDetails.calculationType === "Percentage-wise") {
      const hasValidRange = cardDetails.ranges.some(
        (range) => range.minRange && range.maxRange && range.discountPercentage
      );
      if (!hasValidRange) {
        alert(
          "Please provide at least one range with a minimum amount, maximum amount, and percentage for Percentage-wise configuration."
        );
        return;
      }

      for (const range of cardDetails.ranges) {
        if (range.minRange || range.maxRange || range.discountPercentage) {
          if (!range.minRange || !range.maxRange || !range.discountPercentage) {
            alert(
              "Minimum range, maximum range, and percentage are required for Percentage-wise configuration."
            );
            return;
          }
          if (parseFloat(range.maxRange) <= parseFloat(range.minRange)) {
            alert("Maximum range must be greater than minimum range.");
            return;
          }
          if (
            parseFloat(range.discountPercentage) < 0 ||
            parseFloat(range.discountPercentage) > 100
          ) {
            alert("Percentage must be between 0 and 100.");
            return;
          }
        }
      }
    }

    try {
      const payload = {
        card_name: cardDetails.cardName,
        calculation_type: cardDetails.calculationType,
        point_calculation_mode: cardDetails.pointCalculationMode,
        points_per_threshold: cardDetails.pointsPerThreshold
          ? parseInt(cardDetails.pointsPerThreshold)
          : null,
        points_per_threshold_value: cardDetails.pointsPerThresholdValue
          ? parseInt(cardDetails.pointsPerThresholdValue)
          : null,
        ranges: cardDetails.ranges.filter(
          (range) =>
            range.minRange ||
            range.maxRange ||
            range.points ||
            range.discountPercentage
        ),
      };

      await axios.post("http://localhost:8000/api/loyalty-cards", payload);
      alert("Loyalty card configuration saved successfully!");
      fetchConfigurations(); // Refresh the table with new data
      // Reset form
      setCardDetails({
        cardName: "",
        calculationType: "Point-wise",
        pointCalculationMode: "Range-wise",
        pointsPerThreshold: "",
        pointsPerThresholdValue: "",
        ranges: [
          { minRange: "", maxRange: "", points: "", discountPercentage: "" },
        ],
      });
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Failed to save loyalty card configuration.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Generate Loyalty Card
      </h2>

      {/* Form to generate loyalty card */}
      <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Loyalty Card Configuration
        </h3>

        {/* Loyalty Card Name */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            Loyalty Card Name
          </label>
          <input
            type="text"
            name="cardName"
            value={cardDetails.cardName}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Enter card name (e.g., Silver)"
          />
        </div>

        {/* Calculation Type (Point-wise or Percentage-wise) */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            Calculation Type
          </label>
          <select
            name="calculationType"
            value={cardDetails.calculationType}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="Point-wise">Point-wise</option>
            <option value="Percentage-wise">Percentage-wise</option>
          </select>
        </div>

        {/* Point Calculation Mode (Range-wise or Threshold-wise) */}
        {cardDetails.calculationType === "Point-wise" && (
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Point Calculation Mode
            </label>
            <select
              name="pointCalculationMode"
              value={cardDetails.pointCalculationMode}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="Range-wise">
                Range-wise (Fixed Points per Range)
              </option>
              <option value="Threshold-wise">
                Threshold-wise (Points per Threshold)
              </option>
            </select>
          </div>
        )}

        {/* Points per Threshold for Threshold-wise */}
        {cardDetails.calculationType === "Point-wise" &&
          cardDetails.pointCalculationMode === "Threshold-wise" && (
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                Points per Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="pointsPerThresholdValue"
                  value={cardDetails.pointsPerThresholdValue}
                  onChange={handleInputChange}
                  className="w-1/4 p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., 1"
                  min="1"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  points for every
                </span>
                <input
                  type="number"
                  name="pointsPerThreshold"
                  value={cardDetails.pointsPerThreshold}
                  onChange={handleInputChange}
                  className="w-1/4 p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., 1000"
                  min="1"
                />
                <span className="text-gray-700 dark:text-gray-300">LKR</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Example: For a 6000 LKR bill with 1 point per 1000 LKR, points ={" "}
                {calculatePoints(6000)}
              </p>
            </div>
          )}

        {/* Range Configuration (Not shown for Threshold-wise) */}
        {(cardDetails.calculationType === "Percentage-wise" ||
          (cardDetails.calculationType === "Point-wise" &&
            cardDetails.pointCalculationMode === "Range-wise")) && (
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Sale Amount Range and{" "}
              {cardDetails.calculationType === "Point-wise"
                ? "Points"
                : "Percentage"}
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2 text-center font-semibold bg-gray-200 dark:bg-gray-600 p-2 rounded-t-lg">
              <div>Sale Amt (Minimum Range)</div>
              <div>Sale Amt (Maximum Range)</div>
              <div>
                {cardDetails.calculationType === "Point-wise"
                  ? "Points"
                  : "Percentage"}
              </div>
              <div></div>
            </div>
            {cardDetails.ranges.map((range, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                <input
                  type="number"
                  name="minRange"
                  value={range.minRange}
                  onChange={(e) => handleRangeChange(index, e)}
                  className="p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Min Range (e.g., 1000)"
                  min="0"
                />
                <input
                  type="number"
                  name="maxRange"
                  value={range.maxRange}
                  onChange={(e) => handleRangeChange(index, e)}
                  className="p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Max Range (e.g., 5000)"
                  min="0"
                />
                {cardDetails.calculationType === "Point-wise" ? (
                  <input
                    type="number"
                    name="points"
                    value={range.points}
                    onChange={(e) => handleRangeChange(index, e)}
                    className="p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Points (e.g., 5)"
                    min="0"
                  />
                ) : (
                  <input
                    type="number"
                    name="discountPercentage"
                    value={range.discountPercentage}
                    onChange={(e) => handleRangeChange(index, e)}
                    className="p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Percentage (e.g., 2)"
                    min="0"
                    max="100"
                  />
                )}
                {index === cardDetails.ranges.length - 1 && (
                  <button
                    onClick={addRange}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    Add Item
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Save and Close Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => window.close()} // Simulate close (adjust as needed)
            className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>

      {/* Table to display saved configurations */}
      {configurations.length > 0 && (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Saved Loyalty Card Configurations
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-600">
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Card Name
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Calculation Type
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Reward Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {configurations.map((config, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-300 dark:border-gray-600"
                  >
                    <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                      {config.card_name}
                    </td>
                    <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                      {config.calculation_type === "Point-wise"
                        ? `${config.point_calculation_mode} Points`
                        : "Percentage-wise"}
                    </td>
                    <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                      {config.calculation_type === "Point-wise" &&
                      config.point_calculation_mode === "Threshold-wise" ? (
                        <div>
                          {config.points_per_threshold_value} point
                          {parseInt(config.points_per_threshold_value) !== 1
                            ? "s"
                            : ""}{" "}
                          per {config.points_per_threshold} LKR
                        </div>
                      ) : Array.isArray(config.ranges) &&
                        config.ranges.length > 0 ? (
                        config.ranges.map((range, rangeIndex) =>
                          (range.minRange || range.maxRange) &&
                          (range.points || range.discountPercentage) ? (
                            <div key={rangeIndex}>
                              LKR {range.minRange} - LKR {range.maxRange}:{" "}
                              {config.calculation_type === "Point-wise"
                                ? `${range.points} points`
                                : `${range.discountPercentage}% percentage`}
                            </div>
                          ) : null
                        )
                      ) : (
                        <div>No ranges available</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateLoyaltyCard;
