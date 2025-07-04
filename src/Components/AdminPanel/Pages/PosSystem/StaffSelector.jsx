// src/components/StaffSelector.jsx
import React from "react";

/**
 * StaffSelector Component
 *
 * A reusable component for selecting a staff member from a dropdown list.
 * It displays the name of the currently selected staff.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.staffs - An array of staff objects, each with at least `staffId` (number) and `name` (string) properties.
 * @param {number | null} props.selectedStaffId - The ID of the currently selected staff member, or null if none is selected.
 * @param {function(number | null): void} props.setSelectedStaffId - A function to update the selected staff ID.
 */
export default function StaffSelector({
  staffs,
  selectedStaffId,
  setSelectedStaffId,
}) {
  // Find the selected staff object to display their name
  const selectedStaff = staffs.find(
    (staff) => staff.staffId === Number(selectedStaffId)
  );

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <label
        htmlFor="staffSelect"
        className="block text-sm font-semibold text-gray-800 mb-2"
      >
        Select Staff:
      </label>
      <div className="relative">
        <select
          id="staffSelect"
          className="block w-full px-4 py-2 pr-8 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition duration-150 ease-in-out"
          value={selectedStaffId || ""} // Use empty string for no selection
          onChange={(e) => {
            const value = e.target.value;
            // Convert to number, or null if the "Select Staff" option is chosen
            setSelectedStaffId(value ? Number(value) : null);
          }}
        >
          <option value="" disabled>
            -- Select Staff --
          </option>
          {staffs.map((staff) => (
            <option key={staff.staffId} value={staff.staffId}>
              {staff.name}
            </option>
          ))}
        </select>
        {/* Custom arrow for select dropdown */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {selectedStaff && (
        <p className="mt-3 text-sm text-gray-600 font-medium">
          Currently Selected Staff:{" "}
          <span className="text-blue-700">{selectedStaff.name}  ({selectedStaff.phone})</span>
        </p>
      )}
      {!selectedStaffId && (
        <p className="mt-3 text-sm text-red-500">
          Please select a staff member to proceed.
        </p>
      )}
    </div>
  );
}
