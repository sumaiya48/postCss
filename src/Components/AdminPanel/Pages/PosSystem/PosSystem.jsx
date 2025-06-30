import React, { useState, useEffect, useRef, useCallback } from "react";
import Select from "react-select";

import axios from "axios";
import { FaArrowLeft, FaUser, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { FaCalendarAlt } from "react-icons/fa";
import InvoiceGenerator from "./InvoiceGenerator";
import POSLeftPanel from "./PosLeftPanel";


const POSDashboard = () => {
  // 1. STATE DECLARATIONS
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ categoryId: null });
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("cod-payment");
  const [deliveryMethod, setDeliveryMethod] = useState("shop-pickup");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [courierAddressInput, setCourierAddressInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);

  const [couriers, setCouriers] = useState([]);
  const [selectedCourierId, setSelectedCourierId] = useState(null);

  const [nextOrderId, setNextOrderId] = useState(null);
  const [orderDate, setOrderDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date());

  // NEW state for InvoiceGenerator
  const [triggerInvoiceGenerate, setTriggerInvoiceGenerate] = useState(false);
  const [invoiceDataForGenerator, setInvoiceDataForGenerator] = useState(null);

  // Derived values from localStorage
  const userDataString = localStorage.getItem("userData");
  const userData =
    userDataString && userDataString !== "undefined"
      ? JSON.parse(userDataString)
      : null;

  const userRole = userData?.role || "staff";
  const staffIdFromStorage = userData?.staffId || null;

  const staffIdToSend =
    userRole === "admin"
      ? null
      : staffIdFromStorage !== null
        ? Number(staffIdFromStorage)
        : null;

  // --- Define calculateItemTotal here, within the component's scope ---
  const calculateItemTotal = useCallback((item) => {
    let pricePerUnit = Number(item.customUnitPrice || 0);
    let quantity = Number(item.quantity || 0);
    let total = 0;

    if (item.pricingType === "square-feet") {
      const width = Number(item.widthInch || 0);
      const height = Number(item.heightInch || 0);

      if (width > 0 && height > 0) {
        const areaSquareFeet = width * height;
        total = areaSquareFeet * pricePerUnit * quantity;
      } else {
        total = 0; // If dimensions are not provided or invalid for square-feet
      }
    } else {
      // pricingType === 'flat'
      total = pricePerUnit * quantity;
    }
    return total;
  }, []);
  // -------------------------------------------------------------------

  // Recalculate subTotal using the new function
  const subTotal = selectedItems.reduce(
    (acc, item) => acc + calculateItemTotal(item),
    0
  );

  const grossTotal = Math.max(subTotal - couponDiscount, 0);

  // 2. HELPER FUNCTIONS AND CONSTANT DECLARATIONS
  const fetchNextOrderId = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get("https://test.api.dpmsign.com/api/order", {
        // FULL URL
        headers: { Authorization: `Bearer ${token}` },
      });
      const orders = res.data.data.orders || [];
      const maxOrderId = orders.reduce(
        (max, order) => (order.orderId > max ? order.orderId : max),
        0
      );
      setNextOrderId(maxOrderId + 1);
    } catch (error) {
      console.error("Failed to fetch orders for next order id", error);
      setNextOrderId(null);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const year = d.getFullYear();
    return [year, month, day].join("-");
  };

  const fetchCustomers = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/customer", {
        // FULL URL
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCustomers(res.data.data.customers || []);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(
        "https://test.api.dpmsign.com/api/product", // FULL URL
        { params: { categoryId: filters.categoryId } }
      );
      setProducts(data.data.products);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchCategories = async () => {
    const res = await axios.get("https://test.api.dpmsign.com/api/product-category");
const all = res.data.data.categories || [];
const topLevel = all.filter(cat => cat.parentCategoryId === null);
setCategories(topLevel);

  };

  // NEW: Fetch Couriers
  const fetchCouriers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get("https://test.api.dpmsign.com/api/courier", {
        // FULL URL
        headers: { Authorization: `Bearer ${token}` },
      });
      setCouriers(res.data.data.couriers || []); // Assuming response is data.data.couriers
    } catch (err) {
      console.error("Failed to fetch couriers", err);
    }
  };

  const handleProductClick = (product) => {
    setSelectedItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => item.productId === product.productId
      );

      if (existingItemIndex !== -1) {
        const updated = [...prev];
        updated[existingItemIndex] = {
          ...updated[existingItemIndex],
          quantity: updated[existingItemIndex].quantity + 1,
        };
        return updated;
      } else {
        // Add new item with initial values
        const initialQuantity = 1;
        const initialUnitPrice = Number(product.basePrice || 0);

        return [
          ...prev,
          {
            ...product, // Keep all product properties
            quantity: initialQuantity,
            productVariantId: null, // Start with NO variant selected
            selectedVariantDetails: null, // Store selected variant details here
            pricingType: product.pricingType, // 'flat' or 'square-feet'
            widthInch: null, // For square-feet products, initially null or 0
            heightInch: null, // For square-feet products, initially null or 0
            customUnitPrice: initialUnitPrice, // Price admin can customize (per unit or per sqft)
            availableVariants: product.variants || [], // Store the full array of available variants
          },
        ];
      }
    });
  };

  const handleVariantChange = (productId, selectedOption) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          const newVariantId = selectedOption ? selectedOption.value : null;
          const selectedVariant = newVariantId
            ? item.availableVariants.find(
              (v) => v.productVariantId === newVariantId
            )
            : null;

          let updatedUnitPrice = Number(item.basePrice || 0);
          if (
            selectedVariant &&
            selectedVariant.additionalPrice !== undefined
          ) {
            updatedUnitPrice = Number(selectedVariant.additionalPrice);
          }

          return {
            ...item,
            productVariantId: newVariantId,
            selectedVariantDetails: selectedVariant,
            customUnitPrice: updatedUnitPrice,
            // Optionally update dimensions if they are variant-specific
            // widthInch: selectedVariant?.widthInch || null,
            // heightInch: selectedVariant?.heightInch || null,
          };
        }
        return item;
      })
    );
  };

  const getImageUrl = (product) => {
    if (!product.images || product.images.length === 0)
      return "/placeholder.png";
    const imgName = product.images[0].imageName;
    if (!imgName || typeof imgName !== "string") return "/placeholder.png";
    return `https://test.api.dpmsign.com/static/product-images/${imgName}`; // FULL URL
  };

  const incrementQuantity = (productId) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decrementQuantity = (productId) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const removeProduct = (productId) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code.");
      setCouponDiscount(0);
      return;
    }
    try {
      const res = await axios.get(
        `https://test.api.dpmsign.com/api/coupon?code=${couponCode.trim()}` // FULL URL
      );
      const discount = res.data.data.totalPrice - res.data.data.discountedPrice;
      if (discount > 0) {
        setCouponDiscount(discount);
        setCouponError("");
        setAppliedCoupon(res.data.data.coupon);
      } else {
        setCouponDiscount(0);
        setCouponError("Invalid or expired coupon.");
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponDiscount(0);
      setCouponError("Invalid or expired coupon.");
      setAppliedCoupon(null);
    }
  };

  // NEW: Callback to reset the invoice generation trigger
  const handleInvoiceGenerated = () => {
    setTriggerInvoiceGenerate(false);
    setInvoiceDataForGenerator(null); // Clear data after generation
  };

  const handleSaveAndPrint = async () => {
    const token = localStorage.getItem("authToken");

    const userDataString = localStorage.getItem("userData");
    const userData =
      userDataString && userDataString !== "undefined"
        ? JSON.parse(userDataString)
        : null;

    const userRole = userData?.role || "staff";
    const staffIdFromStorage = userData?.staffId || null;
    const couponIdToSend = appliedCoupon ? appliedCoupon.couponId : null;

    const staffIdToSend =
      userRole === "admin"
        ? null
        : staffIdFromStorage !== null
          ? Number(staffIdFromStorage)
          : null;

    console.log("userData:", userData);
    console.log("userRole:", userRole);
    console.log(
      "staffIdFromStorage (before Number conversion):",
      staffIdFromStorage,
      typeof staffIdFromStorage
    );
    console.log(
      "staffIdToSend (final value):",
      staffIdToSend,
      typeof staffIdToSend
    );

    if (!selectedCustomerId) {
      Swal.fire("Warning", "Please select a customer", "warning");
      return;
    }

    const selectedCustomer = customers.find(
      (c) => c.customerId === Number(selectedCustomerId)
    );

    if (!selectedCustomer) {
      Swal.fire("Warning", "Selected customer not found", "warning");
      return;
    }

    if (selectedItems.length === 0) {
      Swal.fire("Warning", "No products selected", "warning");
      return;
    }

    try {
      const orderData = {
        customerId: Number(selectedCustomerId),
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
        billingAddress: selectedCustomer.billingAddress || "N/A",
        deliveryDate: formatDate(deliveryDate),

        couponId: couponIdToSend || null,
        courierId: selectedCourierId || null,
        courierAddress:
          deliveryMethod === "courier"
            ? courierAddressInput?.trim() || "N/A"
            : "N/A",
        additionalNotes: notesInput || "",
        orderItems: selectedItems.map((item) => ({
          productId: item.productId,
          productVariantId: item.productVariantId
            ? Number(item.productVariantId)
            : null,
          quantity: item.quantity,
          size: item.selectedVariantDetails?.size
            ? Number(item.selectedVariantDetails.size)
            : null,
          widthInch: item.widthInch ? Number(item.widthInch) : null,
          heightInch: item.heightInch ? Number(item.heightInch) : null,
          price: Number(item.customUnitPrice),
        })),
      };
      console.log("Order Data being sent:", orderData);

      const res = await axios.post(
        "https://test.api.dpmsign.com/api/order/create", // FULL URL
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.status === 201) {
        Swal.fire("Success", "Order created successfully", "success").then(
          () => {
            const newOrderId = res.data.data.order.orderId;
            if (newOrderId) {
              setInvoiceDataForGenerator({
                orderData,
                selectedCustomer,
                selectedItems,
                grossTotal,
                couponDiscount,
                newOrderId,
                products, // Pass the full products list
              });
              setTriggerInvoiceGenerate(true); // Trigger invoice generation
            }

            // Reset POS system states after successful order
            setSelectedItems([]);
            setCouponCode("");
            setCouponDiscount(0);
            setAppliedCoupon(null);
            setSelectedCustomerId(null);
            fetchNextOrderId();
          }
        );
      } else {
        throw new Error("Failed to create order");
      }
    } catch (err) {
      console.error("Backend Response Error:", err?.response?.data || err);
      Swal.fire("Error", "An error occurred while saving the order.", "error");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 3. useEffect Hooks
  useEffect(() => {
    fetchNextOrderId();
    fetchCouriers(); // Fetch couriers on component mount
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 4. Component JSX
  return (
    <div className="grid grid-cols-12 h-screen">
      {/* Left section */}
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
        calculateItemTotal={calculateItemTotal}
      ></POSLeftPanel>
      </div>

      {/* Right section */}
      <div className="col-span-7 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-2 gap-6">
          <div className="text-sm">
            <div className="mb-2">
              <p className="font-bold">
                Order No:
                <span className="font-bold">
                  {nextOrderId ? `#ORD-${nextOrderId}` : "Loading..."}
                </span>
              </p>
            </div>

            <div className="mb-2 flex items-center gap-1">
              <label
                htmlFor="orderDate"
                className="block font-semibold text-xs"
              >
                Date:
              </label>
              <input
                type="date"
                id="orderDate"
                value={formatDate(orderDate)}
                onChange={(e) => setOrderDate(e.target.valueAsDate)}
                className="input input-bordered"
              />
            </div>

            <div className="mb-2 flex items-center gap-1">
              <label
                htmlFor="deliveryDate"
                className="block font-semibold text-xs"
              >
                Delivery Date:
              </label>
              <input
                type="date"
                id="deliveryDate"
                value={formatDate(deliveryDate)}
                onChange={(e) => setDeliveryDate(e.target.valueAsDate)}
                className="input input-bordered"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
            <FaUser className="text-gray-600" />
            
            <Select
              className="w-64 text-sm"
              options={customers.map((customer) => ({
                value: customer.customerId,
                label: `${customer.name} (${customer.phone})`,
              }))}
              value={
                customers
                  .map((c) => ({
                    value: c.customerId,
                    label: `${c.name} (${c.phone})`,
                  }))
                  .find((option) => option.value === selectedCustomerId) || null
              }
              onChange={(selectedOption) =>
                setSelectedCustomerId(
                  selectedOption ? selectedOption.value : null
                )
              }
              isClearable
              placeholder="Select a customer..."
            />
          </div>
          <div>          {selectedCustomerId && (
  <div className="mb-4 p-3 bg-base-200 rounded border border-base-300">
    <p className="text-sm font-semibold text-gray-700"></p>
    <p className="text-lg"><span className=" font-bold ">Customer Name:</span>
      {
        customers.find((c) => c.customerId === selectedCustomerId)?.name
      }
    </p>
    <p className=" text-gray-600"><span className=" font-bold ">Number:</span>
      {
        customers.find((c) => c.customerId === selectedCustomerId)?.phone
      }
    </p>
    
    
  </div>
            )}</div>
          </div>

        </div>

        {/* Order Summary Table */}
        <table className="table table-xs w-full mb-4">
          <thead className="bg-base-200">
            <tr>
              <th>Name</th>
              <th>Variant</th>
              <th>Price</th>
              <th>Dimensions</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500">
                  No products selected.
                </td>
              </tr>
            ) : (
              selectedItems.map((item) => (
                <tr key={item.productId}>
                  <td>
                    {item.name.length > 20
                      ? item.name.slice(0, 20) + "..."
                      : item.name}
                  </td>

                  {/* --- Variant Selector and Display --- */}
                  <td>
                    {item.availableVariants &&
                      item.availableVariants.length > 0 ? (
                      <Select
                        className="text-sm min-w-[120px]"
                        options={item.availableVariants.map((variant) => ({
                          value: variant.productVariantId,
                          label:
                            `Variant ${variant.productVariantId} ` +
                            (variant.color ? `(${variant.color}) ` : "") +
                            (variant.size ? `(${variant.size})` : ""),
                        }))}
                        value={
                          item.productVariantId
                            ? {
                              value: item.productVariantId,
                              label:
                                `Variant ${item.productVariantId} ` +
                                (item.selectedVariantDetails?.color
                                  ? `(${item.selectedVariantDetails.color}) `
                                  : "") +
                                (item.selectedVariantDetails?.size
                                  ? `(${item.selectedVariantDetails.size})`
                                  : ""),
                            }
                            : null
                        }
                        onChange={(selectedOption) =>
                          handleVariantChange(item.productId, selectedOption)
                        }
                        isClearable
                        placeholder="Select Variant"
                      />
                    ) : (
                      "N/A" // If no variants available for this product
                    )}
                  </td>
                  {/* --- End Variant Selector --- */}

                  {/* Price/Unit Input */}
                  <td>
                    <input
                      type="number"
                      value={
                        item.customUnitPrice !== undefined &&
                          item.customUnitPrice !== null
                          ? item.customUnitPrice
                          : ""
                      }
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        setSelectedItems((prev) =>
                          prev.map((sItem) =>
                            sItem.productId === item.productId
                              ? {
                                ...sItem,
                                customUnitPrice: isNaN(newValue)
                                  ? null
                                  : newValue,
                              }
                              : sItem
                          )
                        );
                      }}
                      className="input input-bordered input-xs w-20 text-right"
                      min="0"
                      step="any"
                    />
                  </td>

                  {/* Ratio/Dimensions Input */}
                  <td>
                    {item.pricingType === "square-feet" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="W"
                          value={item.widthInch !== null ? item.widthInch : ""}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            setSelectedItems((prev) =>
                              prev.map((sItem) =>
                                sItem.productId === item.productId
                                  ? {
                                    ...sItem,
                                    widthInch: isNaN(newValue)
                                      ? null
                                      : newValue,
                                  }
                                  : sItem
                              )
                            );
                          }}
                          className="input input-bordered input-xs w-12 text-center"
                          min="0"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          placeholder="H"
                          value={
                            item.heightInch !== null ? item.heightInch : ""
                          }
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            setSelectedItems((prev) =>
                              prev.map((sItem) =>
                                sItem.productId === item.productId
                                  ? {
                                    ...sItem,
                                    heightInch: isNaN(newValue)
                                      ? null
                                      : newValue,
                                  }
                                  : sItem
                              )
                            );
                          }}
                          className="input input-bordered input-xs w-12 text-center"
                          min="0"
                        />
                        {item.widthInch > 0 && item.heightInch > 0 && (
                          <span className="text-xs text-gray-500">
                            (
                            {(
                              (item.widthInch / 12) *
                              (item.heightInch / 12)
                            ).toFixed(2)}{" "}
                            sqft)
                          </span>
                        )}
                      </div>
                    ) : (
                      item.selectedVariantDetails?.ratio || "N/A" // Use selected variant's ratio if available, else N/A
                    )}
                  </td>

                  {/* Quantity, Total, Remove buttons */}
                  <td className="flex items-center gap-2">
                    <button
                      onClick={() => decrementQuantity(item.productId)}
                      className="btn btn-xs btn-outline"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => incrementQuantity(item.productId)}
                      className="btn btn-xs btn-outline"
                    >
                      +
                    </button>
                  </td>
                  <td>{calculateItemTotal(item).toFixed(2)} Tk</td>
                  <td>
                    <button
                      onClick={() => removeProduct(item.productId)}
                      className="btn btn-xs btn-error"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals & Payment */}
        <div className="mt-auto space-y-2 text-sm">
          {/* Coupon Input */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter Coupon Code"
              className="input input-bordered input-sm flex-grow"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={applyCoupon}>
              Apply Coupon
            </button>
          </div>
          {couponError && (
            <p className="text-red-600 text-sm mb-2">{couponError}</p>
          )}
          {couponDiscount > 0 && (
            <p className="text-green-600 text-sm mb-2">
              Coupon applied! Discount: {couponDiscount.toFixed(2)} USD
            </p>
          )}
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span>{subTotal.toFixed(2)} Tk</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>{couponDiscount.toFixed(2)} Tk</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Gross Total</span>
            <span>{grossTotal.toFixed(2)} Tk</span>
          </div>
          <div className="flex justify-between">
            <label className="font-bold" htmlFor="">
              Payment method
            </label>
            <select
              className="select select-bordered w-1/3"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="online-payment">Online</option>
              <option value="cod-payment">Offline</option>
            </select>
          </div>
          <div className="flex justify-between">
            <label className="font-bold" htmlFor="">
              Delivery method
            </label>
            <select
              className="select select-bordered w-1/3"
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
            >
              <option value="shop-pickup">Shop pickup</option>
              <option value="courier">Courier</option>
            </select>
          </div>
          <div className="flex justify-between">
            <label className="font-bold" htmlFor="">
              Payment Status
            </label>
            <select
              className="select select-bordered w-1/3"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {/* Courier Address Input */}
          {deliveryMethod === "courier" && (
            <input
              type="text"
              placeholder="Enter courier address"
              className="input input-bordered w-full mb-2"
              value={courierAddressInput}
              onChange={(e) => setCourierAddressInput(e.target.value)}
            />
          )}

          {/* Notes Input */}
          <textarea
            placeholder="Additional notes"
            className="textarea textarea-bordered w-full mb-2"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
          />

          {/* Courier Select Dropdown */}
          {deliveryMethod === "courier" && (
            <select
              className="select select-bordered w-full mb-2"
              value={selectedCourierId || ""}
              onChange={(e) =>
                setSelectedCourierId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              <option value="">Select Courier</option>
              {couriers.map((courier) => (
                <option key={courier.courierId} value={courier.courierId}>
                  {courier.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            className="btn btn-secondary w-full"
            onClick={handleSaveAndPrint}
          >
            Save & Print
          </button>
        </div>
      </div>

      {/* InvoiceGenerator component rendered here (hidden by default) */}
      {invoiceDataForGenerator && (
        <InvoiceGenerator
          orderData={invoiceDataForGenerator.orderData}
          selectedCustomer={invoiceDataForGenerator.selectedCustomer}
          selectedItems={invoiceDataForGenerator.selectedItems}
          grossTotal={invoiceDataForGenerator.grossTotal}
          couponDiscount={invoiceDataForGenerator.couponDiscount}
          newOrderId={invoiceDataForGenerator.newOrderId}
          products={invoiceDataForGenerator.products}
          triggerGenerate={triggerInvoiceGenerate}
          onGenerated={handleInvoiceGenerated}
        />
      )}
    </div>
  );
};

export default POSDashboard;
