import React, { useState, useEffect } from "react";
import axios from "axios";

const API_CUSTOMERS_URL = "http://localhost:8000/api/customers";
const API_LOYALTY_CARDS_URL = "http://localhost:8000/api/loyalty-cards";

const CustomerLoyaltyDetails = () => {
  const [customers, setCustomers] = useState([]);
  const [loyaltyCards, setLoyaltyCards] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, loyaltyCardsResponse] = await Promise.all([
          axios.get(API_CUSTOMERS_URL),
          axios.get(API_LOYALTY_CARDS_URL),
        ]);
        setCustomers(
          customersResponse.data.data || customersResponse.data || []
        );
        setLoyaltyCards(loyaltyCardsResponse.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch customer or loyalty card details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatRewardDetails = (card) => {
    if (
      card.calculation_type === "Point-wise" &&
      card.point_calculation_mode === "Threshold-wise"
    ) {
      return `${card.points_per_threshold_value} point${
        parseInt(card.points_per_threshold_value) !== 1 ? "s" : ""
      } per ${card.points_per_threshold} LKR`;
    } else if (Array.isArray(card.ranges) && card.ranges.length > 0) {
      const firstRange = card.ranges[0];
      return `LKR ${firstRange.min_range || 0}-${firstRange.max_range || 0}: ${
        card.calculation_type === "Point-wise"
          ? `${firstRange.points || 0} points`
          : `${firstRange.discount_percentage || 0}%`
      }`;
    }
    return "No reward details";
  };

  const formatCardType = (card) => {
    if (!card) return "-";
    return card.calculation_type === "Point-wise"
      ? `${card.calculation_type} (${card.point_calculation_mode})`
      : card.calculation_type;
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchInput.trim()) return true; // Show all customers if search is empty

    const search = searchInput.trim().toLowerCase();
    const phone = customer.phone?.toString().toLowerCase() || "";
    const nic = customer.nic_number?.toLowerCase() || "";
    const cardNumber = customer.loyalty_card_number?.toLowerCase() || "";
    const name = customer.customer_name?.toLowerCase() || "";

    // Check if search input is a valid NIC format (9 digits + optional v/V/x/X or 12 digits)
    const isNic = /^[0-9]{9}[vVxX]?$|^[0-9]{12}$/.test(search);

    return (
      phone.includes(search) || // Partial match for phone
      cardNumber.includes(search) || // Partial match for card number
      (isNic && nic === search) || // Exact match for NIC
      name.includes(search) // Partial match for name (optional)
    );
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Loyalty Points Report
      </h2>
      <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Search Customer
        </h3>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Enter phone, NIC, card number, or name"
          />
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Customer List
        </h3>
        {filteredCustomers.length === 0 && searchInput.trim() ? (
          <p className="text-gray-600 dark:text-gray-400">
            No customers found matching your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-600">
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Name
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Mobile
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    NIC
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Card Type
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Visits
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    T.Qty
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Total Sale
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Points Earned
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Points Redeemed
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Points Balance
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Last Visit
                  </th>
                  <th className="p-2 text-left text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                    Days
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const card = loyaltyCards.find(
                    (c) => c.card_name === customer.card_name
                  );
                  return (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-300 dark:border-gray-600"
                    >
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {customer.customer_name || "-"}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {customer.phone || "0"}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {customer.nic_number || "-"}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {card ? formatCardType(card) : "-"}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {0}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {0}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {0}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {0}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {0}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {0}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        -
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        -
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLoyaltyDetails;
