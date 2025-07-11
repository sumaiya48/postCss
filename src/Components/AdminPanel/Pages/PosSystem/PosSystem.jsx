// POSDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import POSLeftPanel from "./PosLeftPanel";
import OrderSummary from "./OrderSummary";
import CustomerSelector from "./CustomerSelector";
import CouponInput from "./CouponInput";
import OrderTotals from "./OrderTotals"; // Make sure this import is correct
import InvoiceGenerator from "./InvoiceGenerator";
import StaffSelector from "./StaffSelector";
import ProductDetailsModal from "./ProductDetailsModal";

export default function POSDashboard() {
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ categoryId: null });
  const [selectedItems, setSelectedItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [staffs, setStaffs] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  // const [couponCode, setCouponCode] = useState("");
  // const [couponDiscount, setCouponDiscount] = useState(0);
  // const [couponError, setCouponError] = useState("");
  // const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("cod-payment");
  const [deliveryMethod, setDeliveryMethod] = useState("shop-pickup");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  const [selectedCourierId, setSelectedCourierId] = useState(null);
  const [courierAddressInput, setCourierAddressInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  const [nextOrderId, setNextOrderId] = useState(null);
  const [triggerInvoiceGenerate, setTriggerInvoiceGenerate] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // NEW STATE FOR PRODUCT DETAILS MODAL
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  const selectedCustomer = customers.find(
    (c) => c.customerId === Number(selectedCustomerId)
  );
  const selectedStaff = staffs.find(
    (s) => s.staffId === Number(selectedStaffId)
  );

  let userData = null;
  try {
    const raw = localStorage.getItem("userData");
    if (raw && raw !== "undefined") {
      userData = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Invalid userData in localStorage:", e);
    localStorage.removeItem("userData");
  }

  const isAdmin = userData?.role === "admin";

  const fetchStaffs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get("https://test.api.dpmsign.com/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data && res.data.data && Array.isArray(res.data.data.staff)) {
        setStaffs(res.data.data.staff);
      } else {
        console.warn("Staffs data is not an array or missing:", res.data);
        setStaffs([]);
      }
    } catch (err) {
      console.error(
        "Failed to fetch staffs:",
        err.response?.data || err.message
      );
      Swal.fire("Error", "Failed to load staff list.", "error");
    }
  };

  const handleUnselectCustomer = () => {
    setSelectedCustomerId(null);
  };

  const [openCustomerModal, setOpenCustomerModal] = useState(false);

  const handleOpenCustomerModal = () => {
    setOpenCustomerModal(false);
    setTimeout(() => {
      setOpenCustomerModal(true);
    }, 50);
  };

  // MODIFIED: calculateItemTotal will use the 'calculatedItemTotal' passed from the modal
  // or re-calculate based on customUnitPrice and new quantity/dimensions if changed in OrderSummary
  const calculateItemTotal = useCallback((item) => {
    // This function is generally used for displaying the *final* total of an item line
    // when quantities/dimensions are changed in the OrderSummary.
    // However, the initial `calculatedItemTotal` from the modal already includes the discount.
    // For clarity in OrderSummary, we'll primarily use `item.calculatedBasePrice`, `item.discountAmount`, and `item.calculatedItemTotal`.
    // This function's role might change slightly if manual price adjustments in OrderSummary are allowed and need discount recalculation.

    // If you need to re-calculate from scratch in summary (e.g. for manual customUnitPrice edits):
    // const pricePerUnitOrSqFt = Number(item.customUnitPrice || item.basePrice || 0);
    // const quantity = Number(item.quantity || 0);
    // if (item.pricingType === "square-feet" && item.widthInch && item.heightInch) {
    //   const area = (item.widthInch / 12) * (item.heightInch / 12);
    //   return pricePerUnitOrSqFt * quantity * area;
    // }
    // return pricePerUnitOrSqFt * quantity;

    // For now, let's just use the final calculated total directly for sum calculations
    return Number(item.calculatedItemTotal || 0);
  }, []);

  // *** NEW: Calculate total before item discounts and total item discounts ***
  const totalBeforeItemDiscounts = selectedItems.reduce(
    (sum, item) => sum + Number(item.calculatedBasePrice || 0),
    0
  );

  const totalItemDiscounts = selectedItems.reduce(
    (sum, item) => sum + Number(item.discountAmount || 0),
    0
  );
  // *** END NEW CALCULATIONS ***

  // Subtotal is now the sum of *final* item totals (after item-level discounts)
  const subTotal = selectedItems.reduce(
    (sum, item) => sum + Number(item.calculatedItemTotal || 0),
    0
  );

  const couponDiscount = 0; // Still hardcoded to 0 as per your current setup

  const grossTotal = Math.max(subTotal - couponDiscount, 0); // Gross total after all discounts

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/product", {
        params: {
          categoryId: filters.categoryId,
        },
      });

      const activeProducts = res.data.data.products.filter(
        (product) => product.isActive === true
      );
      setProducts(activeProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Swal.fire("Error", "Failed to load products.", "error");
    }
  };

  const fetchCategories = async () => {
    const res = await axios.get(
      "https://test.api.dpmsign.com/api/product-category"
    );
    setCategories(res.data.data.categories);
  };

  const fetchCustomers = async () => {
    const token = localStorage.getItem("authToken");
    const res = await axios.get("https://test.api.dpmsign.com/api/customer", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCustomers(res.data.data.customers);
  };

  const fetchNextOrderId = async () => {
    const token = localStorage.getItem("authToken");
    const res = await axios.get("https://test.api.dpmsign.com/api/order", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const maxId = Math.max(...res.data.data.orders.map((o) => o.orderId), 0);
    setNextOrderId(maxId + 1);
  };

  const updateItemField = (productId, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updatedItem = { ...item, [field]: value };

          // When any relevant field changes in OrderSummary, recalculate.
          // This part needs careful thought if you want to re-apply discounts
          // when quantity/dimensions are changed AFTER item is added.
          // For simplicity, we'll just recalculate `customUnitPrice * quantity/area` here.
          // If you need dynamic discount recalculation here, it's a more complex logic to add.
          if (
            field === "quantity" ||
            field === "widthInch" ||
            field === "heightInch" ||
            field === "customUnitPrice"
          ) {
            // Recalculate based on updated quantity/dimensions and current effective unit price (customUnitPrice)
            const pricePerUnitOrSqFt = Number(
              updatedItem.customUnitPrice || updatedItem.basePrice || 0
            );
            let itemBaseTotalBeforeDiscount = 0;
            if (
              updatedItem.pricingType === "square-feet" &&
              updatedItem.widthInch &&
              updatedItem.heightInch
            ) {
              const area =
                (updatedItem.widthInch / 12) * (updatedItem.heightInch / 12);
              itemBaseTotalBeforeDiscount =
                pricePerUnitOrSqFt * updatedItem.quantity * area;
            } else {
              itemBaseTotalBeforeDiscount =
                pricePerUnitOrSqFt * updatedItem.quantity;
            }

            // *** IMPORTANT: Reapplying the discount logic for OrderSummary changes ***
            // This logic duplicates what's in ProductPriceCalculator.jsx for consistency.
            const discountStart = Number(updatedItem.discountStart || 0);
            const discountEnd = Number(updatedItem.discountEnd || 0);
            const maxDiscountPercentage = Number(
              updatedItem.maxDiscountPercentage || 0
            );
            let currentAreaOrQuantity =
              updatedItem.pricingType === "square-feet"
                ? (Number(updatedItem.widthInch) *
                    Number(updatedItem.heightInch)) /
                  144
                : Number(updatedItem.quantity);

            let actualDiscountPercentage = 0;
            if (currentAreaOrQuantity >= discountStart) {
              if (currentAreaOrQuantity <= discountEnd) {
                if (discountEnd > discountStart) {
                  actualDiscountPercentage =
                    (maxDiscountPercentage *
                      (currentAreaOrQuantity - discountStart)) /
                    (discountEnd - discountStart);
                } else {
                  actualDiscountPercentage = maxDiscountPercentage;
                }
              } else {
                actualDiscountPercentage = maxDiscountPercentage;
              }
            } else {
              actualDiscountPercentage = 0;
            }
            const itemDiscountAmount =
              (itemBaseTotalBeforeDiscount * actualDiscountPercentage) / 100;
            const itemFinalPrice =
              itemBaseTotalBeforeDiscount - itemDiscountAmount;

            updatedItem.calculatedBasePrice = itemBaseTotalBeforeDiscount;
            updatedItem.discountAmount = itemDiscountAmount;
            updatedItem.calculatedItemTotal = itemFinalPrice;
            // *** END Reapplying discount logic ***
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const incrementQuantity = (productId) =>
    updateItemField(
      productId,
      "quantity",
      selectedItems.find((i) => i.productId === productId).quantity + 1
    );
  const decrementQuantity = (productId) =>
    updateItemField(
      productId,
      "quantity",
      Math.max(
        1,
        selectedItems.find((i) => i.productId === productId).quantity - 1
      )
    );
  const removeProduct = (productId) =>
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));

  const handleVariantChange = (productId, selectedOption) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const selected = item.availableVariants?.find(
          (v) => v.productVariantId === selectedOption?.value
        );
        // When variant changes, update additional price and customUnitPrice
        const newCustomUnitPrice =
          Number(
            item.basePrice || 0 // Start with base price
          ) + Number(selected?.additionalPrice ?? 0); // Add variant's additional price

        const updatedItem = {
          ...item,
          productVariantId: selectedOption?.value || null,
          selectedVariantDetails:
            selected?.variantDetails.map((detail) => ({
              variationName: detail.variationItem?.variation?.name,
              variationItemValue: detail.variationItem?.value,
            })) || null, // Update variant details
          customUnitPrice: newCustomUnitPrice,
          // When variant changes, base price for calculation changes, so re-evaluate all.
          // This is a simplified re-evaluation; a full re-calculation including discount
          // should ideally be encapsulated or trigger the modal again.
          // For simplicity, we are recalculating calculatedBasePrice, discountAmount, and calculatedItemTotal here.
        };

        // Reapplying the discount logic for variant changes
        const pricePerUnitOrSqFt = newCustomUnitPrice;
        let itemBaseTotalBeforeDiscount = 0;
        if (
          updatedItem.pricingType === "square-feet" &&
          updatedItem.widthInch &&
          updatedItem.heightInch
        ) {
          const area =
            (updatedItem.widthInch / 12) * (updatedItem.heightInch / 12);
          itemBaseTotalBeforeDiscount =
            pricePerUnitOrSqFt * updatedItem.quantity * area;
        } else {
          itemBaseTotalBeforeDiscount =
            pricePerUnitOrSqFt * updatedItem.quantity;
        }

        const discountStart = Number(updatedItem.discountStart || 0);
        const discountEnd = Number(updatedItem.discountEnd || 0);
        const maxDiscountPercentage = Number(
          updatedItem.maxDiscountPercentage || 0
        );
        let currentAreaOrQuantity =
          updatedItem.pricingType === "square-feet"
            ? (Number(updatedItem.widthInch) * Number(updatedItem.heightInch)) /
              144
            : Number(updatedItem.quantity);

        let actualDiscountPercentage = 0;
        if (currentAreaOrQuantity >= discountStart) {
          if (currentAreaOrQuantity <= discountEnd) {
            if (discountEnd > discountStart) {
              actualDiscountPercentage =
                (maxDiscountPercentage *
                  (currentAreaOrQuantity - discountStart)) /
                (discountEnd - discountStart);
            } else {
              actualDiscountPercentage = maxDiscountPercentage;
            }
          } else {
            actualDiscountPercentage = maxDiscountPercentage;
          }
        } else {
          actualDiscountPercentage = 0;
        }
        const itemDiscountAmount =
          (itemBaseTotalBeforeDiscount * actualDiscountPercentage) / 100;
        const itemFinalPrice = itemBaseTotalBeforeDiscount - itemDiscountAmount;

        updatedItem.calculatedBasePrice = itemBaseTotalBeforeDiscount;
        updatedItem.discountAmount = itemDiscountAmount;
        updatedItem.calculatedItemTotal = itemFinalPrice;
        // End re-applying discount logic for variant changes.

        return updatedItem;
      })
    );
  };

  const [couriers, setCouriers] = useState([]);

  const fetchCouriers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get("https://test.api.dpmsign.com/api/courier", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCouriers(res.data.data.couriers || []);
    } catch (err) {
      console.error("Failed to fetch couriers", err);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  // NEW HANDLER FOR PRODUCT CLICK (TO OPEN MODAL)
  const handleProductClickForModal = useCallback((product) => {
    setSelectedProductForModal(product);
    setIsProductModalOpen(true);
  }, []);

  // NEW HANDLER TO ADD ITEM FROM MODAL TO SELECTED ITEMS
  const handleAddItemFromModal = useCallback(
    (itemToAdd) => {
      setSelectedItems((prev) => {
        // For square-feet products, you might want to allow multiple instances
        // if dimensions are different, even if it's the same product ID.
        // For flat products, if quantity is just being updated, increment it.
        // IMPORTANT: The `calculatedItemTotal` and `customUnitPrice` from the modal
        // should be preserved, as they already reflect the full calculation including discount.

        const existingItemIndex = prev.findIndex(
          (item) =>
            item.productId === itemToAdd.productId &&
            item.widthInch === itemToAdd.widthInch && // Important for square-feet uniqueness
            item.heightInch === itemToAdd.heightInch && // Important for square-feet uniqueness
            item.productVariantId === itemToAdd.productVariantId // Important for variant uniqueness
        );

        if (
          existingItemIndex !== -1 &&
          itemToAdd.pricingType !== "square-feet"
        ) {
          // If existing and not square-feet (which might need unique entries per dimension), update quantity
          // For flat products, sum up quantities and calculate new total.
          const updated = [...prev];
          const existing = updated[existingItemIndex];

          // Recalculate combined total
          const newTotalQuantity = existing.quantity + itemToAdd.quantity;
          let newCalculatedItemTotal;
          let newCalculatedBasePrice;
          let newDiscountAmount;

          // If the customUnitPrice is consistent, recalculate total based on new quantity.
          // Otherwise, it implies different pricing, so maybe it should be a new line item.
          // For simplicity, if unit prices are different on re-add, create new item.
          // If unit prices are the same, combine quantities and recalculate total.
          if (existing.customUnitPrice === itemToAdd.customUnitPrice) {
            // Reapply the discount logic here based on new total quantity
            const pricePerUnitOrSqFt = Number(
              existing.customUnitPrice || existing.basePrice || 0
            );
            const currentProduct = products.find(
              (p) => p.productId === existing.productId
            ); // Get product details for discount rules
            const discountStart = Number(currentProduct?.discountStart || 0);
            const discountEnd = Number(currentProduct?.discountEnd || 0);
            const maxDiscountPercentage = Number(
              currentProduct?.maxDiscountPercentage || 0
            );

            let itemBaseTotalBeforeDiscount =
              pricePerUnitOrSqFt * newTotalQuantity;

            let actualDiscountPercentage = 0;
            if (newTotalQuantity >= discountStart) {
              if (newTotalQuantity <= discountEnd) {
                if (discountEnd > discountStart) {
                  actualDiscountPercentage =
                    (maxDiscountPercentage *
                      (newTotalQuantity - discountStart)) /
                    (discountEnd - discountStart);
                } else {
                  actualDiscountPercentage = maxDiscountPercentage;
                }
              } else {
                actualDiscountPercentage = maxDiscountPercentage;
              }
            } else {
              actualDiscountPercentage = 0;
            }

            newDiscountAmount =
              (itemBaseTotalBeforeDiscount * actualDiscountPercentage) / 100;
            newCalculatedItemTotal =
              itemBaseTotalBeforeDiscount - newDiscountAmount;
            newCalculatedBasePrice = itemBaseTotalBeforeDiscount; // The base price for the new combined quantity
          } else {
            // If customUnitPrice is different, don't try to merge too smartly,
            // just sum up the existing item's totals with the new item's totals.
            // This means if a flat product is added again with a *different* price, it becomes an aggregate.
            newCalculatedItemTotal =
              existing.calculatedItemTotal + itemToAdd.calculatedItemTotal;
            newCalculatedBasePrice =
              existing.calculatedBasePrice + itemToAdd.calculatedBasePrice;
            newDiscountAmount =
              existing.discountAmount + itemToAdd.discountAmount;
          }

          updated[existingItemIndex] = {
            ...existing,
            quantity: newTotalQuantity,
            calculatedItemTotal: newCalculatedItemTotal,
            calculatedBasePrice: newCalculatedBasePrice, // Update this as well
            discountAmount: newDiscountAmount, // Update this as well
          };
          return updated;
        } else {
          // Otherwise, add new item (either truly new, or a square-feet product with new dimensions/variant)
          return [...prev, itemToAdd];
        }
      });
      setIsProductModalOpen(false); // Close the modal
      setSelectedProductForModal(null); // Clear the selected product
    },
    [products]
  ); // Add `products` to dependency array to access discount properties

  const handleSaveOrder = async () => {
    const token = localStorage.getItem("authToken");
    const selectedCustomer = customers.find(
      (c) => c.customerId === Number(selectedCustomerId)
    );

    const selectedStaff = staffs.find(
      (s) => s.staffId === Number(selectedStaffId)
    );

    if (!selectedCustomer || selectedItems.length === 0) {
      Swal.fire("Error", "Missing customer or products", "error");
      return;
    }

    let staffIdToSend = null;
    if (isAdmin) {
      staffIdToSend = null;
    } else {
      if (!selectedStaffId) {
        Swal.fire(
          "Error",
          "Please select a staff member for the order.",
          "error"
        );
        return;
      }
      staffIdToSend = selectedStaffId;
    }

    const orderData = {
      customerId: selectedCustomer.customerId,
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email || "",
      customerPhone: selectedCustomer.phone,
      staffId: staffIdToSend,
      method: paymentMethod === "online-payment" ? "online" : "offline",
      status: "order-request-received",
      currentStatus: "order-request-received",
      paymentMethod,
      paymentStatus,
      deliveryMethod,
      billingAddress: selectedCustomer.billingAddress || "",
      deliveryDate: new Date().toISOString().split("T")[0],

      courierId: deliveryMethod === "courier" ? selectedCourierId : null,
      courierAddress: deliveryMethod === "courier" ? courierAddressInput : null,

      additionalNotes: notesInput || "",

      orderItems: selectedItems.map((item) => ({
        productId: item.productId,
        productVariantId: item.productVariantId || null,
        quantity: item.quantity,
        widthInch: item.widthInch || null,
        heightInch: item.heightInch || null,
        // Send the final calculated total for this specific line item to the backend.
        // The backend will then sum these values for the overall order total.
        price: Number(item.calculatedItemTotal),
      })),
    };

    try {
      const res = await axios.post(
        "https://test.api.dpmsign.com/api/order/create",
        orderData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data?.status === 201) {
        const newOrderId = res.data.data.order.orderId;
        setInvoiceData({
          orderData,
          selectedCustomer,
          selectedItems, // Pass selectedItems to invoice for details
          grossTotal,
          newOrderId,
          staffName: isAdmin ? "N/A" : selectedStaff?.name || "N/A",
        });
        setTriggerInvoiceGenerate(true);
        setSelectedItems([]);
        setSelectedCustomerId(null);
        setSelectedStaffId(null);
        fetchNextOrderId();
        Swal.fire("Success", "Order created", "success");
      }
    } catch (err) {
      console.error(
        "Save order error response:",
        err.response?.data || err.message
      );
      Swal.fire("Error", "Failed to create order", "error");
    }
  };

  const handleInvoiceGenerated = () => {
    setTriggerInvoiceGenerate(false);
    setInvoiceData(null);
  };

  useEffect(() => {
    fetchNextOrderId();
    fetchCustomers();
    if (!isAdmin) {
      fetchStaffs();
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [filters]);

  return (
    <div className="grid grid-cols-12 h-screen">
      <div className="col-span-5">
        <POSLeftPanel
          products={products}
          categories={categories}
          filters={filters}
          setFilters={setFilters}
          searchText={searchText}
          setSearchText={setSearchText}
          onProductClick={handleProductClickForModal}
        />
      </div>
      <div className="col-span-7 p-4 flex flex-col">
        <p className="text-sm font-bold mb-2">Order No: #{nextOrderId}</p>

        {selectedCustomer ? (
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded mb-3 shadow">
            <div>
              <p>
                <strong>Name:</strong> {selectedCustomer.name}
              </p>
              <p>
                <strong>Number:</strong> {selectedCustomer.phone}
              </p>
            </div>
            <button
              onClick={handleUnselectCustomer}
              className="btn btn-sm btn-outline"
              title="Unselect Customer"
            >
              ❌ Clear
            </button>
          </div>
        ) : (
          <p className="mb-3 italic text-gray-500">No customer selected</p>
        )}

        <CustomerSelector
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          refreshCustomers={() => {
            fetchCustomers();
          }}
          triggerModalOpen={openCustomerModal}
        />

        <div className="flex justify-end my-3">
          <button onClick={handleOpenCustomerModal} className="btn btn-outline">
            ➕ Add Customer
          </button>
        </div>

        {!isAdmin && (
          <StaffSelector
            staffs={staffs}
            selectedStaffId={selectedStaffId}
            setSelectedStaffId={setSelectedStaffId}
          />
        )}

        <OrderSummary
          selectedItems={selectedItems}
          incrementQuantity={incrementQuantity}
          decrementQuantity={decrementQuantity}
          removeProduct={removeProduct}
          handleVariantChange={handleVariantChange}
          updateItemField={updateItemField}
          calculateItemTotal={calculateItemTotal}
        />

        <hr />
        <OrderTotals
          // Pass new total breakdown to OrderTotals
          totalBeforeItemDiscounts={totalBeforeItemDiscounts}
          totalItemDiscounts={totalItemDiscounts}
          subTotal={subTotal} // This is the sum of discounted line items
          couponDiscount={couponDiscount} // Still 0
          grossTotal={grossTotal}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          deliveryMethod={deliveryMethod}
          setDeliveryMethod={setDeliveryMethod}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          couriers={couriers}
          selectedCourierId={selectedCourierId}
          setSelectedCourierId={setSelectedCourierId}
          courierAddressInput={courierAddressInput}
          setCourierAddressInput={setCourierAddressInput}
          notesInput={notesInput}
          setNotesInput={setNotesInput}
        />

        <div className="mt-4">
          <button
            onClick={handleSaveOrder}
            className="btn btn-secondary w-full"
          >
            Save & Print
          </button>
        </div>

        {invoiceData && (
          <InvoiceGenerator
            {...invoiceData}
            triggerGenerate={triggerInvoiceGenerate}
            onGenerated={handleInvoiceGenerated}
            staffName={invoiceData.staffName}
          />
        )}

        <ProductDetailsModal
          isOpen={isProductModalOpen}
          onRequestClose={() => setIsProductModalOpen(false)}
          product={selectedProductForModal}
          onAddItemToOrder={handleAddItemFromModal}
        />
      </div>
    </div>
  );
}
