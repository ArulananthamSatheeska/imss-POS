import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Layout from "./components/Layout.jsx";
import POSLayout from "./components/layout/POSLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Items from "./pages/items/Items.jsx";
import PurchasingEntryForm from "./pages/purchasing/purchasing.jsx";
import SettingsForm from "./pages/settings.jsx";
import Sales from "./pages/sales/sales.jsx";
import StockReportForm from "./pages/Report/StockReport.jsx";
import UnitForm from "./components/Unit/UnitForm.jsx";
import SupplierForm from "./components/supplier/SupplierForm.jsx";
import CategoryForm from "./components/category/CategoryForm.jsx";
import POSForm from "./components/pos/POSForm.jsx";
import Suppliers from "./pages/items/Suppliers.jsx";
import Units from "./pages/items/Units.jsx";
import Categories from "./pages/items/Categories.jsx";
import StoreLocations from "./pages/items/StoreLocations.jsx";
import Notification from "./components/notification/Notification.jsx";
import ItemWiseReport from "./pages/Report/ItemWiseStockReport.jsx";
import BillWiseProfitReport from "./pages/Profit/BillWiseProfit.jsx";
import ReportTable from "./components/reports/ReportTable.jsx";
import Reports from "./pages/Report/StockReport.jsx";
import Calculator from "./components/models/calculator/CalculatorModal.jsx";
import NotFound from "./pages/NotFound.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import BillPrintModal from "./components/models/BillPrintModel.jsx";
import CustomerManagement from "./pages/sales/Customers.jsx";
import SalesReturn from "./pages/sales/SalesReturn.jsx";
import { AuthProvider } from "./context/NewAuthContext";
import { RegisterProvider } from "./context/RegisterContext";
import ProtectedRoute from "./components/ProtectedRoute";
import StockRecheck from "./pages/Report/StockRecheck.jsx";
import AdminAccessPanel from "./pages/UserManagement/RoleList.jsx";
import UserModal from "./pages/UserManagement/UserModal.jsx";
import UserList from "./pages/UserManagement/UserList.jsx";
import PurchaseReturn from "./pages/purchasing/PurchaseReturn.jsx";
import SalesInvoice from "./pages/sales/SalesInvoice.jsx";
import Quotation from "./pages/sales/quatation.jsx";
import PurchaseInvoice from "./pages/purchasing/PurchaseInvoice.jsx";
import PurchaseOrder from "./pages/purchasing/Purchaseorder.jsx";
import Outstanding from "./pages/Accounts/Outstanding.jsx";
import StaffManagement from "./pages/Staff/StaffManagement.jsx";
import StaffRegistration from "./pages/Staff/StaffRegistration";
import RoleBasedAccessControl from "./pages/Staff/RoleBasedAccessControl";
import AttendanceShiftManagement from "./pages/Staff/AttendanceShiftManagement";
import PayrollSalaryManagement from "./pages/Staff/PayrollSalaryManagement";
import CreateCompany from "./pages/Company/CreateCompany.jsx";
import ProductionManagement from "./pages/production/production.jsx";
import MakeProductForm from "./pages/production/MakeProductForm.jsx";
import ProductModal from "./pages/production/ProductModal.jsx";
import ProductionCategoryModal from "./pages/production/ProductionCategoryModal.jsx";
import RawMaterialModal from "./pages/production/RawMaterialModal.jsx";
import TOUCHPOSFORM from "./components/touchpos/TOUCHPOSFORM.jsx";
import RecycleBin from "./components/users/RecycleBin.jsx";
import { PERMISSIONS } from "./constants/permissions.jsx";
import RoleList from "./pages/UserManagement/RoleList.jsx";
import Approvels from "./pages/Approvels/Approvels.jsx";
import StockTransfer from "./pages/StockTransfer/StockTransfer.jsx";
import DiscountScheam from "./pages/Discount/DiscountScheam.jsx";
import CompanyWiseProfit from "./pages/Profit/CompanyWiseProfit.jsx";
// import SupplierWiseProfit from "./pages/Profit/SupplierWise.jsx";
import HomePage from "./pages/TaskManager/HomePage.jsx";
import ProjectsPage from "./pages/TaskManager/ProjectsPage.jsx";
import ReportPage from "./pages/TaskManager/ReportPage.jsx";
import SubtasksPage from "./pages/TaskManager/SubtasksPage.jsx";
import SubtaskForm from "./components/TaskManager/SubtaskForm.jsx";
import TasksPage from "./pages/TaskManager/TasksPage.jsx";
import TaskForm from "./components/TaskManager/TaskForm.jsx";
import ProjectForm from "./components/TaskManager/ProjectForm.jsx";
import Home from "./components/TaskManager/Home.jsx";
import { BarcodePage } from "./pages/items/BarcodePage.jsx";
import Expiry from "./pages/Expiry/Expiry.jsx";
import { CustomerWiseProfit } from "./pages/Profit/CustomerWiseProfit.jsx";
import { StoreAndLocationWiseProfit } from "./pages/Profit/StoreAndLocationWiseProfit.jsx";
import DailyProfitReport from "./pages/Profit/DailyProfit.jsx";
import { SupplierWiseProfit } from "./pages/Profit/SupplierWiseProfit.jsx";
import { CategoryWiseProfit } from "./pages/Profit/CategoryWiseProfit.jsx";
import ItemForm from "./components/item Form/ItemForm.jsx";
import FrontPage from "./pages/frontpage.jsx";

import LoyaltyReport from "./pages/Loyalty/LoyaltyReport.jsx"; // Create this file
import GenerateLoyaltyCard from "./pages/Loyalty/GenerateLoyaltyCard.jsx"; // Create this file
import LoyaltyCardDesign from "./pages/Loyalty/LoyaltyCardDesign.jsx";

// === App Component ===
function App() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("isDarkMode") === "true"
  );

  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("isDarkMode", isDarkMode);
  }, [isDarkMode]);

  const handleThemeToggle = () => setIsDarkMode((prev) => !prev);

  const showNotification = (message, type) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification({ ...notification, visible: false });
    }, 3000);
  };
  return (
    <div className="min-h-screen text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-300">
      <AuthProvider>
        <RegisterProvider>
          <Router>
            {notification.visible && (
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() =>
                  setNotification({ ...notification, visible: false })
                }
              />
            )}
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Layout */}
              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <Layout
                      isDarkMode={isDarkMode}
                      onThemeToggle={handleThemeToggle}
                    />
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="items" element={<Items />} />
                  <Route path="expiry" element={<Expiry />} />
                  <Route path="purchasing" element={<PurchasingEntryForm />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="SalesReturn" element={<SalesReturn />} />
                  <Route path="PurchaseReturn" element={<PurchaseReturn />} />
                  <Route path="settings" element={<SettingsForm />} />
                  <Route path="loyalty/report" element={<LoyaltyReport />} />
                  <Route
                    path="loyalty/generate-card"
                    element={<GenerateLoyaltyCard />}
                  />
                  <Route
                    path="loyalty/design-card"
                    element={<LoyaltyCardDesign />}
                  />
                </Route>

                {/* POS Routes with minimal layout */}
                <Route element={<POSLayout />}>
                  <Route path="pos" element={<POSForm />} />
                  <Route path="touchpos" element={<TOUCHPOSFORM />} />
                </Route>

                <Route
                  element={
                    <Layout
                      isDarkMode={isDarkMode}
                      onThemeToggle={handleThemeToggle}
                    />
                  }
                >
                  <Route path="suppliers" element={<Suppliers />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="units" element={<Units />} />
                  <Route path="UnitForm" element={<UnitForm />} />
                  <Route path="BarcodePage" element={<BarcodePage />} />
                  <Route path="ItemForm" element={<ItemForm />} />
                  <Route path="SupplierForm" element={<SupplierForm />} />
                  <Route path="CategoryForm" element={<CategoryForm />} />
                  <Route path="store-locations" element={<StoreLocations />} />
                  <Route path="StockReport" element={<StockReportForm />} />
                  <Route
                    path="ItemWiseStockReport"
                    element={<ItemWiseReport />}
                  />
                  <Route
                    path="ItemWiseProfit"
                    element={<DailyProfitReport />}
                  />
                  <Route
                    path="BillWiseProfit"
                    element={<BillWiseProfitReport />}
                  />
                  {/* <Route
                    path="CompanyWiseProfit"
                    element={<CompanyWiseProfit />}
                  /> */}
                  <Route
                    path="SupplierWiseProfit"
                    element={<SupplierWiseProfit />}
                  />
                  <Route
                    path="CustomerWiseProfit"
                    element={<CustomerWiseProfit />}
                  />
                  <Route
                    path="StoreAndLocationWiseProfit"
                    element={<StoreAndLocationWiseProfit />}
                  />
                  <Route
                    path="CategoryWiseProfit"
                    element={<CategoryWiseProfit />}
                  />
                  <Route path="ReportTable" element={<ReportTable />} />
                  <Route path="StockRecheck" element={<StockRecheck />} />
                  <Route path="CalculatorModal" element={<Calculator />} />
                  <Route path="billPrintModel" element={<BillPrintModal />} />
                  <Route path="Customers" element={<CustomerManagement />} />
                  <Route path="SalesInvoice" element={<SalesInvoice />} />
                  <Route path="quotation" element={<Quotation />} />
                  <Route path="PurchaseInvoice" element={<PurchaseInvoice />} />
                  <Route path="PurchaseOrder" element={<PurchaseOrder />} />
                  <Route path="Outstanding" element={<Outstanding />} />
                  <Route path="CreateCompany" element={<CreateCompany />} />
                  <Route path="production" element={<ProductionManagement />} />
                  <Route path="MakeProductForm" element={<MakeProductForm />} />
                  <Route path="ProductModal" element={<ProductModal />} />
                  <Route path="RecycleBin" element={<RecycleBin />} />
                  <Route path="PERMISSIONS" element={<Permissions />} />
                  <Route path="RoleList" element={<RoleList />} />
                  <Route path="HomePage" element={<HomePage />} />
                  <Route path="ProjectsPage" element={<ProjectsPage />} />
                  <Route path="ReportPage" element={<ReportPage />} />
                  <Route path="TasksPage" element={<TasksPage />} />
                  <Route path="TasksPage" element={<TasksPage />} />
                  <Route path="SubtasksPage" element={<SubtasksPage />} />
                  <Route path="ProjectForm" element={<ProjectForm />} />
                  <Route path="SubtaskForm" element={<SubtaskForm />} />
                  <Route path="TaskForm" element={<TaskForm />} />
                  <Route path="Home" element={<Home />} />

                  <Route
                    path="ProductionCategoryModal"
                    element={<ProductionCategoryModal />}
                  />
                  <Route
                    path="RawMaterialModal"
                    element={<RawMaterialModal />}
                  />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute adminOnly />}>
                <Route
                  element={
                    <Layout
                      isDarkMode={isDarkMode}
                      onThemeToggle={handleThemeToggle}
                    />
                  }
                >
                  <Route path="UserModal" element={<UserModal />} />
                  <Route path="UserList" element={<UserList />} />
                  <Route path="StaffManagement" element={<StaffManagement />} />
                  <Route
                    path="StaffRegistration"
                    element={<StaffRegistration />}
                  />
                  <Route
                    path="RoleBasedAccessControl"
                    element={<RoleBasedAccessControl />}
                  />
                  <Route
                    path="AttendanceShiftManagement"
                    element={<AttendanceShiftManagement />}
                  />
                  <Route
                    path="PayrollSalaryManagement"
                    element={<PayrollSalaryManagement />}
                  />
                  <Route path="Approvels" element={<Approvels />} />
                  <Route path="StockTransfer" element={<StockTransfer />} />
                  <Route path="DiscountScheam" element={<DiscountScheam />} />
                </Route>
              </Route>

              {/* Manager & Admin Reports */}
              <Route
                element={
                  <ProtectedRoute roles={["manager", "admin", "superadmin"]} />
                }
              >
                <Route
                  element={
                    <Layout
                      isDarkMode={isDarkMode}
                      onThemeToggle={handleThemeToggle}
                    />
                  }
                >
                  <Route index element={<Navigate to="/FrontPage" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="reports" element={<Reports />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </RegisterProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
