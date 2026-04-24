import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import PublicLayout from "../layouts/PublicLayout";
import MemberLayout from "../components/layout/MemberLayout";
import HomePage from "../pages/public/HomePage";
import AboutPage from "../pages/public/AboutPage";
import ServicesPage from "../pages/public/ServicesPage";
import ProjectsPage from "../pages/public/ProjectsPage";
import FaqPage from "../pages/public/FaqPage";
import ContactPage from "../pages/public/ContactPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import VerifyEmailPage from "../pages/public/VerifyEmailPage";
import DashboardPage from "../pages/member/DashboardPage";
import ProfilePage from "../pages/member/ProfilePage";
import AddUserPage from "../pages/member/AddUserPage";
import DepositPage from "../pages/member/DepositPage";
import ActivationPage from "../pages/member/ActivationPage";
import DirectTeamPage from "../pages/member/DirectTeamPage";
import GenerationTeamPage from "../pages/member/GenerationTeamPage";
import AutopoolTreePage from "../pages/member/AutopoolTreePage";
import SponsorIncomePage from "../pages/member/SponsorIncomePage";
import RepresentativeIncomePage from "../pages/member/RepresentativeIncomePage";
import MakeWithdrawalPage from "../pages/member/MakeWithdrawalPage";
import WithdrawalHistoryPage from "../pages/member/WithdrawalHistoryPage";
import SupportPage from "../pages/member/SupportPage";

function LogoutPage() {
  return <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/",
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "about", element: <AboutPage /> },
          { path: "services", element: <ServicesPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "faq", element: <FaqPage /> },
          { path: "contact", element: <ContactPage /> },
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
          { path: "verify-email", element: <VerifyEmailPage /> },
        ],
      },
      { path: "/logout", element: <LogoutPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/member",
        element: <MemberLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "account", element: <ProfilePage /> },
          { path: "add-user", element: <AddUserPage /> },
          { path: "deposit", element: <DepositPage /> },
          { path: "activation", element: <ActivationPage /> },
          { path: "team/direct", element: <DirectTeamPage /> },
          { path: "team/generation", element: <GenerationTeamPage /> },
          { path: "team/autopool", element: <AutopoolTreePage /> },
          { path: "income/sponsor", element: <SponsorIncomePage /> },
          { path: "income/representative", element: <RepresentativeIncomePage /> },
          { path: "withdrawal/make", element: <MakeWithdrawalPage /> },
          { path: "withdrawal/history", element: <WithdrawalHistoryPage /> },
          { path: "support", element: <SupportPage /> },
        ],
      },
    ],
  },
]);
