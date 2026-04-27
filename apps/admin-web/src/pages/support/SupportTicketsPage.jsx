import { useState, useEffect } from "react";
// import PageHeader from "../../components/common/PageHeader";
// import AdminTable from "../../components/common/AdminTable";
// import Drawer from "../../components/common/Drawer";
// import StatusBadge from "../../components/StatusBadge";

import AdminPageHeader from "../../components/layout/AdminPageHeader";

import { supportService } from "../../services/support.service";


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
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
  });

  const loadTickets = async () => {
    const res = await supportService.getAllTickets(filters);
    setTickets(res.data.data);
  };

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const sendReply = async () => {
    if (!reply.trim()) return;

    const res = await supportService.replyTicket(selectedTicket._id, {
      message: reply,
    });

    setSelectedTicket(res.data.data);
    setReply("");
    loadTickets();
  };

  const updateStatus = async (status) => {
    const res = await supportService.updateTicketStatus(
      selectedTicket._id,
      status
    );

    setSelectedTicket(res.data.data);
    loadTickets();
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Support"
        subtitle="Manage customer support tickets, replies, escalation status, and issue tracking."
        primaryActionText="Create Ticket"
        secondaryActionText="Export Tickets"
      />

      {/* <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
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
      </div> */}

      <div className="min-h-screen bg-[#07122d] p-6 text-white">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Support Management</h1>
          <p className="text-slate-300">
            Manage member queries, replies and ticket status.
          </p>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <select
            className="rounded-xl bg-[#03071f] p-3"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>

          <select
            className="rounded-xl bg-[#03071f] p-3"
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
          >
            <option value="">All Priority</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Urgent</option>
          </select>

          <select
            className="rounded-xl bg-[#03071f] p-3"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All Category</option>
            <option>Account</option>
            <option>Payment</option>
            <option>Referral</option>
            <option>Income</option>
            <option>Withdrawal</option>
            <option>Technical</option>
            <option>Other</option>
          </select>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#03071f] p-5">
            <h2 className="mb-4 text-xl font-semibold">All Tickets</h2>

            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full rounded-xl border border-white/10 bg-[#07122d] p-4 text-left hover:border-cyan-300"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{ticket.subject}</h3>
                      <p className="text-sm text-slate-400">
                        {ticket.ticketId} • {ticket.category} • {ticket.priority}
                      </p>
                      <p className="text-sm text-slate-400">
                        User: {ticket.userId?.username || ticket.userId?.name}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                      {ticket.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#03071f] p-5">
            {!selectedTicket ? (
              <p className="text-slate-400">Select a ticket to manage.</p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedTicket.subject}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {selectedTicket.ticketId}
                    </p>
                  </div>

                  <select
                    className="rounded-xl bg-[#07122d] p-3"
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                    <option>Closed</option>
                  </select>
                </div>

                <div className="mb-4 max-h-[430px] space-y-3 overflow-y-auto">
                  {selectedTicket.replies.map((item) => (
                    <div
                      key={item._id}
                      className={`rounded-xl p-3 ${item.senderType === "admin"
                          ? "bg-cyan-400 text-[#03071f]"
                          : "bg-[#07122d] text-white"
                        }`}
                    >
                      <p className="text-sm font-bold">
                        {item.senderType === "admin" ? "Admin" : "User"}
                      </p>
                      <p>{item.message}</p>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== "Closed" && (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl bg-[#07122d] p-3 outline-none"
                      placeholder="Write admin reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />

                    <button
                      onClick={sendReply}
                      className="rounded-xl bg-cyan-400 px-5 font-bold text-[#03071f]"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
