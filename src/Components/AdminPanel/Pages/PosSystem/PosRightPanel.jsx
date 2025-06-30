import React, { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import { FaUser, FaTrash } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";

const POSRightPanel = () => {
  
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
    try {
      const { data } = await axios.get(
        "https://test.api.dpmsign.com/api/product-category" // FULL URL
      );
      setCategories(data.data.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
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
    <div className="col-span-5 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2 gap-6">
        <div className="text-sm">
          <p className="font-bold mb-2">
            Order No: <span>{nextOrderId ? `#ORD-${nextOrderId}` : "Loading..."}</span>
          </p>
          <div className="mb-2 flex items-center gap-1">
            <label htmlFor="orderDate" className="font-semibold text-xs">Date:</label>
            <input
              type="date"
              id="orderDate"
              value={formatDate(orderDate)}
              onChange={(e) => setOrderDate(e.target.valueAsDate)}
              className="input input-bordered"
            />
          </div>
          <div className="mb-2 flex items-center gap-1">
            <label htmlFor="deliveryDate" className="font-semibold text-xs">Delivery Date:</label>
            <input
              type="date"
              id="deliveryDate"
              value={formatDate(deliveryDate)}
              onChange={(e) => setDeliveryDate(e.target.valueAsDate)}
              className="input input-bordered"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaUser className="text-gray-600" />
          <Select
            className="w-64 text-sm"
            options={customers.map((c) => ({
              value: c.customerId,
              label: `${c.name} (${c.phone})`,
            }))}
            value={customers
              .map((c) => ({ value: c.customerId, label: `${c.name} (${c.phone})` }))
              .find((o) => o.value === selectedCustomerId) || null}
            onChange={(option) => setSelectedCustomerId(option ? option.value : null)}
            isClearable
            placeholder="Select a customer..."
          />
        </div>
      </div>

      {/* Order Summary */}
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
                <td>{item.name.length > 20 ? item.name.slice(0, 20) + "..." : item.name}</td>
                <td>
                  {item.availableVariants?.length > 0 ? (
                    <Select
                      className="text-sm min-w-[120px]"
                      options={item.availableVariants.map((v) => ({
                        value: v.productVariantId,
                        label: `Variant ${v.productVariantId}${v.color ? ` (${v.color})` : ""}${v.size ? ` (${v.size})` : ""}`,
                      }))}
                      value={
                        item.productVariantId
                          ? {
                              value: item.productVariantId,
                              label: `Variant ${item.productVariantId}${item.selectedVariantDetails?.color ? ` (${item.selectedVariantDetails.color})` : ""}${item.selectedVariantDetails?.size ? ` (${item.selectedVariantDetails.size})` : ""}`,
                            }
                          : null
                      }
                      onChange={(option) => handleVariantChange(item.productId, option)}
                      isClearable
                      placeholder="Select Variant"
                    />
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    className="input input-bordered input-xs w-20 text-right"
                    value={item.customUnitPrice ?? ""}
                    onChange={(e) => {
                      const newVal = Number(e.target.value);
                      setSelectedItems((prev) =>
                        prev.map((s) =>
                          s.productId === item.productId
                            ? { ...s, customUnitPrice: isNaN(newVal) ? null : newVal }
                            : s
                        )
                      );
                    }}
                  />
                </td>
                <td>
                  {item.pricingType === "square-feet" ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="W"
                        className="input input-bordered input-xs w-12 text-center"
                        value={item.widthInch ?? ""}
                        onChange={(e) => {
                          const newVal = Number(e.target.value);
                          setSelectedItems((prev) =>
                            prev.map((s) =>
                              s.productId === item.productId ? { ...s, widthInch: isNaN(newVal) ? null : newVal } : s
                            )
                          );
                        }}
                      />
                      <span>:</span>
                      <input
                        type="number"
                        placeholder="H"
                        className="input input-bordered input-xs w-12 text-center"
                        value={item.heightInch ?? ""}
                        onChange={(e) => {
                          const newVal = Number(e.target.value);
                          setSelectedItems((prev) =>
                            prev.map((s) =>
                              s.productId === item.productId ? { ...s, heightInch: isNaN(newVal) ? null : newVal } : s
                            )
                          );
                        }}
                      />
                      {item.widthInch > 0 && item.heightInch > 0 && (
                        <span className="text-xs text-gray-500">
                          ({((item.widthInch / 12) * (item.heightInch / 12)).toFixed(2)} sqft)
                        </span>
                      )}
                    </div>
                  ) : (
                    item.selectedVariantDetails?.ratio || "N/A"
                  )}
                </td>
                <td className="flex gap-2">
                  <button onClick={() => decrementQuantity(item.productId)} className="btn btn-xs btn-outline">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => incrementQuantity(item.productId)} className="btn btn-xs btn-outline">+</button>
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

      {/* Totals */}
      <div className="mt-auto space-y-2 text-sm">
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            className="input input-bordered input-sm flex-grow"
            placeholder="Enter Coupon Code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button onClick={applyCoupon} className="btn btn-primary btn-sm">Apply Coupon</button>
        </div>
        {couponError && <p className="text-red-600 text-sm mb-2">{couponError}</p>}
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
          <label className="font-bold">Payment method</label>
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
          <label className="font-bold">Delivery method</label>
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
          <label className="font-bold">Payment Status</label>
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
        {deliveryMethod === "courier" && (
          <>
            <input
              type="text"
              className="input input-bordered w-full mb-2"
              placeholder="Enter courier address"
              value={courierAddressInput}
              onChange={(e) => setCourierAddressInput(e.target.value)}
            />
            <select
              className="select select-bordered w-full mb-2"
              value={selectedCourierId || ""}
              onChange={(e) =>
                setSelectedCourierId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Select Courier</option>
              {couriers.map((courier) => (
                <option key={courier.courierId} value={courier.courierId}>
                  {courier.name}
                </option>
              ))}
            </select>
          </>
        )}
        <textarea
          placeholder="Additional notes"
          className="textarea textarea-bordered w-full mb-2"
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
        />
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
  );
};

export default POSRightPanel;
