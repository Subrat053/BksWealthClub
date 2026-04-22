import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import AdminTable from "../../components/common/AdminTable";
import Drawer from "../../components/common/Drawer";


import AdminPageHeader from "../../components/layout/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";

const tickets = [
  {
    id: "SUP001",
    username: "john_smith",
    subject: "Unable to withdraw funds",
    category: "Withdrawal",
    priority: "High",
    status: "pending",
    updatedAt: "2026-04-22",
  },
  {
    id: "SUP002",
    username: "priya_dev",
    subject: "Referral income not updated",
    category: "Income",
    priority: "Medium",
    status: "active",
    updatedAt: "2026-04-21",
  },
  {
    id: "SUP003",
    username: "alex_roy",
    subject: "Profile KYC verification issue",
    category: "KYC",
    priority: "Low",
    status: "closed",
    updatedAt: "2026-04-20",
  },
];


const columns = [
  { key: "ticketId", label: "Ticket ID" },
  { key: "username", label: "Username" },
  { key: "subject", label: "Subject" },
  { key: "status", label: "Status" },
];

export default function SupportTicketsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Support"
        subtitle="Manage customer support tickets, replies, escalation status, and issue tracking."
        primaryActionText="Create Ticket"
        secondaryActionText="Export Tickets"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-lg font-semibold text-white">Ticket Overview</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4">
              <p className="text-sm text-blue-100/70">Open Tickets</p>
              <h3 className="mt-2 text-3xl font-bold text-white">18</h3>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4">
              <p className="text-sm text-blue-100/70">Resolved Today</p>
              <h3 className="mt-2 text-3xl font-bold text-white">7</h3>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4">
              <p className="text-sm text-blue-100/70">High Priority</p>
              <h3 className="mt-2 text-3xl font-bold text-white">5</h3>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4">
              <p className="text-sm text-blue-100/70">Avg. Response</p>
              <h3 className="mt-2 text-3xl font-bold text-white">2.4h</h3>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="mb-5 text-lg font-semibold text-white">Recent Tickets</h2>

          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{ticket.subject}</h3>
                    <p className="mt-1 text-sm text-blue-100/70">
                      {ticket.username} · {ticket.category} · {ticket.updatedAt}
                    </p>
                    <p className="mt-2 text-xs text-blue-100/60">Priority: {ticket.priority}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                    Open
                  </button>
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                    Reply
                  </button>
                  <button className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20">
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
