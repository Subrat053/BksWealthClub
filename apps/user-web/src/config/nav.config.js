import {
  ArrowDownToLine,
  BadgeDollarSign,
  GitBranch,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Power,
  User,
  Users,
} from "lucide-react";

export const memberNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/member/dashboard" },
  { label: "My Account", icon: User, path: "/member/account" },
  {
    label: "Team",
    icon: Users,
    children: [
      { label: "Direct", path: "/member/team/direct" },
      { label: "Generation", path: "/member/team/generation" },
      { label: "Autopool", path: "/member/team/autopool" },
    ],
  },
  { label: "Deposit", icon: Landmark, path: "/member/deposit" },
  { label: "Activation", icon: Power, path: "/member/activation" },
  {
    label: "Withdrawal",
    icon: ArrowDownToLine,
    children: [
      { label: "Make Withdrawal", path: "/member/withdrawal/make" },
      { label: "Withdrawal History", path: "/member/withdrawal/history" },
    ],
  },
  {
    label: "Incomes",
    icon: BadgeDollarSign,
    children: [
      { label: "Sponsor Income", path: "/member/income/sponsor" },
      { label: "Representative Income", path: "/member/income/representative" },
    ],
  },
  { label: "Support", icon: LifeBuoy, path: "/member/support" },
  { label: "Logout", icon: GitBranch, path: "/logout" },
];
