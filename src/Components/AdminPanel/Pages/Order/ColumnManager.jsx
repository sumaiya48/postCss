import React, { useState, useEffect } from "react";
import { FaTimes, FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function ColumnManager({
  allColumns,
  visibleColumns,
  setVisibleColumns,
  onClose,
}) {
  const [tempVisibleColumns, setTempVisibleColumns] = useState(
    visibleColumns.map((col) => col.id)
  );
  const [availableColumns, setAvailableColumns] = useState([]);

  useEffect(() => {
    // Initialize available columns by filtering out those already visible
    const currentAvailable = allColumns.filter(
      (col) => !tempVisibleColumns.includes(col.id)
    );
    setAvailableColumns(currentAvailable);
  }, [allColumns, tempVisibleColumns]);

  const handleToggleColumn = (columnId) => {
    setTempVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const handleMoveColumn = (columnId, direction) => {
    setTempVisibleColumns((prev) => {
      const newOrder = [...prev];
      const index = newOrder.indexOf(columnId);

      if (direction === "up" && index > 0) {
        [newOrder[index - 1], newOrder[index]] = [
          newOrder[index],
          newOrder[index - 1],
        ];
      } else if (direction === "down" && index < newOrder.length - 1) {
        [newOrder[index + 1], newOrder[index]] = [
          newOrder[index],
          newOrder[index + 1],
        ];
      }
      return newOrder;
    });
  };

  const handleSave = () => {
    // Map the tempVisibleColumns IDs back to the full column objects, maintaining order
    const newVisibleColumns = tempVisibleColumns
      .map((id) => allColumns.find((col) => col.id === id))
      .filter(Boolean); // Filter out any undefined if an ID somehow doesn't match

    setVisibleColumns(newVisibleColumns);
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl bg-white p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            Manage Table Columns
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:text-gray-800"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visible Columns List */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              Visible Columns ({tempVisibleColumns.length})
            </h4>
            <div className="bg-gray-100 p-3 rounded-md border border-gray-200 min-h-[150px] max-h-[300px] overflow-y-auto">
              {tempVisibleColumns.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No columns selected. Select from 'Available Columns'.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tempVisibleColumns.map((colId) => {
                    const col = allColumns.find((c) => c.id === colId);
                    if (!col) return null; // Should not happen if logic is correct
                    return (
                      <li
                        key={col.id}
                        className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm text-sm text-gray-700 border border-gray-200"
                      >
                        <span>{col.label}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveColumn(col.id, "up")}
                            className="btn btn-xs btn-ghost text-blue-500 hover:bg-blue-100"
                            title="Move Up"
                            disabled={tempVisibleColumns.indexOf(col.id) === 0}
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            onClick={() => handleMoveColumn(col.id, "down")}
                            className="btn btn-xs btn-ghost text-blue-500 hover:bg-blue-100"
                            title="Move Down"
                            disabled={
                              tempVisibleColumns.indexOf(col.id) ===
                              tempVisibleColumns.length - 1
                            }
                          >
                            <FaArrowDown />
                          </button>
                          <button
                            onClick={() => handleToggleColumn(col.id)}
                            className="btn btn-xs btn-ghost text-red-500 hover:bg-red-100"
                            title="Remove"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Available Columns List */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              Available Columns ({availableColumns.length})
            </h4>
            <div className="bg-gray-100 p-3 rounded-md border border-gray-200 min-h-[150px] max-h-[300px] overflow-y-auto">
              {availableColumns.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  All columns are currently visible.
                </p>
              ) : (
                <ul className="space-y-2">
                  {availableColumns.map((col) => (
                    <li
                      key={col.id}
                      className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm text-sm text-gray-700 border border-gray-200"
                    >
                      <span>{col.label}</span>
                      <button
                        onClick={() => handleToggleColumn(col.id)}
                        className="btn btn-xs btn-success text-white hover:bg-green-600"
                        title="Add to Visible"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="modal-action mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost rounded-md">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary rounded-md">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
