// components/CustomerSelector.jsx
import React, { useEffect, useState } from "react";
import Select from "react-select";
import Modal from "react-modal";
import axios from "axios";
import Swal from "sweetalert2";

export default function CustomerSelector({
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  refreshCustomers,
  triggerModalOpen = false,
}) {
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // ✅ যখন triggerModalOpen true হবে, তখন modal খুলবে
useEffect(() => {
  if (triggerModalOpen) setShowModal(true);
}, [triggerModalOpen]);


  const handleAddCustomer = async () => {
  if (!newName.trim() || !newPhone.trim()) {
    Swal.fire("Warning", "Name and Phone are required", "warning");
    return;
  }
  try {
    const token = localStorage.getItem("authToken");
    const res = await axios.post(
      "https://test.api.dpmsign.com/api/customer/quick-add",
      { name: newName, phone: newPhone },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("Success", "Customer added", "success");
    setShowModal(false);
    setNewName("");
    setNewPhone("");
    refreshCustomers();

    // নতুন customer এর id ধরে সেটি auto select করা
    const newCustomerId = res.data.data.customer.customerId;
    setSelectedCustomerId(newCustomerId);

  } catch (error) {
    console.error("Add customer error:", error);
    Swal.fire("Error", "Failed to add customer", "error");
  }
};


  const customerOptions = [
    ...customers.map((c) => ({
      value: c.customerId,
      label: `${c.name} (${c.phone})`,
    })),
    { value: "__add_new__", label: "➕ Add New Customer" },
  ];

  return (
    <div className="w-full">
      <Select
        options={customerOptions}
        value={
          customerOptions.find((o) => o.value === selectedCustomerId) || null
        }
        onChange={(opt) => {
          if (opt?.value === "__add_new__") setShowModal(true);
          else setSelectedCustomerId(opt?.value || null);
        }}
        isClearable
        placeholder="Select or add a customer..."
      />

      <Modal
  isOpen={showModal}
  onRequestClose={() => setShowModal(false)}
  className="fixed top-1/2 left-1/2 w-full max-w-md p-6 bg-white rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-1/2 outline-none"
  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
>
  <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Add New Customer</h2>
  
  <input
    type="text"
    className="input input-bordered w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Customer Name"
    value={newName}
    onChange={(e) => setNewName(e.target.value)}
  />
  
  <input
    type="text"
    className="input input-bordered w-full mb-6 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Phone Number"
    value={newPhone}
    onChange={(e) => setNewPhone(e.target.value)}
  />
  
  <div className="flex justify-end gap-3">
    <button
      className="btn btn-primary px-6 py-2 rounded-md hover:bg-blue-600 transition"
      onClick={handleAddCustomer}
    >
      Save
    </button>
    
    <button
      className="btn btn-outline px-6 py-2 rounded-md hover:bg-gray-100 transition"
      onClick={() => setShowModal(false)}
    >
      Cancel
    </button>
  </div>
</Modal>

    </div>
  );
}
