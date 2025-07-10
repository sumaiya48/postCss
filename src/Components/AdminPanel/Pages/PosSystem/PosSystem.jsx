// POSDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import POSLeftPanel from "./PosLeftPanel";
import OrderSummary from "./OrderSummary";
import CustomerSelector from "./CustomerSelector";
import CouponInput from "./CouponInput";
import OrderTotals from "./OrderTotals";
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
    // If the item comes directly from the modal, it will have 'calculatedItemTotal'
    // This `calculatedItemTotal` already includes all discounts and variant prices from the modal.
    // Use this as the primary source for the item's total.
    if (
      item.calculatedItemTotal !== undefined &&
      item.calculatedItemTotal !== null
    ) {
      return item.calculatedItemTotal;
    }

    // Otherwise, recalculate if inputs were changed in OrderSummary.
    // The `customUnitPrice` should reflect the price per unit/sqft *after* variant additions.
    const pricePerUnitOrSqFt = Number(
      item.customUnitPrice || item.basePrice || 0
    );
    const quantity = Number(item.quantity || 0);

    if (
      item.pricingType === "square-feet" &&
      item.widthInch &&
      item.heightInch
    ) {
      const area = (item.widthInch / 12) * (item.heightInch / 12);
      return pricePerUnitOrSqFt * quantity * area;
    }
    return pricePerUnitOrSqFt * quantity;
  }, []);

  const subTotal = selectedItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );
  const grossTotal = Math.max(subTotal - 0, 0); // Assuming no couponDiscount for now

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

          // When any relevant field changes in OrderSummary, re-calculate the item total.
          // This recalculation should use the item's current `customUnitPrice` (which
          // includes the base price and selected variant's additional price).
          // The discount calculation is NOT re-applied here, as that's complex and handled
          // by the modal when initially adding the item. `calculatedItemTotal` should reflect that final price.
          if (
            field === "quantity" ||
            field === "widthInch" ||
            field === "heightInch" ||
            field === "customUnitPrice" // if customUnitPrice is manually changed
          ) {
            // Recalculate based on updated quantity/dimensions and current effective unit price (customUnitPrice)
            updatedItem.calculatedItemTotal = calculateItemTotal(updatedItem);
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
        };

        // Recalculate item total based on new customUnitPrice
        updatedItem.calculatedItemTotal = calculateItemTotal(updatedItem);

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
  const handleAddItemFromModal = useCallback((itemToAdd) => {
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

      if (existingItemIndex !== -1 && itemToAdd.pricingType !== "square-feet") {
        // If existing and not square-feet (which might need unique entries per dimension), update quantity
        // For flat products, sum up quantities and calculate new total.
        const updated = [...prev];
        const existing = updated[existingItemIndex];

        // Recalculate combined total
        const newTotalQuantity = existing.quantity + itemToAdd.quantity;
        let newCalculatedItemTotal;

        // If the customUnitPrice is consistent, recalculate total based on new quantity.
        // Otherwise, it implies different pricing, so maybe it should be a new line item.
        // For simplicity, if unit prices are different on re-add, create new item.
        // If unit prices are the same, combine quantities and recalculate total.
        if (existing.customUnitPrice === itemToAdd.customUnitPrice) {
          newCalculatedItemTotal = itemToAdd.customUnitPrice * newTotalQuantity;
        } else {
          // If unit price changed somehow for the "same" flat product, add as new line or merge smartly
          // For now, let's just add the new item total. A more complex system might average or pick one.
          newCalculatedItemTotal =
            existing.calculatedItemTotal + itemToAdd.calculatedItemTotal;
        }

        updated[existingItemIndex] = {
          ...existing,
          quantity: newTotalQuantity,
          // customUnitPrice should remain the same as they are considered "same" flat product
          calculatedItemTotal: newCalculatedItemTotal,
        };
        return updated;
      } else {
        // Otherwise, add new item (either truly new, or a square-feet product with new dimensions/variant)
        return [...prev, itemToAdd];
      }
    });
    setIsProductModalOpen(false); // Close the modal
    setSelectedProductForModal(null); // Clear the selected product
  }, []);

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
        // The 'price' sent to the backend should be the effective unit price after variant additions.
        // The total order price will be summed up on the backend.
        // Do NOT send `calculatedItemTotal` as `price` if backend expects unit price.
        price: Number(item.customUnitPrice), // customUnitPrice holds the (base + variant additional) price per unit/sqft
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
          onProductClick={handleProductClickForModal} // PASS THE NEW HANDLER
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

        {/* CouponInput remains commented out as per your original code */}
        {/* <CouponInput
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          applyCoupon={applyCoupon}
          couponError={couponError}
          couponDiscount={couponDiscount}
        /> */}
        <hr />
        <OrderTotals
          subTotal={subTotal}
          couponDiscount={0} // Pass 0 as coupon is commented out
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

        {/* RENDER THE NEW PRODUCT DETAILS MODAL */}
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
