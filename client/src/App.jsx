import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './components/ProtectedRoute';
import SecurityDisclosure from './components/SecurityDisclosure';

// Public Pages
import Home from './pages/public/Home';
import Products from './pages/public/Products';
import Manufacturing from './pages/public/Manufacturing';
import Certifications from './pages/public/Certifications';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Careers from './pages/public/Careers';
import NotFound from './pages/public/NotFound';

// Auth
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Client Portal
import ClientLayout from './layouts/ClientLayout';
import ClientDashboard from './pages/client/Dashboard';
import ClientProjects from './pages/client/Projects';
import ClientOrders from './pages/client/Orders';
import ClientInvoices from './pages/client/Invoices';
import ClientTickets from './pages/client/Tickets';
import ClientDocuments from './pages/client/Documents';
import ClientSupport from './pages/client/Support';
import ClientProfile from './pages/client/Profile';
import ClientScheduler from './pages/client/Scheduler';
import ClientReports from './pages/client/Reports';
import ClientCatalogue from './pages/client/Catalogue';
import ClientPlaceOrder from './pages/client/PlaceOrder';
import ClientOrderDetail from './pages/client/OrderDetail';
import ClientWarranty from './pages/client/Warranty';
import ClientProcessTracker from './pages/client/ProcessTracker';

// Employee Portal
import EmployeeLayout from './layouts/EmployeeLayout';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeTasks from './pages/employee/Tasks';
import EmployeeBatches from './pages/employee/Batches';
import EmployeeBatchDetail from './pages/employee/BatchDetail';
import EmployeeLeave from './pages/employee/Leave';
import EmployeeSchedule from './pages/employee/Schedule';
import EmployeeTimesheet from './pages/employee/Timesheet';
import EmployeeProjects from './pages/employee/Projects';
import EmployeePayslips from './pages/employee/Payslips';
import EmployeeExpenses from './pages/employee/Expenses';
import EmployeeTraining from './pages/employee/Training';
import EmployeePerformance from './pages/employee/Performance';
import EmployeeChat from './pages/employee/Chat';
import EmployeeProfile from './pages/employee/Profile';
import EmployeeIssues from './pages/employee/Issues';

// Manager Portal
import ManagerLayout from './layouts/ManagerLayout';
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerEmployees from './pages/manager/Employees';
import ManagerTasks from './pages/manager/Tasks';
import ManagerProjects from './pages/manager/Projects.jsx';
import ManagerApprovals from './pages/manager/Approvals.jsx';
import ManagerPerformance from './pages/manager/Performance.jsx';
import ManagerTraining from './pages/manager/Training.jsx';
import ManagerProfile from './pages/manager/Profile';
import ManagerIncidents from './pages/manager/Incidents.jsx';

// Admin Portal
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminTasks from './pages/admin/Tasks';
import AdminBatches from './pages/admin/Batches';
import AdminInventory from './pages/admin/Inventory';
import AdminWarranty from './pages/admin/Warranty';
import AdminLeaves from './pages/admin/Leaves';
import AdminCatalogue from './pages/admin/Catalogue';
import AdminEmployees from './pages/admin/Employees';
import AdminBilling from './pages/admin/Billing';
import AdminAudit from './pages/admin/Audit';
import AdminSettings from './pages/admin/Settings';
import AdminBackup from './pages/admin/Backup';
import AdminProfile from './pages/admin/Profile';
import AdminDepartments from './pages/admin/Departments';
import AdminProcessFlow from './pages/admin/ProcessFlow';
import AdminKPIs from './pages/admin/KPIs';
import AdminIncidents from './pages/admin/Incidents';

// Admin Analytics Pages
import AnalyticsHub from './pages/admin/analytics/AnalyticsHub';
import ClientAcquisition from './pages/admin/analytics/ClientAcquisition';
import OrderFulfillment from './pages/admin/analytics/OrderFulfillment';
import EmployeeProductivity from './pages/admin/analytics/EmployeeProductivity';
import RevenueAnalytics from './pages/admin/analytics/RevenueAnalytics';
import InventoryTurnover from './pages/admin/analytics/InventoryTurnover';
import ReportBuilder from './pages/admin/analytics/ReportBuilder';
import ScheduledReports from './pages/admin/analytics/ScheduledReports';
import AlertsCenter from './pages/admin/analytics/AlertsCenter';

// EV Battery Manufacturing Dashboard pages
import EvDashboard from './pages/admin/ev/EvDashboard';
import Production from './pages/admin/ev/Production';
import CellManufacturing from './pages/admin/ev/CellManufacturing';
import Traceability from './pages/admin/ev/Traceability';
import QualityControl from './pages/admin/ev/QualityControl';
import TestingLab from './pages/admin/ev/TestingLab';
import BmsAnalytics from './pages/admin/ev/BmsAnalytics';
import EvInventory from './pages/admin/ev/EvInventory';
import SupplyChain from './pages/admin/ev/SupplyChain';
import PredictiveMaintenance from './pages/admin/ev/PredictiveMaintenance';
import Sustainability from './pages/admin/ev/Sustainability';
import FinanceAnalytics from './pages/admin/ev/FinanceAnalytics';
import Compliance from './pages/admin/ev/Compliance';
import AiInsights from './pages/admin/ev/AiInsights';
import RolesPermissions from './pages/admin/ev/RolesPermissions';

// Finance Dashboard (shared across all roles)
import FinanceDashboard from './pages/finance/FinanceDashboard';

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/manufacturing" element={<Manufacturing />} />
            <Route path="/certifications" element={<Certifications />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Client Portal */}
            <Route path="/client" element={
              <ProtectedRoute role="client"><ClientLayout /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="process-tracker" element={<ClientProcessTracker />} />
              <Route path="projects" element={<ClientProjects />} />
              <Route path="orders" element={<ClientOrders />} />
              <Route path="invoices" element={<ClientInvoices />} />
              <Route path="tickets" element={<ClientTickets />} />
              <Route path="documents" element={<ClientDocuments />} />
              <Route path="support" element={<ClientSupport />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="scheduler" element={<ClientScheduler />} />
              <Route path="reports" element={<ClientReports />} />
              <Route path="catalogue" element={<ClientCatalogue />} />
              <Route path="orders/new" element={<ClientPlaceOrder />} />
              <Route path="orders/:id" element={<ClientOrderDetail />} />
              <Route path="warranty" element={<ClientWarranty />} />
              <Route path="finance" element={<FinanceDashboard />} />
            </Route>

            {/* Employee Portal */}
            <Route path="/employee" element={
              <ProtectedRoute role="employee"><EmployeeLayout /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="tasks" element={<EmployeeTasks />} />
              <Route path="batches" element={<EmployeeBatches />} />
              <Route path="batches/:id" element={<EmployeeBatchDetail />} />
              <Route path="schedule" element={<EmployeeSchedule />} />
              <Route path="leave" element={<EmployeeLeave />} />
              <Route path="timesheet" element={<EmployeeTimesheet />} />
              <Route path="projects" element={<EmployeeProjects />} />
              <Route path="payslips" element={<EmployeePayslips />} />
              <Route path="expenses" element={<EmployeeExpenses />} />
              <Route path="training" element={<EmployeeTraining />} />
              <Route path="performance" element={<EmployeePerformance />} />
              <Route path="issues" element={<EmployeeIssues />} />
              <Route path="chat" element={<EmployeeChat />} />
              <Route path="profile" element={<EmployeeProfile />} />
              <Route path="finance" element={<FinanceDashboard />} />
            </Route>

            {/* Manager Portal */}
            <Route path="/manager" element={
              <ProtectedRoute role="manager"><ManagerLayout /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="projects" element={<ManagerProjects />} />
              <Route path="employees" element={<ManagerEmployees />} />
              <Route path="tasks" element={<ManagerTasks />} />
              <Route path="approvals" element={<ManagerApprovals />} />
              <Route path="performance" element={<ManagerPerformance />} />
              <Route path="training" element={<ManagerTraining />} />
              <Route path="incidents" element={<ManagerIncidents />} />
              <Route path="profile" element={<ManagerProfile />} />
              <Route path="finance" element={<FinanceDashboard />} />
            </Route>

            {/* Admin Portal */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="process-flow" element={<AdminProcessFlow />} />
              <Route path="kpis" element={<AdminKPIs />} />
              <Route path="incidents" element={<AdminIncidents />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="tasks" element={<AdminTasks />} />
              <Route path="batches" element={<AdminBatches />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="warranty" element={<AdminWarranty />} />
              <Route path="leaves" element={<AdminLeaves />} />
              <Route path="catalogue" element={<AdminCatalogue />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="billing" element={<AdminBilling />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="backup" element={<AdminBackup />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="finance" element={<FinanceDashboard />} />

              {/* EV Battery Dashboard Routes */}
              <Route path="ev-dashboard" element={<EvDashboard />} />
              <Route path="ev-dashboard/production" element={<Production />} />
              <Route path="ev-dashboard/cell-manufacturing" element={<CellManufacturing />} />
              <Route path="ev-dashboard/traceability" element={<Traceability />} />
              <Route path="ev-dashboard/quality" element={<QualityControl />} />
              <Route path="ev-dashboard/testing" element={<TestingLab />} />
              <Route path="ev-dashboard/bms" element={<BmsAnalytics />} />
              <Route path="ev-dashboard/inventory" element={<EvInventory />} />
              <Route path="ev-dashboard/supply-chain" element={<SupplyChain />} />
              <Route path="ev-dashboard/maintenance" element={<PredictiveMaintenance />} />
              <Route path="ev-dashboard/sustainability" element={<Sustainability />} />
              <Route path="ev-dashboard/finance" element={<FinanceAnalytics />} />
              <Route path="ev-dashboard/compliance" element={<Compliance />} />
              <Route path="ev-dashboard/ai-insights" element={<AiInsights />} />
              <Route path="ev-dashboard/roles-permissions" element={<RolesPermissions />} />

              {/* Analytics & Intelligence Routes */}
              <Route path="analytics" element={<AnalyticsHub />} />
              <Route path="analytics/clients" element={<ClientAcquisition />} />
              <Route path="analytics/fulfillment" element={<OrderFulfillment />} />
              <Route path="analytics/productivity" element={<EmployeeProductivity />} />
              <Route path="analytics/revenue" element={<RevenueAnalytics />} />
              <Route path="analytics/inventory" element={<InventoryTurnover />} />
              <Route path="analytics/reports" element={<ReportBuilder />} />
              <Route path="analytics/schedules" element={<ScheduledReports />} />
              <Route path="analytics/alerts" element={<AlertsCenter />} />
            </Route>

            {/* Fallback */}
          </Routes>
          <SecurityDisclosure />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}
