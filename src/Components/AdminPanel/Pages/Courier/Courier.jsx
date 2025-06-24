import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Courier() {
  const [couriers, setCouriers] = useState([]);
  const [modalType, setModalType] = useState(null); // 'add' or 'edit'
  const [currentCourier, setCurrentCourier] = useState({ name: "", courierId: null });

  const fetchCouriers = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/courier/");
      setCouriers(res.data?.data?.couriers || []);
    } catch (err) {
      console.error("Failed to fetch couriers:", err);
      Swal.fire("Error!", "Failed to fetch couriers", "error");
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  const handleOpenModal = (type, courier = { name: "", courierId: null }) => {
    setModalType(type);
    setCurrentCourier(courier);
    document.getElementById("courier_modal").showModal();
  };

  const handleSave = async () => {
    if (!currentCourier.name.trim()) {
      return Swal.fire("Error!", "Courier name is required", "warning");
    }

    try {
      if (modalType === "add") {
        await axios.post("https://test.api.dpmsign.com/api/courier/add", {
          name: currentCourier.name,
        });
        Swal.fire("Success!", "Courier added successfully", "success");
      } else {
        await axios.put("https://test.api.dpmsign.com/api/courier/", {
          courierId: currentCourier.courierId,
          name: currentCourier.name,
        });
        Swal.fire("Success!", "Courier updated successfully", "success");
      }

      fetchCouriers();
      document.getElementById("courier_modal").close();
    } catch (err) {
      console.error("Failed to save courier:", err);
      Swal.fire("Error!", err?.response?.data?.message || "Operation failed", "error");
    }
  };

 const handleDelete = async (courierId) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (confirm.isConfirmed) {
    try {
      await axios.delete(
        `https://test.api.dpmsign.com/api/courier/${courierId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      Swal.fire("Deleted!", "Courier deleted successfully", "success");
      fetchCouriers(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete courier:", err);
      Swal.fire(
        "Error!",
        err?.response?.data?.message || "Failed to delete courier",
        "error"
      );
    }
  }
};


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Courier List</h2>
        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal("add")}
        >
          Add Courier
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200">
            <tr>
              <th>#</th>
              <th>Courier Name</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map((courier, index) => (
              <tr key={courier.courierId}>
                <td>{index + 1}</td>
                <td>{courier.name}</td>
                <td className="text-right">
                  <button
                    className="btn btn-sm btn-warning mr-2"
                    onClick={() => handleOpenModal("edit", courier)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => handleDelete(courier.courierId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {couriers.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-400">
                  No couriers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <dialog id="courier_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            {modalType === "add" ? "Add Courier" : "Edit Courier"}
          </h3>
          <input
            type="text"
            placeholder="Courier Name"
            className="input input-bordered w-full mb-4"
            value={currentCourier.name}
            onChange={(e) =>
              setCurrentCourier({ ...currentCourier, name: e.target.value })
            }
          />
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost mr-2">Cancel</button>
            </form>
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
