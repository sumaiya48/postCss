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

export default function POSDashboard() {
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ categoryId: null });
  const [selectedItems, setSelectedItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [staffs, setStaffs] = useState([]); // To store the list of all staffs
  const [selectedStaffId, setSelectedStaffId] = useState(null); // The manually selected staff ID

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("cod-payment");
  const [deliveryMethod, setDeliveryMethod] = useState("shop-pickup");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  const [selectedCourierId, setSelectedCourierId] = useState(null);
  const [courierAddressInput, setCourierAddressInput] = useState("");

  const [nextOrderId, setNextOrderId] = useState(null);
  const [triggerInvoiceGenerate, setTriggerInvoiceGenerate] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // নতুন: select করা customer এর object খুঁজে নিচ্ছি
  const selectedCustomer = customers.find(
    (c) => c.customerId === Number(selectedCustomerId)
  );
const selectedStaff = staffs.find(
  (s) => s.staffId === Number(selectedStaffId)
);


  // --- START: User Data and Staff ID Logic ---
  // Re-introducing userData parsing for role check
  let userData = null;
  try {
    const raw = localStorage.getItem("userData");
    if (raw && raw !== "undefined") {
      userData = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Invalid userData in localStorage:", e);
    localStorage.removeItem("userData"); // future protection
  }

  // Determine if the logged-in user is an admin
  const isAdmin = userData?.role === "admin";
  // Line 60: Debugging isAdmin status
  //console.log("Is Admin:", isAdmin, "User Data Role:", userData?.role);
  // --- END: User Data and Staff ID Logic ---

  // fetching staffs
  const fetchStaffs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      //console.log("Fetching staffs with token:", token); // Debugging token
      const res = await axios.get("https://test.api.dpmsign.com/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      //console.log("Fetched Staffs Response:", res.data); // Keep this log for verification

      // Line 70: CRITICAL FIX: Change res.data.data.staffs to res.data.data.staff
      if (res.data && res.data.data && Array.isArray(res.data.data.staff)) {
        setStaffs(res.data.data.staff); // <--- Changed from .staffs to .staff
        console.log("Staffs set in state:", res.data.data.staff); // Confirm data set
      } else {
        console.warn("Staffs data is not an array or missing:", res.data);
        setStaffs([]); // Ensure it's an empty array if data is malformed
      }
    } catch (err) {
      console.error(
        "Failed to fetch staffs:",
        err.response?.data || err.message
      );
      Swal.fire("Error", "Failed to load staff list.", "error");
    }
  };

  // নতুন function, selected customer unselect করার জন্য
  const handleUnselectCustomer = () => {
    setSelectedCustomerId(null);
  };

  // POSDashboard.jsx
  const [openCustomerModal, setOpenCustomerModal] = useState(false);

  const handleOpenCustomerModal = () => {
    setOpenCustomerModal(false); // 👈 প্রথমে false করে reset করি
    setTimeout(() => {
      setOpenCustomerModal(true); // 👈 তারপর আবার true করে trigger দিই
    }, 50);
  };

  const calculateItemTotal = useCallback((item) => {
    const price = Number(item.customUnitPrice || 0);
    const quantity = Number(item.quantity || 0);
    if (item.pricingType === "square-feet") {
      const area = (item.widthInch || 0) * (item.heightInch || 0);
      return price * quantity * area;
    }
    return price * quantity;
  }, []);

  const subTotal = selectedItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );
  const grossTotal = Math.max(subTotal - couponDiscount, 0);

  // Fetching
  const fetchProducts = async () => {
    const res = await axios.get("https://test.api.dpmsign.com/api/product", {
      params: { categoryId: filters.categoryId },
    });
    setProducts(res.data.data.products);
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

  // Actions
  const applyCoupon = async () => {
    if (!couponCode.trim()) return setCouponError("Enter a coupon code");
    try {
      const res = await axios.get(
        `https://test.api.dpmsign.com/api/coupon?code=${couponCode.trim()}`
      );
      const discount = res.data.data.totalPrice - res.data.data.discountedPrice;
      setCouponDiscount(discount);
      setAppliedCoupon(res.data.data.coupon);
      setCouponError("");
    } catch {
      setCouponError("Invalid or expired coupon");
      setCouponDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const updateItemField = (productId, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, [field]: value } : item
      )
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
        return {
          ...item,
          productVariantId: selectedOption?.value || null,
          selectedVariantDetails: selected || null,
          customUnitPrice: selected?.additionalPrice ?? item.basePrice,
        };
      })
    );
  };

  const [couriers, setCouriers] = useState([]);

  // Function to fetch couriers
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

  // Call this function inside useEffect
  useEffect(() => {
    fetchCouriers();
  }, []);
  const [notesInput, setNotesInput] = useState(""); // State to hold additional notes

  const handleSaveOrder = async () => {
    const token = localStorage.getItem("authToken");
    const selectedCustomer = customers.find(
      (c) => c.customerId === Number(selectedCustomerId)
    );

    // Find the selected staff object for displaying the name
    // This will be used for invoice data if a staff is selected
    const selectedStaff = staffs.find(
      (s) => s.staffId === Number(selectedStaffId)
    );
    

    if (!selectedCustomer || selectedItems.length === 0) {
      Swal.fire("Error", "Missing customer or products", "error");
      return;
    }

    // Determine staffId to send based on admin role or manual selection
    let staffIdToSend = null;
    if (isAdmin) {
      staffIdToSend = null; // Admins don't need to specify staffId
    } else {
      // For non-admin users, staffId is required and must be selected
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
      staffId: staffIdToSend, // Use the determined staffId
      method: paymentMethod === "online-payment" ? "online" : "offline",
      status: "order-request-received",
      currentStatus: "order-request-received",
      paymentMethod,
      paymentStatus,
      deliveryMethod,
      billingAddress: selectedCustomer.billingAddress || "",
      deliveryDate: new Date().toISOString().split("T")[0], // e.g. 2025-07-02

      // Courier and address support
      courierId: deliveryMethod === "courier" ? selectedCourierId : null,
      courierAddress: deliveryMethod === "courier" ? courierAddressInput : null,

      additionalNotes: notesInput || "", // Added this

      couponId: appliedCoupon?.couponId || null,

      orderItems: selectedItems.map((item) => ({
        productId: item.productId,
        productVariantId: item.productVariantId || null,
        quantity: item.quantity,
        widthInch: item.widthInch || null,
        heightInch: item.heightInch || null,
        price: Number(item.customUnitPrice),
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
          selectedItems,
          grossTotal,
          couponDiscount,
          newOrderId,
          staffName: isAdmin ? "N/A" : selectedStaff?.name || "N/A",
         
          
        });
        setTriggerInvoiceGenerate(true);
        setSelectedItems([]);
        setSelectedCustomerId(null);
        setSelectedStaffId(null); // Reset selected staff after order
        setCouponCode("");
        setCouponDiscount(0);
        fetchNextOrderId();
        Swal.fire("Success", "Order created", "success");
      }
    } catch (err) {
      console.error(
        "Save order error response:",
        err.response?.data || err.message
      );
      Swal.fire("Error", "Failed to create order", "error"); // এখানে icon string দেওয়া হয়েছে
    }
  };

  const handleInvoiceGenerated = () => {
    setTriggerInvoiceGenerate(false);
    setInvoiceData(null);
  };

  useEffect(() => {
    fetchNextOrderId();
    fetchCustomers();
    // Line 345: Only fetch staffs if the user is NOT an admin
    if (!isAdmin) {
      console.log("User is NOT admin, fetching staffs..."); // Debugging call
      fetchStaffs();
    } else {
      console.log("User is admin, skipping staff fetch."); // Debugging call
    }
  }, [isAdmin]); // Re-run if isAdmin changes (e.g., after login/logout)

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
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          searchText={searchText}
          setSearchText={setSearchText}
        />
      </div>
      <div className="col-span-7 p-4 flex flex-col">
        <p className="text-sm font-bold mb-2">Order No: #{nextOrderId}</p>

        {/* Customer Info Display with unselect button */}
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

      

        {/* ✅ Staff Info 
{selectedStaff && (
  <div className="bg-gray-100 p-3 rounded mb-3 shadow">
    <p><strong>Staff Name:</strong> {selectedStaff.name}</p>
    <p><strong>Staff Phone:</strong> {selectedStaff.phone}</p>
  </div>
)} */}

        

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

        {/* Line 407: Conditionally render Staff Selector if not an admin */}
        {!isAdmin && (
          // Using the StaffSelector component here
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
          couponDiscount={couponDiscount}
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
          notesInput={notesInput} // Pass notesInput to OrderTotals
          setNotesInput={setNotesInput} // Pass setNotesInput to OrderTotals
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
      </div>
    </div>
  );
}
