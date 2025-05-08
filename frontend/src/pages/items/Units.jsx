import React, { useState, useEffect } from "react";
import axios from "axios";
import UnitForm from "../../components/Unit/UnitForm";

const Units = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await axios.get(
        "https://sharvakshafoodcity.com.lk/backend/public/api/units"
      );
      setUnits(response.data);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  return (
    <div>
      <UnitForm
        unit={selectedUnit}
        onSuccess={() => {
          setSelectedUnit(null);
          fetchUnits();
        }}
      />
    </div>
  );
};

export default Units;
