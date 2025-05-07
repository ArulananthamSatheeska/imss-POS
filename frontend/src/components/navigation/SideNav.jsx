import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/NewAuthContext";
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Package,
  ShoppingCart,
  FileText,
  Settings as SettingsIcon,
  DollarSign,
  BookOpen,
  BarChart2,
  Menu,
  PanelLeftClose,
  Box,
  Tag,
  Layers,
  MapPin,
  Search,
  User,
  RefreshCcw,
  RotateCcw,
  ShoppingBag,
  ClipboardPen,
  ClipboardList,
  BadgeDollarSign,
  ShoppingBasket,
  ClipboardPenLine,
  ClipboardCheck,
  Undo,
  Wrench,
  ShieldCheck,
  BaggageClaim,
  Trash2,
  TrendingUp,
  Calendar,
  Barcode,
  FileBarChart,
  Table,
  UserRound,
  Store,
  Recycle,
  BadgePercent,
  LayoutList,
  Castle,
  SquareCheckBig,
  Users,
  BookUser,
  CalendarCheck,
} from "lucide-react";
import { icon } from "@fortawesome/fontawesome-svg-core";

const SideNav = ({ isPosOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [openMenus, setOpenMenus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  // Role-based navigation items
  const navItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      roles: ["admin", "manager", "cashier", "customer"],
    },
    {
      path: "/item",
      icon: Package,
      label: "Item",
      roles: ["admin", "manager", "cashier"],
      subItems: [
        {
          path: "/items",
          label: "Items",
          icon: Box,
          roles: ["admin", "manager", "cashier"],
        },
        {
          path: "/expiry",
          label: "Expiry",
          icon: CalendarCheck,
          roles: ["admin", "manager", "cashier"],
        },
        {
          path: "/suppliers",
          label: "Suppliers",
          icon: Users,
          roles: ["admin", "manager"],
        },
        {
          path: "/categories",
          label: "Categories",
          icon: Tag,
          roles: ["admin", "manager"],
        },
        {
          path: "/units",
          label: "Units",
          icon: Layers,
          roles: ["admin", "manager"],
        },
        {
          path: "/store-locations",
          label: "Store Locations",
          icon: MapPin,
          roles: ["admin", "manager"],
        },
        { path: "/BarcodePage", label: "Barcode", icon: Barcode },
      ],
    },
    {
      path: "/sales",
      icon: ShoppingBag,
      label: "Sales",
      roles: ["admin", "manager", "cashier"],
      subItems: [
        {
          path: "/sales",
          label: "Sales",
          icon: BadgeDollarSign,
          roles: ["admin", "manager", "cashier"],
        },

        {
          path: "/SalesReturn",
          label: "Sales Return",
          icon: RefreshCcw,
          roles: ["admin", "manager"],
        },
        {
          path: "/Customers",
          label: "Customers",
          icon: User,
          roles: ["admin", "manager"],
        },
      ],
    },
    {
      path: "/purchasing",
      icon: ShoppingCart,
      label: "Purchasing",
      roles: ["admin", "manager"],
      subItems: [
        {
          path: "/purchasing",
          label: "Purchasing",
          icon: ShoppingBasket,
          roles: ["admin", "manager"],
        },
        // { path: "/PurchaseInvoice", label: "Purchasing Invoice", icon: ClipboardPenLine, roles: ['admin', 'manager'] },
        {
          path: "/PurchaseOrder",
          label: "Purchase Order",
          icon: FileText,
          roles: ["admin", "manager"],
        },
        {
          path: "/PurchaseReturn",
          label: "Purchase Return",
          icon: RotateCcw,
          roles: ["admin", "manager"],
        },
      ],
    },
    {
      path: "/outstanding",
      icon: DollarSign,
      label: "Outstanding",
      roles: ["admin", "manager"],
    },
    {
      path: "/ledger",
      icon: BookOpen,
      label: "Ledger",
      roles: ["admin", "manager"],
    },
    {
      path: "/profit",
      icon: FileText,
      label: "Profit",
      roles: ["admin", "manager"],
      subItems: [
        {
          path: "/ItemWiseProfit",
          label: "Item wise Profit",
          icon: TrendingUp,
          roles: ["admin", "manager"],
        },
        {
          path: "/BillWiseProfit",
          label: "Bill Wise Profit",
          icon: Calendar,
          roles: ["admin", "manager"],
        },
        {
          path: "/CustomerWiseProfit",
          label: "Customer Wise Profit",
          icon: Calendar,
          roles: ["admin", "manager"],
        },
        {
          path: "/SupplierWiseProfit",
          label: "Supplier Wise Profit",
          icon: ShoppingCart,
          roles: ["admin", "manager"],
        },
        {
          path: "/StoreAndLocationWiseProfit",
          label: "Store and Location Wise Profit",
          icon: ShoppingCart,
          roles: ["admin", "manager"],
        },
        {
          path: "/CategoryWiseProfit",
          label: "Category Wise Profit",
          icon: ShoppingCart,
          roles: ["admin", "manager"],
        },
      ],
    },
    {
      path: "/report",
      icon: BarChart2,
      label: "Reports",
      roles: ["admin", "manager"],
      subItems: [
        {
          path: "/StockReport",
          label: "Stock Reports",
          icon: BarChart2,
          roles: ["admin", "manager"],
        },
        {
          path: "/ItemWiseStockReport",
          label: "Item Wise Report",
          icon: FileBarChart,
          roles: ["admin", "manager"],
        },
        {
          path: "/StockRecheck",
          label: "Stock Re-Check",
          icon: BarChart2,
          roles: ["admin", "manager"],
        },
      ],
    },
    {
      path: "/production",
      icon: Store,
      label: "Production Management",
      roles: ["admin", "manager"],
      subItems: [{ path: "/Production", label: "Production", icon: Table }],
    },
    {
      path: "/Approvels",
      icon: SettingsIcon,
      label: "Approvels",
      icon: ShieldCheck,
      roles: ["admin"],
    },

    {
      path: "/StockTransfer",
      icon: BaggageClaim,
      label: "StockTransfer",
      roles: ["admin"],
    },

    {
      path: "/DiscountScheam",
      icon: BadgePercent,
      label: "DiscountScheme",
      roles: ["admin"],
    },

    {
      path: "/TaskManager",
      icon: LayoutList,
      label: "Task Management",
      roles: ["admin", "manager"],
      subItems: [
        {
          path: "/HomePage",
          label: "Taskmanager",
          icon: SquareCheckBig,
          roles: ["admin", "manager"],
        },
        {
          path: "/TasksPage",
          label: "Tasks",
          icon: SquareCheckBig,
          roles: ["admin", "manager"],
        },
        {
          path: "/ProjectsPage",
          label: "Projects",
          icon: SquareCheckBig,
          roles: ["admin", "manager"],
        },
        {
          path: "/ReportPage",
          label: "Reports",
          icon: SquareCheckBig,
          roles: ["admin", "manager"],
        },
        {
          path: "/SubtasksPage",
          label: "Sub Tasks",
          icon: SquareCheckBig,
          roles: ["admin", "manager"],
        },
      ],
    },
    {
      path: "/Staff",
      icon: Users,
      label: "Staff Management",
      roles: ["admin"],
      subItems: [
        {
          path: "/StaffManagement",
          label: "Staff Panel",
          icon: BookUser,
          roles: ["admin"],
        },
      ],
    },
    {
      path: "/UserManagement",
      icon: UserRound,
      label: "User Management",
      roles: ["admin"],
      subItems: [
        // { path: "/AdminAccess", label: "Admin Panel", roles: ['admin'] },
        { path: "/RoleList", label: "Roles", icon: Wrench, roles: ["admin"] },
        { path: "/UserList", label: "Users", icon: Users, userlist: ["admin"] },
        {
          path: "/RecycleBin",
          label: "Recycle Bin",
          icon: Trash2,
          recycle: ["admin"],
        },
      ],
    },

    {
      path: "/CreateCompany",
      icon: Castle,
      label: "Company",
      roles: ["admin"],
    },

    { path: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  // Persist collapsed state in localStorage
  useEffect(() => {
    const storedState = localStorage.getItem("isNavVisible");
    if (storedState !== null) setIsNavVisible(JSON.parse(storedState));
  }, []);

  const toggleNav = () => {
    setIsNavVisible((prev) => {
      localStorage.setItem("isNavVisible", !prev);
      return !prev;
    });
  };

  // Expand menus based on active route
  useEffect(() => {
    navItems.forEach((item) => {
      if (
        item.subItems?.some((subItem) =>
          location.pathname.startsWith(subItem.path)
        )
      ) {
        setOpenMenus((prev) => ({ ...prev, [item.path]: true }));
      }
    });
  }, [location.pathname]);

  // Handle menu toggle
  const toggleMenu = (menuPath) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuPath]: !prev[menuPath],
    }));
  };

  // Search functionality
  useEffect(() => {
    if (searchTerm) {
      const filtered = navItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.subItems?.some((subItem) =>
            subItem.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(navItems);
    }
  }, [searchTerm]);

  const itemsToRender = searchTerm ? filteredItems : navItems;

  if (isPosOpen) {
    return null; // Return nothing if POS is open (hide sidebar)
  }

  return (
    <div className="flex ">
      <aside
        className={`sticky ml-2 top-0 h-screen overflow-y-auto dark:bg-gray-800 transition-all duration-300 
          ${isNavVisible ? "w-64" : "w-20"}`}
      >
        <nav className="flex flex-col mt-20 h-100">
          {/* Search Bar */}
          <div className="flex items-center p-1 mt-4 border-b dark:border-gray-700">
            <button
              onClick={toggleNav}
              className="p-2 bg-gray-200 rounded-full text-slate-800 dark:bg-slate-600 hover:bg-amber-600 dark:hover:bg-amber-600"
              title={isNavVisible ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isNavVisible ? <PanelLeftClose size={25} /> : <Menu size={25} />}
            </button>{" "}
            {isNavVisible && (
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded-lg border-amber-600 dark:border-amber-600 dark:bg-gray-700 dark:text-white"
                />
                <Search
                  size={16}
                  className="absolute text-gray-400 right-3 top-3 dark:text-gray-500"
                />
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto">
            {itemsToRender
              .filter((item) => !item.roles || item.roles.includes(user?.role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                const isMenuOpen = openMenus[item.path] || false;

                return (
                  <div key={item.path}>
                    <Link
                      to={item.subItems ? "#" : item.path}
                      onClick={() => item.subItems && toggleMenu(item.path)}
                      className={`hover:bg-amber-600 dark:hover:bg-slate-600 flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-100 ${isActive
                          ? " hover:text-slate-900 text-blue-700  dark:text-amber-600"
                          : "text-gray-700 hover:text-slate-900 dark:text-gray-400 dark:hover:text-cyan-500"
                        }`}
                    >
                      <Icon size={20} />
                      {isNavVisible && (
                        <span className="ml-3">{item.label}</span>
                      )}
                      {item.subItems && isNavVisible && (
                        <span className="ml-auto">
                          {isMenuOpen ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </span>
                      )}
                    </Link>
                    {isMenuOpen &&
                      isNavVisible &&
                      item.subItems
                        ?.filter(
                          (subItem) =>
                            !subItem.roles || subItem.roles.includes(user?.role)
                        )
                        .map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`flex items-center ml-8 p-2 rounded-lg transition-colors duration-200 ${location.pathname === subItem.path
                                ? "bg-amber-500 text-blue-700 dark:bg-blue-800 dark:text-blue-300"
                                : "text-gray-700 hover:bg-amber-500 dark:text-gray-400 dark:hover:bg-gray-700"
                              }`}
                          >
                            {subItem.icon && <subItem.icon size={16} />}
                            <span className="ml-3">{subItem.label}</span>
                          </Link>
                        ))}
                  </div>
                );
              })}
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default SideNav;
