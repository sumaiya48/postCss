// components/CustomerSelector.jsx
import React, { useState } from "react";
import Select from "react-select";
import Modal from "react-modal";
import axios from "axios";
import Swal from "sweetalert2";

export default function CustomerSelector({
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  refreshCustomers,
}) {
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleAddCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Swal.fire("Warning", "Name and Phone are required", "warning");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        "https://test.api.dpmsign.com/api/quick-add",
        { name: newName, phone: newPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire("Success", "Customer added", "success");
      setShowModal(false);
      setNewName("");
      setNewPhone("");
      refreshCustomers();
    } catch (error) {
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

      <Modal isOpen={showModal} onRequestClose={() => setShowModal(false)}>
        <h2 className="text-lg font-bold mb-2">Add New Customer</h2>
        <input
          type="text"
          className="input input-bordered w-full mb-2"
          placeholder="Customer Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="text"
          className="input input-bordered w-full mb-4"
          placeholder="Phone Number"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleAddCustomer}>
            Save
          </button>
          <button className="btn" onClick={() => setShowModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
