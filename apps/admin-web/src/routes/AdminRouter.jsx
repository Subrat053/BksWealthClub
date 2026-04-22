import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLoginPage from "../pages/auth/AdminLoginPage";
import AdminLayout from "../components/layout/AdminLayout";
import AdminProtectedRoute from "./AdminProtectedRoute";
import AdminDashboardPage from "../pages/dashboard/AdminDashboardPage";
import UserListPage from "../pages/users/UserListPage";
import UserDetailsPage from "../pages/users/UserDetailsPage";
import TeamTreePage from "../pages/team/TeamTreePage";
import AutopoolManagerPage from "../pages/team/AutopoolManagerPage";
import DepositRequestsPage from "../pages/deposits/DepositRequestsPage";
import WithdrawalRequestsPage from "../pages/withdrawals/WithdrawalRequestsPage";
import IncomeLogsPage from "../pages/income/IncomeLogsPage";
import IncomeRulesPage from "../pages/income/IncomeRulesPage";
import SupportTicketsPage from "../pages/support/SupportTicketsPage";
import WebsiteContentPage from "../pages/cms/WebsiteContentPage";
import BannersPage from "../pages/cms/BannersPage";
import FaqManagerPage from "../pages/cms/FaqManagerPage";
import ContactInfoPage from "../pages/cms/ContactInfoPage";
import GeneralSettingsPage from "../pages/settings/GeneralSettingsPage";
import PaymentWalletSettingsPage from "../pages/settings/PaymentWalletSettingsPage";
import SecuritySettingsPage from "../pages/settings/SecuritySettingsPage";

export const adminRouter = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <AdminLoginPage /> },
  {
    element: <AdminProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboardPage /> },
          { path: "users", element: <UserListPage /> },
          { path: "users/:id", element: <UserDetailsPage /> },
          { path: "team/referrals", element: <TeamTreePage /> },
          { path: "team/autopool", element: <AutopoolManagerPage /> },
          { path: "deposits", element: <DepositRequestsPage /> },
          { path: "withdrawals", element: <WithdrawalRequestsPage /> },
          { path: "income/logs", element: <IncomeLogsPage /> },
          { path: "income/rules", element: <IncomeRulesPage /> },
          { path: "support", element: <SupportTicketsPage /> },
          { path: "cms/site", element: <WebsiteContentPage /> },
          { path: "cms/banners", element: <BannersPage /> },
          { path: "cms/faq", element: <FaqManagerPage /> },
          { path: "cms/contact", element: <ContactInfoPage /> },
          { path: "settings/general", element: <GeneralSettingsPage /> },
          { path: "settings/wallet", element: <PaymentWalletSettingsPage /> },
          { path: "settings/security", element: <SecuritySettingsPage /> },
        ],
      },
    ],
  },
]);
