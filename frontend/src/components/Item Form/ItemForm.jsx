import React, { useState, useEffect } from "react";
import "./itemform.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ItemForm = ({ onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    product_name: initialData?.product_name || "",
    item_code: initialData?.item_code || "",
    batch_number: initialData?.batch_number || "",
    expiry_date: initialData?.expiry_date || "",
    buying_cost: initialData?.buying_cost || "",
    sales_price: initialData?.sales_price || "",
    minimum_price: initialData?.minimum_price || "",
    wholesale_price: initialData?.wholesale_price || "",
    barcode: initialData?.barcode || "",
    mrp: initialData?.mrp || "",
    minimum_stock_quantity: initialData?.minimum_stock_quantity || "",
    opening_stock_quantity: initialData?.opening_stock_quantity || "",
    opening_stock_value: initialData?.opening_stock_value || "",
    category: initialData?.category || "",
    supplier: initialData?.supplier || "",
    unit_type: initialData?.unit_type || "",
    store_location: initialData?.store_location || "",
    cabinet: initialData?.cabinet || "",
    row: initialData?.row || "",
    extra_fields: initialData?.extra_fields
      ? (() => {
        try {
          const parsed = typeof initialData.extra_fields === "string"
            ? JSON.parse(initialData.extra_fields)
            : initialData.extra_fields;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
      : [],
  });

  const [categories, setCategories] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, unitTypesRes, suppliersRes, storesRes] =
          await Promise.all([
            axios.get("http://127.0.0.1:8000/api/categories"),
            axios.get("http://127.0.0.1:8000/api/units"),
            axios.get("http://127.0.0.1:8000/api/suppliers"),
            axios.get("http://127.0.0.1:8000/api/store-locations"),
          ]);

        setCategories(categoriesRes.data);
        setUnitTypes(unitTypesRes.data);
        setSuppliers(suppliersRes.data);
        setStores(storesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching form data: " + error.message);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));

    if (name === "opening_stock_quantity" || name === "buying_cost") {
      const opening_stock_value =
        (parseFloat(formData.opening_stock_quantity) || 0) *
        (parseFloat(formData.buying_cost) || 0);
      setFormData((prevData) => ({
        ...prevData,
        opening_stock_value: opening_stock_value.toFixed(2),
      }));
    }
  };

  const handleExtraFieldChange = (index, e) => {
    const { name, value } = e.target;
    const updatedExtraFields = [...formData.extra_fields];
    updatedExtraFields[index][name] = value;
    setFormData({ ...formData, extra_fields: updatedExtraFields });
  };

  const addExtraField = () => {
    setFormData((prevData) => ({
      ...prevData,
      extra_fields: [...prevData.extra_fields, { name: "", value: "" }],
    }));
  };

  const removeExtraField = (index) => {
    const updatedExtraFields = formData.extra_fields.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, extra_fields: updatedExtraFields });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Remove the check that blocks submission if initialData exists but no product_id
    // if (initialData && !initialData.product_id) {
    //   toast.error("Invalid product ID. Cannot update product.");
    //   return;
    // }

    const itemData = {
      ...formData,
      buying_cost: parseFloat(formData.buying_cost) || 0,
      sales_price: parseFloat(formData.sales_price) || 0,
      minimum_price: parseFloat(formData.minimum_price) || 0,
      wholesale_price: parseFloat(formData.wholesale_price) || 0,
      mrp: parseFloat(formData.mrp) || 0,
      minimum_stock_quantity: parseInt(formData.minimum_stock_quantity) || 0,
      opening_stock_quantity: parseInt(formData.opening_stock_quantity) || 0,
      opening_stock_value: parseFloat(formData.opening_stock_value) || 0,
      extra_fields: JSON.stringify(formData.extra_fields || []),
    };

    console.log("Sending data to backend:", itemData);

    try {
      onSubmit(itemData);
      setFormData({
        product_name: "",
        item_code: "",
        batch_number: "",
        expiry_date: "",
        buying_cost: "",
        sales_price: "",
        minimum_price: "",
        wholesale_price: "",
        barcode: "",
        mrp: "",
        minimum_stock_quantity: "",
        opening_stock_quantity: "",
        opening_stock_value: "",
        category: "",
        supplier: "",
        unit_type: "",
        store_location: "",
        cabinet: "",
        row: "",
        extra_fields: [],
      });
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(
        error.response?.data?.message ||
        "Failed to save product. Please try again."
      );
    }
  };

  const handleClose = (e) => {
    e.preventDefault();
    if (
      window.confirm(
        "Are you sure you want to close? Any unsaved changes will be lost."
      )
    ) {
      onClose();
    }
  };

  const handleBlur = (fieldName) => {
    setFormData((prevData) => {
      const updatedData = { ...prevData };

      if (fieldName === "item_code" && !updatedData.item_code) {
        updatedData.item_code = `ITM ${Math.floor(
          1000 + Math.random() * 9000
        )}`;
      }

      if (fieldName === "barcode" && !updatedData.barcode) {
        updatedData.barcode = `BAR ${Math.floor(1000 + Math.random() * 9000)}`;
      }

      if (
        fieldName === "opening_stock_quantity" ||
        fieldName === "buying_cost"
      ) {
        const openingStockValue =
          (parseFloat(updatedData.opening_stock_quantity) || 0) *
          (parseFloat(updatedData.buying_cost) || 0);
        updatedData.opening_stock_value = openingStockValue.toFixed(2);
      }

      return updatedData;
    });
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = document.querySelector(`[name="${nextField}"]`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 w-full max-w-screen-xl mx-auto p-6 rounded-lg shadow-lg overflow-y-auto h-[90vh]"
      >
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {initialData ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-600 dark:text-red-700 hover:text-gray-900 focus:outline-none"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Product Name <span className="item-form-required">*</span>
            </label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "item_code")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter product name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Item Code <span className="item-form-required">*</span>
            </label>
            <input
              type="text"
              name="item_code"
              value={formData.item_code}
              onChange={handleChange}
              onBlur={() => handleBlur("item_code")}
              onKeyDown={(e) => handleKeyDown(e, "batch_number")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter item code"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Batch Number *
            </label>
            <input
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "expiry_date")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter batch number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "buying_cost")}
              className="block w-full mt-1 rounded-md item-form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Buying Cost
            </label>
            <input
              type="number"
              name="buying_cost"
              value={formData.buying_cost}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "sales_price")}
              onBlur={() => handleBlur("buying_cost")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter buying cost"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Sales Price *
            </label>
            <input
              type="number"
              name="sales_price"
              value={formData.sales_price}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "wholesale_price")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter sales price"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Wholesale Price
            </label>
            <input
              type="number"
              name="wholesale_price"
              value={formData.wholesale_price}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "minimum_price")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter wholesale price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Minimum Price
            </label>
            <input
              type="number"
              name="minimum_price"
              value={formData.minimum_price}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "barcode")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter minimum price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Barcode <span className="item-form-required">*</span>
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              onBlur={() => handleBlur("barcode")}
              onKeyDown={(e) => handleKeyDown(e, "mrp")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter barcode"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              MRP *
            </label>
            <input
              type="number"
              name="mrp"
              value={formData.mrp}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "minimum_stock_quantity")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter MRP"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Minimum Stock Quantity
            </label>
            <input
              type="number"
              name="minimum_stock_quantity"
              value={formData.minimum_stock_quantity}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "opening_stock_quantity")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter minimum stock quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Opening Stock Quantity
            </label>
            <input
              type="number"
              name="opening_stock_quantity"
              value={formData.opening_stock_quantity}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "opening_stock_value")}
              onBlur={() => handleBlur("opening_stock_quantity")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter opening stock quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Opening Stock Value
            </label>
            <input
              type="number"
              name="opening_stock_value"
              value={formData.opening_stock_value}
              onKeyDown={(e) => handleKeyDown(e, "category")}
              readOnly
              className="block w-full mt-1 bg-gray-100 rounded-md item-form-input"
              placeholder="Calculated automatically"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "supplier")}
              className="block w-full mt-1 rounded-md item-form-input"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Supplier
            </label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "unit_type")}
              className="block w-full mt-1 rounded-md item-form-input"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.supplier_name}>
                  {supplier.supplier_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Unit Type
            </label>
            <select
              name="unit_type"
              value={formData.unit_type}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "store_location")}
              className="block w-full mt-1 rounded-md item-form-input"
            >
              <option value="">Select Unit Type</option>
              {unitTypes.map((unit) => (
                <option key={unit.id} value={unit.unit_name}>
                  {unit.unit_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Store Location
            </label>
            <select
              name="store_location"
              value={formData.store_location}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "cabinet")}
              className="block w-full mt-1 rounded-md item-form-input"
            >
              <option value="">Select Store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.store_name}>
                  {store.store_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Cabinet
            </label>
            <input
              type="text"
              name="cabinet"
              value={formData.cabinet}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "row")}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter cabinet number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Row
            </label>
            <input
              type="text"
              name="row"
              value={formData.row}
              onChange={handleChange}
              className="block w-full mt-1 rounded-md item-form-input"
              placeholder="Enter row number"
            />
          </div>
        </div>

        {formData.extra_fields?.map((field, index) => (
          <div key={index} className="mb-4">
            <div className="flex items-center pt-10 mb-2 space-x-2">
              <label className="block text-sm font-medium text-gray-800 dark:text-white">
                Extra Field Name:
              </label>
              <input
                type="text"
                name="name"
                value={field.name}
                onChange={(e) => handleExtraFieldChange(index, e)}
                className="block w-full mt-1 rounded-md item-form-input"
                placeholder={`Enter name for Extra Field ${index + 1}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-white">
                Extra Field Value:
              </label>
              <input
                type="text"
                name="value"
                value={field.value}
                onChange={(e) => handleExtraFieldChange(index, e)}
                className="block w-full mt-1 rounded-md item-form-input"
                placeholder={`Enter value for Extra Field ${index + 1}`}
              />
            </div>
            <button
              type="button"
              onClick={() => removeExtraField(index)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex justify-end mt-6 space-x-4">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            type="button"
            onClick={addExtraField}
          >
            Add Extra Field
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md dark:text-gray-300 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
