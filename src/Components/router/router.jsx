import { createBrowserRouter, Navigate } from "react-router-dom";

// Import your ProtectedRoute component for authentication guard
import ProtectedRoute from "./ProtectedRoute";

// Import authentication-related pages
import Login from "../AdminPanel/Pages/Login/Login";
import Register from "../AdminPanel/Pages/Register/Register";

// Import the main Admin Panel Layout
import AdminPanelLayout from "../Layouts/AdminPanelLayout";

// Import Admin Panel Dashboard and POS System pages
import AdminDashboard from "../AdminPanel/Pages/Dashboard/AdminDashboard";
import PosSystem from "../AdminPanel/Pages/PosSystem/PosSystem";

// Import all Order management pages
import Order from "../AdminPanel/Pages/Order/Order"; // Represents "All Orders"
import NewRequest from "../AdminPanel/Pages/Order/NewRequest"; // Represents "New Request" / "Pending"
import InProgressOrders from "../AdminPanel/Pages/Order/InProgressOrders"; // Represents "In Progress" orders
import CompletedOrder from "../AdminPanel/Pages/Order/CompletedOrder"; // Represents "Completed" orders
import CancelledOrder from "../AdminPanel/Pages/Order/CancelledOrder"; // Represents "Cancelled" orders

// Import Product management pages
import ProductList from "../AdminPanel/Pages/Products/ProductList";
import Categories from "../AdminPanel/Pages/Products/Categories";
import AddProduct from "../AdminPanel/Pages/Products/AddProduct";
import ProductReview from "../AdminPanel/Pages/Products/ProductReview";
import ViewProductDetails from "../AdminPanel/Pages/Products/ViewProductDetails";
import UpdateProduct from "../AdminPanel/Pages/Products/UpdateProduct";

// Import other Admin Panel pages
import Coupons from "../AdminPanel/Pages/Coupons/Coupons";
import Media from "../AdminPanel/Pages/Media/Media";
import Customers from "../AdminPanel/Pages/Customers/Customers";
import Staff from "../AdminPanel/Pages/Staff/Staff";
import Courier from "../AdminPanel/Pages/Courier/Courier";
import Transactions from "../AdminPanel/Pages/Transactions/Transactions";
import Newsletter from "../AdminPanel/Pages/Newsletter/Newsletter";
import Inqueries from "../AdminPanel/Pages/Inqueries/Inqueries";

// Import Job management pages
import Jobs from "../AdminPanel/Pages/Jobs/Jobs";
import CreateJob from "../AdminPanel/Pages/Jobs/CreateJob";
import EditJob from "../AdminPanel/Pages/Jobs/EditJob";

// Import Blog management pages
import Blog from "../AdminPanel/Pages/Blog/Blog";
import AddBlog from "../AdminPanel/Pages/Blog/AddBlog";
import EditBlog from "../AdminPanel/Pages/Blog/EditBlog";

// Import FAQ and Profile pages
import FAQ from "../AdminPanel/Pages/FAQ/FAQ";
import Profile from "../AdminPanel/Pages/Profile/Profile";

// Create the browser router instance
const router = createBrowserRouter([
  // 1. Public Login Route: Accessible without authentication
  {
    path: "/login",
    element: <Login />,
  },
  // 2. Public Register Route: Accessible without authentication
  {
    path: "/register",
    element: <Register />,
  },
  // 3. Protected Admin Panel Routes: Requires authentication via ProtectedRoute
  {
    path: "/", // Base path for protected routes
    element: <ProtectedRoute />, // This component acts as a guard
    children: [
      {
        // AdminPanelLayout wraps all admin-specific content
        element: <AdminPanelLayout />,
        children: [
          // Redirect from root "/" to "/dashboard" if authenticated
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // Core Dashboard and POS System
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "pos", element: <PosSystem /> },

          // Order Management Pages (in the specified sequence)
          { path: "orders/new-request", element: <NewRequest /> }, // 1. New Request / Pending
          { path: "orders/in-progress", element: <InProgressOrders /> }, // 2. In Progress
          { path: "orders/completed", element: <CompletedOrder /> }, // 3. Completed
          { path: "orders/cancelled", element: <CancelledOrder /> }, // 4. Cancelled
          { path: "orders/all", element: <Order /> }, // 5. All Orders

          // Product Management Pages
          { path: "products/all", element: <ProductList /> },
          { path: "products/categories", element: <Categories /> },
          { path: "products/add", element: <AddProduct /> },
          { path: "products/review", element: <ProductReview /> },
          {
            path: "products/product-details/:productId",
            element: <ViewProductDetails />,
          },
          {
            path: "products/product-update/:productId",
            element: <UpdateProduct />,
          },

          // Other Admin Sections
          { path: "coupons", element: <Coupons /> },
          { path: "media", element: <Media /> },
          { path: "customers", element: <Customers /> },
          { path: "staff", element: <Staff /> },
          { path: "courier", element: <Courier /> },
          { path: "transactions", element: <Transactions /> },
          { path: "newsletter", element: <Newsletter /> },
          { path: "inquiries", element: <Inqueries /> },
          { path: "jobs", element: <Jobs /> },
          { path: "blogs", element: <Blog /> },
          { path: "faq", element: <FAQ /> },

          // Specific Job Management Routes (consider nesting under "jobs" if logical)
          { path: "/create-job", element: <CreateJob /> }, // Note: leading slash means absolute path
          { path: "/edit-job/:jobId", element: <EditJob /> }, // Note: leading slash means absolute path

          // Specific Blog Management Routes (consider nesting under "blogs" if logical)
          { path: "/add-blog", element: <AddBlog /> }, // Note: leading slash means absolute path
          { path: "/edit-blog/:blogId", element: <EditBlog /> }, // Note: leading slash means absolute path

          // User Profile Page
          { path: "/profile", element: <Profile /> }, // Note: leading slash means absolute path
        ],
      },
    ],
  },
]);

export default router;
