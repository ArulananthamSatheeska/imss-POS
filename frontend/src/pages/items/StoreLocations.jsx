import React, { useState, useEffect } from "react";
import axios from "axios";
import StoreLocationForm from "../../components/StoreLocation/StoreLocationForm"; // Assuming path to StoreLocationForm

const StoreLocations = () => {
  const [storeLocations, setStoreLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    fetchStoreLocations();
  }, []);

  const fetchStoreLocations = async () => {
    try {
      const response = await axios.get(
        "https://imssposerp.com/backend/public/api/store-locations"
      );
      setStoreLocations(response.data);
    } catch (error) {
      console.error("Error fetching store locations:", error);
    }
  };

  return (
    <div>
      <StoreLocationForm
        location={selectedLocation}
        onSuccess={() => {
          setSelectedLocation(null); // Reset selected location
          fetchStoreLocations(); // Re-fetch store locations after update/add
        }}
      />
    </div>
  );
};

export default StoreLocations;
