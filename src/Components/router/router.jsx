import { createBrowserRouter, Navigate } from "react-router-dom";
// Import your new ProtectedRoute
import ProtectedRoute from "./ProtectedRoute";
// Import Login and Layout
import Login from "../AdminPanel/Pages/Login/Login";
//import AdminPanelLayout from "../Layouts/AdminPanelLayout";
// Admin panel
import AdminPanelLayout from "../Layouts/AdminPanelLayout";
import AdminDashboard from "../AdminPanel/Pages/Dashboard/AdminDashboard";
import PosSystem from "../AdminPanel/Pages/PosSystem/PosSystem";
import Coupons from "../AdminPanel/Pages/Coupons/Coupons";
import Media from "../AdminPanel/Pages/Media/Media";
import Customers from "../AdminPanel/Pages/Customers/Customers";
import Staff from "../AdminPanel/Pages/Staff/Staff";
import Courier from "../AdminPanel/Pages/Courier/Courier";
import Transactions from "../AdminPanel/Pages/Transactions/Transactions";
import Newsletter from "../AdminPanel/Pages/Newsletter/Newsletter";
import Inqueries from "../AdminPanel/Pages/Inqueries/Inqueries";
import Jobs from "../AdminPanel/Pages/Jobs/Jobs";
import Blog from "../AdminPanel/Pages/Blog/Blog";
import FAQ from "../AdminPanel/Pages/FAQ/FAQ";
import Order from "../AdminPanel/Pages/Order/Order";
import CompletedOrder from "../AdminPanel/Pages/Order/CompletedOrder";
import NewRequest from "../AdminPanel/Pages/Order/NewRequest";
import CancelledOrder from "../AdminPanel/Pages/Order/CancelledOrder";
import ProductList from "../AdminPanel/Pages/Products/ProductList";
import Categories from "../AdminPanel/Pages/Products/Categories";
import AddProduct from "../AdminPanel/Pages/Products/AddProduct";
import ProductReview from "../AdminPanel/Pages/Products/ProductReview";
import CreateJob from "../AdminPanel/Pages/Jobs/CreateJob";
import EditJob from "../AdminPanel/Pages/Jobs/EditJob";
import AddBlog from "../AdminPanel/Pages/Blog/AddBlog";
import EditBlog from "../AdminPanel/Pages/Blog/EditBlog";
import ViewProductDetails from "../AdminPanel/Pages/Products/ViewProductDetails";
import UpdateProduct from "../AdminPanel/Pages/Products/UpdateProduct";
import Profile from "../AdminPanel/Pages/Profile/Profile";
import Register from "../AdminPanel/Pages/Register/Register";
//import Login from "../AdminPanel/Pages/Login/Login";

// Admin Panel Pages

const router = createBrowserRouter([
  // 1. Public Login Route
  {
    path: "/login",
    element: <Login />,
  },
  // 2. Protected Admin Panel Routes
  {
    path: "/",
    element: <ProtectedRoute />, // The guard is the main element
    children: [
      {
        // The AdminPanelLayout is now the direct child of the guard.
        // All other admin pages will be its children.
        element: <AdminPanelLayout />,
        children: [
          // Redirect from "/" to "/dashboard" if logged in
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "pos", element: <PosSystem></PosSystem> },

          // Order Dropdown
          { path: "orders/all", element: <Order></Order> },
          { path: "orders/neworder", element: <NewRequest></NewRequest> },
          {
            path: "orders/completed",
            element: <CompletedOrder></CompletedOrder>,
          },
          {
            path: "orders/cancelledorder",
            element: <CancelledOrder></CancelledOrder>,
          },

          // Products Dropdown
          { path: "products/all", element: <ProductList></ProductList> },
          { path: "products/categories", element: <Categories></Categories> },
          { path: "products/add", element: <AddProduct></AddProduct> },
          { path: "products/review", element: <ProductReview></ProductReview> },
          { path: "products/product-details/:productId", element: <ViewProductDetails /> },
          { path: "products/product-update/:productId", element: <UpdateProduct></UpdateProduct> },


          { path: "coupons", element: <Coupons></Coupons> },
          { path: "media", element: <Media></Media> },
          { path: "customers", element: <Customers></Customers> },
          { path: "staff", element: <Staff></Staff> },
          { path: "courier", element: <Courier></Courier> },
          { path: "transactions", element: <Transactions></Transactions> },
          { path: "newsletter", element: <Newsletter></Newsletter> },
          { path: "inquiries", element: <Inqueries></Inqueries> },
          { path: "jobs", element: <Jobs></Jobs> },
          { path: "blogs", element: <Blog></Blog> },
          { path: "faq", element: <FAQ></FAQ> },
          { path: "/create-job", element: <CreateJob></CreateJob> },
          { path: "/edit-job/:jobId", element: <EditJob></EditJob> },
          { path: "/add-blog", element:<AddBlog></AddBlog>  },
          { path: "/edit-blog/:blogId", element: <EditBlog></EditBlog>},
          { path: "/profile", element: <Profile></Profile>},
        ],
      },
    ],
  },

  {
    path:'/register',
    element:<Register></Register>
  }
  // {
  // path: "/admin",
  // element: <Login></Login>,
  // },
]);

export default router;
