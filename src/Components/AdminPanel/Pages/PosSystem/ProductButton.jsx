// components/ProductButton.jsx
import React from "react";

const ProductButton = ({ name, price, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full h-28 flex flex-col justify-center items-center border rounded-lg shadow hover:bg-violet-100 transition-all"
    >
      <div className="text-lg font-semibold text-center">{name}</div>
      <div className="text-gray-500 text-sm">${price?.toFixed(2)}</div>
    </button>
  );
};

export default ProductButton;
