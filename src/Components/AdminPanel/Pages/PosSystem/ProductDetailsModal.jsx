// src/components/ProductDetailsModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import Select from "react-select";

// Import the new calculator component
import ProductPriceCalculator from "./ProductPriceCalculator";

// Make sure to set app element for react-modal
Modal.setAppElement("#root");

export default function ProductDetailsModal({
  isOpen,
  onRequestClose,
  product, // The product object clicked from POSLeftPanel
  onAddItemToOrder, // Callback to add item to POSDashboard's selectedItems
}) {
  if (!product) {
    return null;
  }

  // State for inputs
  const [quantity, setQuantity] = useState(1);
  const [widthFeet, setWidthFeet] = useState(0);
  const [widthInches, setWidthInches] = useState(0);
  const [heightFeet, setHeightFeet] = useState(0);
  const [heightInches, setHeightInches] = useState(0);

  // State for Dynamic Variant Selection
  const [selectedVariationItems, setSelectedVariationItems] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  // State for calculator results (set by ProductPriceCalculator via props)
  const [totalAreaSqFt, setTotalAreaSqFt] = useState(0);
  const [calculatedBasePrice, setCalculatedBasePrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercentageApplied, setDiscountPercentageApplied] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  // Reset state when modal opens for a new product
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setWidthFeet(0);
      setWidthInches(0);
      setHeightFeet(0);
      setHeightInches(0);
      setTotalAreaSqFt(0);
      setCalculatedBasePrice(0);
      setDiscountAmount(0);
      setDiscountPercentageApplied(0);
      setFinalPrice(0);
      setSelectedVariationItems({}); // Reset variant selections
      setSelectedVariant(null); // Reset selected variant
    }
  }, [isOpen, product]);

  // Handle selection of a variation item
  const handleVariationItemSelect = useCallback((variationName, itemValue) => {
    setSelectedVariationItems((prev) => ({
      ...prev,
      [variationName]: itemValue,
    }));
  }, []);

  // Effect to find the matching variant whenever selectedVariationItems changes
  useEffect(() => {
    if (!product.variants || product.variants.length === 0) {
      setSelectedVariant(null);
      return;
    }

    const matched = product.variants.find((variant) => {
      const allSelectionsMatch = Object.keys(selectedVariationItems).every(
        (selectedVarName) => {
          const selectedVal = selectedVariationItems[selectedVarName];
          return variant.variantDetails.some(
            (detail) =>
              detail.variationItem?.variation?.name === selectedVarName &&
              detail.variationItem?.value === selectedVal
          );
        }
      );

      const allRequiredVariationsSelected =
        product.variations &&
        Object.keys(selectedVariationItems).length ===
          product.variations.length &&
        Object.values(selectedVariationItems).every((val) => val !== null); // Ensure no null selections

      return allSelectionsMatch && allRequiredVariationsSelected;
    });

    setSelectedVariant(matched);
  }, [selectedVariationItems, product.variants, product.variations]);

  // This check determines if all variations have been selected to enable inputs/add to order
  const isAllVariationsSelected =
    product.variations && product.variations.length > 0
      ? selectedVariant !== null
      : true; // If no variations, it's always true

  const handleAddProductToOrder = () => {
    // Disable Add to Order button if variations exist but no variant is selected
    if (
      product.variations &&
      product.variations.length > 0 &&
      !selectedVariant
    ) {
      Swal.fire(
        "Validation Error",
        "Please select all variation options to create a specific variant.",
        "warning"
      );
      return;
    }

    if (
      product.pricingType === "square-feet" &&
      (totalAreaSqFt <= 0 ||
        (Number(widthFeet) === 0 && Number(widthInches) === 0) ||
        (Number(heightFeet) === 0 && Number(heightInches) === 0))
    ) {
      Swal.fire(
        "Validation Error",
        "Please enter valid dimensions for square-feet product.",
        "warning"
      );
      return;
    }
    if (quantity <= 0) {
      Swal.fire("Validation Error", "Quantity must be at least 1.", "warning");
      return;
    }

    let unitPriceForOrderSummary;
    if (product.pricingType === "square-feet") {
      // customUnitPrice for square-feet products should be the effective price per sqft (base + variant additional)
      unitPriceForOrderSummary =
        Number(product.basePrice || 0) +
        (selectedVariant ? Number(selectedVariant.additionalPrice || 0) : 0);
    } else {
      // customUnitPrice for flat products is the final price divided by quantity
      unitPriceForOrderSummary = finalPrice / quantity;
    }

    const formattedVariantDetails = selectedVariant
      ? selectedVariant.variantDetails.map((detail) => ({
          variationName: detail.variationItem?.variation?.name,
          variationItemValue: detail.variationItem?.value,
        }))
      : null;

    const itemToAdd = {
      ...product,
      quantity: quantity,
      customUnitPrice: unitPriceForOrderSummary, // This is the effective unit price including variant price
      pricingType: product.pricingType,
      widthInch:
        product.pricingType === "square-feet"
          ? Number(widthFeet) * 12 + Number(widthInches)
          : null,
      heightInch:
        product.pricingType === "square-feet"
          ? Number(heightFeet) * 12 + Number(heightInches)
          : null,
      productVariantId: selectedVariant?.productVariantId || null,
      selectedVariantDetails: formattedVariantDetails,
      availableVariants: product.variants || [],
      calculatedItemTotal: finalPrice, // This is the total price for this single line item (after all discounts)
      // *** ADD THESE TWO LINES ***
      calculatedBasePrice: calculatedBasePrice, // Price of this line item BEFORE applying the item-level quantity discount
      discountAmount: discountAmount, // The specific discount amount applied to this line item
    };
    onAddItemToOrder(itemToAdd);
    onRequestClose();
  };

  const getImageUrl = (prod) => {
    if (!prod.images || prod.images.length === 0) return "/placeholder.png";
    const imgName = prod.images[0].imageName;
    if (!imgName || typeof imgName !== "string") return "/placeholder.png";
    return `https://test.api.dpmsign.com/static/product-images/${imgName}`;
  };

  const getAvailableVariationItems = useCallback(
    (currentVariation) => {
      if (!product.variants || product.variants.length === 0) {
        return [];
      }

      const possibleItems = new Set();
      product.variants.forEach((variant) => {
        const matchesPreviousSelections = Object.keys(
          selectedVariationItems
        ).every((selectedVarName) => {
          if (selectedVarName === currentVariation.name) return true;

          const selectedVal = selectedVariationItems[selectedVarName];
          return variant.variantDetails.some(
            (detail) =>
              detail.variationItem?.variation?.name === selectedVarName &&
              detail.variationItem?.value === selectedVal
          );
        });

        if (matchesPreviousSelections) {
          const itemForCurrentVariation = variant.variantDetails.find(
            (detail) =>
              detail.variationItem?.variation?.name === currentVariation.name
          );
          if (itemForCurrentVariation) {
            possibleItems.add(itemForCurrentVariation.variationItem?.value);
          }
        }
      });

      const allItemsForThisVariation = currentVariation.variationItems.map(
        (item) => item.value
      );

      const filteredAndSortedItems = Array.from(possibleItems)
        .filter((value) => allItemsForThisVariation.includes(value))
        .sort();

      return filteredAndSortedItems.map((value) => ({ value, label: value }));
    },
    [product.variants, selectedVariationItems, product.variations]
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="fixed inset-0 flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onRequestClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 border-b pb-2">
          {product.name} Details
        </h2>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="md:w-1/3">
            <img
              src={getImageUrl(product)}
              alt={product.name}
              className="w-full h-48 object-contain rounded-md border"
              onError={(e) => (e.target.src = "/placeholder.png")}
            />
            <p className="text-gray-600 mt-2 text-sm">
              SKU: {product.sku || "N/A"}
            </p>
          </div>
          <div className="md:w-2/3">
            <p className="text-gray-700 mb-3">{product.description}</p>
            <p className="font-semibold text-lg mb-2">
              Base Price: {Number(product.basePrice || 0).toFixed(2)} Tk{" "}
              {product.pricingType === "square-feet" ? "Per Sq. Ft." : ""}
            </p>
            {Number(product.maxDiscountPercentage) > 0 && ( // Use maxDiscountPercentage
              <p className="text-sm text-green-600">
                Discount available:{" "}
                {Number(product.maxDiscountPercentage || 0).toFixed(2)}%
                {product.discountStart !== null &&
                  product.discountEnd !== null &&
                  ` for ${
                    product.pricingType === "square-feet" ? "area" : "quantity"
                  } between ${Number(product.discountStart || 0)} and ${Number(
                    product.discountEnd || 0
                  )}`}
              </p>
            )}

            {/* Dynamic Variation Selection */}
            {product.variations && product.variations.length > 0 && (
              <div className="mt-4 p-4 border rounded-md bg-blue-50">
                <h3 className="font-semibold mb-3">Select Product Options:</h3>
                {product.variations.map((variation, index) => (
                  <div key={variation.variationId} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variation.name} ({variation.unit}):
                    </label>
                    <Select
                      options={getAvailableVariationItems(variation)}
                      value={
                        selectedVariationItems[variation.name]
                          ? {
                              value: selectedVariationItems[variation.name],
                              label: selectedVariationItems[variation.name],
                            }
                          : null
                      }
                      onChange={(selectedOption) => {
                        const newSelections = { ...selectedVariationItems };
                        for (
                          let i = index + 1;
                          i < product.variations.length;
                          i++
                        ) {
                          delete newSelections[product.variations[i].name];
                        }
                        setSelectedVariationItems({
                          ...newSelections,
                          [variation.name]: selectedOption
                            ? selectedOption.value
                            : null,
                        });
                      }}
                      isClearable
                      placeholder={`Select ${variation.name}`}
                      isDisabled={
                        index > 0 &&
                        !selectedVariationItems[
                          product.variations[index - 1].name
                        ]
                      }
                    />
                  </div>
                ))}
                {selectedVariant && (
                  <p className="text-sm font-medium text-green-700 mt-2">
                    Selected Variant:{" "}
                    {selectedVariant.variantDetails
                      .map(
                        (d) =>
                          `${d.variationItem?.variation?.name}: ${d.variationItem?.value}`
                      )
                      .join(", ")}{" "}
                    (Additional Price: {selectedVariant.additionalPrice} Tk)
                  </p>
                )}
                {!selectedVariant &&
                  product.variations &&
                  product.variations.length > 0 && (
                    <p className="text-sm text-red-600">
                      Please select all options to determine the final variant
                      price.
                    </p>
                  )}
              </div>
            )}

            {/* Integrate the new ProductPriceCalculator component here */}
            <ProductPriceCalculator
              product={product}
              quantity={quantity}
              setQuantity={setQuantity}
              widthFeet={widthFeet}
              setWidthFeet={setWidthFeet}
              widthInches={widthInches}
              setWidthInches={setWidthInches}
              heightFeet={heightFeet}
              setHeightFeet={setHeightFeet}
              heightInches={heightInches}
              setHeightInches={setHeightInches}
              // Pass setters for calculated values
              totalAreaSqFt={totalAreaSqFt}
              setTotalAreaSqFt={setTotalAreaSqFt}
              calculatedBasePrice={calculatedBasePrice}
              setCalculatedBasePrice={setCalculatedBasePrice}
              discountAmount={discountAmount}
              setDiscountAmount={setDiscountAmount}
              discountPercentageApplied={discountPercentageApplied}
              setDiscountPercentageApplied={setDiscountPercentageApplied}
              finalPrice={finalPrice}
              setFinalPrice={setFinalPrice}
              selectedVariant={selectedVariant}
              hasVariations={
                product.variations && product.variations.length > 0
              } // New prop
              isAllVariationsSelected={isAllVariationsSelected} // New prop
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onRequestClose} className="btn btn-outline">
            Cancel
          </button>
          <button
            onClick={handleAddProductToOrder}
            className="btn btn-primary"
            disabled={
              // Disable if variations exist and not all are selected, or if total area/quantity is invalid for the product type
              !isAllVariationsSelected ||
              (product.pricingType === "square-feet" && totalAreaSqFt <= 0) ||
              quantity <= 0
            }
          >
            Add to Order
          </button>
        </div>
      </div>
    </Modal>
  );
}
