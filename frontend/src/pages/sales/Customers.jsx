import { useState, useEffect } from "react";
import { getData, postData, putData, deleteData } from "../../services/api"; // Using your API functions
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash, Eye, Upload } from "lucide-react";
import Dialog from "@/components/ui/dialog";

const API_URL = "/customers"; // Use relative URL for API

const CustomerManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [form, setForm] = useState({ customer_name: "", email: "", phone: "", photo: null });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch customers from API
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await getData(API_URL); // Use getData to fetch customers
            setCustomers(response.data); // Assuming the response contains a `data` field with customer data
        } catch (err) {
            console.error("Error fetching customers:", err);
            setError("Error fetching customers");
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, photo: file });
        }
    };

    const handleAddOrUpdateCustomer = async () => {
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("customer_name", form.customer_name);
        formData.append("email", form.email);
        formData.append("phone", form.phone);
        if (form.photo instanceof File) {
            formData.append("photo", form.photo);
        }

        try {
            let response;
            if (editingCustomer) {
                response = await putData(`${API_URL}/${editingCustomer.id}`, formData); // Use putData for update
            } else {
                response = await postData(API_URL, formData); // Use postData for adding new customer
            }
            fetchCustomers();
            setForm({ customer_name: "", email: "", phone: "", photo: null });
            setEditingCustomer(null);
        } catch (err) {
            if (err.response && err.response.status === 422) {
                // Log validation errors
                console.error("Validation errors:", err.response.data.errors);
                setError("Validation error: " + JSON.stringify(err.response.data.errors));
            } else {
                setError("Failed to save customer.");
                console.error("Error:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditCustomer = (customer) => {
        setForm({
            customer_name: customer.customer_name,
            email: customer.email,
            phone: customer.phone,
            photo: customer.photo, // Existing image URL
        });
        setEditingCustomer(customer);
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer?")) return;

        try {
            await deleteData(`${API_URL}/${id}`); // Use deleteData for deleting customer
            fetchCustomers();
        } catch (err) {
            console.error("Error deleting customer:", err);
            setError("Error deleting customer");
        }
    };

    return (
        <div className="p-6 bg-transparent min-h-screen">
            <h2 className="text-2xl font-bold text-blue-600 mb-6">Customer Management</h2>

            {/* Customer Form */}
            <Card className="p-6 shadow-lg rounded-lg bg-white">
                <h3 className="text-lg font-semibold mb-4">{editingCustomer ? "Edit Customer" : "Add Customer"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        name="customer_name"
                        value={form.customer_name}
                        onChange={handleChange}
                        placeholder="Name"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <Input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <Input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Phone"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-col items-center gap-2">
                        <label className="cursor-pointer flex items-center gap-2 border p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Upload className="w-5 h-5 text-blue-600" /> Upload Photo
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                        {form.photo && (typeof form.photo === "string" ? (
                            <img src={`http://127.0.0.1:8000/storage/${form.photo}`} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                        ) : (
                            <img src={URL.createObjectURL(form.photo)} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                        ))}

                    </div>
                </div>
                <Button
                    className="mt-4 bg-purple-700 hover:bg-purple-800 text-white w-full md:w-auto"
                    onClick={handleAddOrUpdateCustomer}
                    disabled={loading}
                >
                    {loading ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
                </Button>
                {error && <p className="text-red-600 mt-2">{error}</p>}
            </Card>

            {/* Customers Table */}
            <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
                    <thead className="bg-blue-600 text-white">
                        <tr>
                            <th className="p-3 font-semibold">Name</th>
                            <th className="p-3 font-semibold">Email</th>
                            <th className="p-3 font-semibold">Phone</th>
                            <th className="p-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-100 transition-colors">
                                <td className="p-3 border text-center">{customer.customer_name}</td>
                                <td className="p-3 border text-center">{customer.email}</td>
                                <td className="p-3 border text-center">{customer.phone}</td>
                                <td className="p-3 border text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setSelectedCustomer(customer)}
                                            className="hover:bg-blue-100 p-2 rounded-full"
                                        >
                                            <Eye className="w-5 h-5 text-cyan-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleEditCustomer(customer)}
                                            className="hover:bg-green-100 p-2 rounded-full"
                                        >
                                            <Pencil className="w-5 h-5 text-emerald-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDeleteCustomer(customer.id)}
                                            className="hover:bg-red-100 p-2 rounded-full"
                                        >
                                            <Trash className="w-5 h-5 text-red-500" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <Dialog isOpen={Boolean(selectedCustomer)} onClose={() => setSelectedCustomer(null)}>
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="p-6 bg-white border rounded-lg shadow-lg w-96">
                            <h3 className="text-lg font-semibold mb-4">{selectedCustomer.customer_name}</h3>
                            <p className="text-gray-700">Email: {selectedCustomer.email}</p>
                            <p className="text-gray-700">Phone: {selectedCustomer.phone}</p>
                            {selectedCustomer.photo && (
                                <img
                                    src={`http://127.0.0.1:8000/storage/${selectedCustomer.photo}`}
                                    alt="Customer"
                                    className="mt-4 rounded-lg w-full h-48 object-cover"
                                />
                            )}
                            <Button
                                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => setSelectedCustomer(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
};

export default CustomerManagement;
