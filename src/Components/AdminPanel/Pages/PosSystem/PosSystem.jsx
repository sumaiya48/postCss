import React, { useState, useEffect } from "react";
import Select from "react-select";

import axios from "axios";
import { FaArrowLeft, FaUser, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { FaCalendarAlt } from "react-icons/fa";
const POSDashboard = () => {
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
const [selectedCourierId, setSelectedCourierId] = useState(null);


  // Next order id state
  const [nextOrderId, setNextOrderId] = useState(null);

  // Date states (Date objects)
  const [orderDate, setOrderDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date());

  const userDataString = localStorage.getItem("userData");

const userData =
  userDataString && userDataString !== "undefined"
    ? JSON.parse(userDataString)
    : null;


const userRole = userData?.role || "staff";
const staffIdFromStorage = userData?.staffId || null;


// staffId must be number or null
const staffIdToSend =
  userRole === "admin"
    ? null
    : staffIdFromStorage !== null
    ? Number(staffIdFromStorage)
    : null;




  useEffect(() => {
    fetchNextOrderId();
  }, []);

  const fetchNextOrderId = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get("https://test.api.dpmsign.com/api/order", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orders = res.data.data.orders || [];
      // Find max orderId
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

  // Format date to yyyy-mm-dd string for input[type=date]
  const formatDate = (date) => {
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const year = d.getFullYear();
    return [year, month, day].join("-");
  };


  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const token = localStorage.getItem("authToken"); // ✅ টোকেন নিচ্ছি

    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/customer", {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ হেডারে টোকেন পাঠানো হচ্ছে
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
        "https://test.api.dpmsign.com/api/product",
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
        "https://test.api.dpmsign.com/api/product-category"
      );
      setCategories(data.data.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

const handleProductClick = (product) => {
  const variantId = product?.productVariantId || product?.variants?.[0]?.productVariantId;

  if (!variantId) {
    Swal.fire("Error", "This product has no valid variant.", "error");
    return;
  }

  setSelectedItems((prev) => {
    const index = prev.findIndex((item) => item.productId === product.productId);
    if (index !== -1) {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: updated[index].quantity + 1,
      };
      return updated;
    } else {
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          productVariantId: variantId,
        },
      ];
    }
  });
};



  const getImageUrl = (product) => {
    if (!product.images || product.images.length === 0) return "/placeholder.png";
    const imgName = product.images[0].imageName;
    if (!imgName || typeof imgName !== "string") return "/placeholder.png";
    return `https://test.api.dpmsign.com/static/product-images/${imgName}`;
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
        `https://test.api.dpmsign.com/api/coupon?code=${couponCode.trim()}`
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

  const subTotal = selectedItems.reduce(
    (acc, item) => acc + Number(item.basePrice || 0) * item.quantity,
    0
  );

  const grossTotal = Math.max(subTotal - couponDiscount, 0);

 const handleSaveAndPrint = async () => {
  const token = localStorage.getItem("authToken");

const userDataString = localStorage.getItem("userData");
const userData = userDataString ? JSON.parse(userDataString) : null;
const userRole = userData?.role || "staff";
const staffIdFromStorage = userData?.staffId || null;
// যদি appliedCoupon থাকে তার থেকে id নিতে হবে
const couponIdToSend = appliedCoupon ? appliedCoupon.couponId : null;
  // Admin হলে null, Staff হলে staffId পাঠাবে
  const staffIdToSend = userRole === "admin" ? null : (staffIdFromStorage !== null ? Number(staffIdFromStorage) : null);

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
      staffId: staffIdToSend, // এখানে staffId পাঠাচ্ছি
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
      courierAddress: courierAddressInput || null,
      additionalNotes: notesInput || "",
      orderTotalPrice: grossTotal,
      orderItems: selectedItems.map((item) => ({
        productId: item.productId,
        productVariantId: item.productVariantId
          ? Number(item.productVariantId)
          : null,
        quantity: item.quantity,
        size: item.size ? Number(item.size) : null,
        widthInch: item.widthInch ? Number(item.widthInch) : null,
        price: Number(item.basePrice) * item.quantity,
      })),
      payments: [
        {
          orderId: 0,
          amount: grossTotal,
          paymentMethod,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email || "",
          customerPhone: selectedCustomer.phone,
        },
      ],
    };

    const res = await axios.post(
      "https://test.api.dpmsign.com/api/order/create",
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data?.status === 200) {
      Swal.fire("Success", "Order created successfully", "success");
      setSelectedItems([]);
      setCouponCode("");
      setCouponDiscount(0);
      setAppliedCoupon(null);
      setSelectedCustomerId(null);
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
console.log("staffIdToSend:", staffIdToSend, typeof staffIdToSend);



  return (
    <div className="grid grid-cols-12 h-screen">
      {/* Left section */}
      <div className="col-span-7 bg-gray-100 border-r p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <button className="btn btn-sm btn-primary">
            <FaArrowLeft /> Back
          </button>
          <input
            type="text"
            placeholder="Search Here"
            className="input input-bordered w-full"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

        </div>

        <div className="grid grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.productId}
              className="border p-3 rounded text-center bg-white shadow hover:shadow-lg cursor-pointer"
              onClick={() => handleProductClick(product)}
            >
              <img
                src={getImageUrl(product)}
                onError={(e) => (e.target.src = "/placeholder.png")}
                alt={product.name}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
              <p className="text-xs font-semibold truncate">{product.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right section */}
      <div className="col-span-5 p-4 flex flex-col">
        <div className="flex  justify-between items-center mb-2 gap-6">
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
              <label htmlFor="orderDate" className="block font-semibold text-xs">
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
              <label htmlFor="deliveryDate" className="block font-semibold text-xs">
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
                setSelectedCustomerId(selectedOption ? selectedOption.value : null)
              }
              isClearable
              placeholder="Select a customer..."
            />

          </div>
        </div>



        {/* Order Summary Table */}
        <table className="table table-xs w-full mb-4">
          <thead className="bg-base-200">
            <tr>
              <th>Name</th>
              <th>Color</th>
              <th>Price</th>
              <th>Ratio</th>
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
                  <td>{item.color || "N/A"}</td>
                  <td>{item.basePrice ? Number(item.basePrice).toFixed(2) : "N/A"}</td>

                  <td>{item.ratio || "N/A"}</td>
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
                  <td>
                    {(item.basePrice && item.quantity)
                      ? (Number(item.basePrice) * item.quantity).toFixed(2)
                      : "N/A"}
                  </td>


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
            <label className="font-bold" htmlFor="">Payment method</label>
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
            <label className="font-bold" htmlFor="">Delivery method</label>
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
            <label className="font-bold" htmlFor="">Payment Status</label>
            <select
              className="select select-bordered w-1/3"
              value={deliveryMethod}
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
    onChange={(e) => setSelectedCourierId(e.target.value ? Number(e.target.value) : null)}
  >
    <option value="">Select Courier</option>
    {/* এখানে কুরিয়ার অপশন গুলো লুপ করে দেখাবে */}
    {/* যেমন: <option value={1}>Courier 1</option> */}
  </select>
)}


        </div>

        <div className="flex gap-2 mt-4">

          <button className="btn btn-secondary w-full" onClick={handleSaveAndPrint}>
            Save & Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;
