import { useState, useEffect } from "react";
// import PageHeader from "../../components/common/PageHeader";
// import AdminTable from "../../components/common/AdminTable";
// import Drawer from "../../components/common/Drawer";
// import StatusBadge from "../../components/StatusBadge";

import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { supportService } from "../../services/support.service";
import DownloadReportButton from "../../components/common/DownloadReportButton";


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

      <div className="space-y-6">
        <AdminPageHeader
          title="Support Management"
          subtitle="Track and resolve member technical issues."
        >
          <DownloadReportButton
            data={tickets}
            fileName="support-tickets-report"
            sheetName="Tickets"
            columns={[
              { header: "Ticket ID", key: "ticketId" },
              { header: "User Member ID", key: "userId.memberId" },
              { header: "User Name", key: "userId.name" },
              { header: "User Username", key: "userId.username" },
              { header: "Subject", key: "subject" },
              { header: "Category", key: "category" },
              { header: "Priority", key: "priority" },
              { header: "Status", key: "status" },
              { header: "Date", key: "createdAt", format: "date" },
            ]}
          />
        </AdminPageHeader>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <select
            className="rounded-xl border border-[#E5E7EB] bg-white text-[#111827] p-3 outline-none focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20 transition-all"
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
            className="rounded-xl border border-[#E5E7EB] bg-white text-[#111827] p-3 outline-none focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20 transition-all"
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
            className="rounded-xl border border-[#E5E7EB] bg-white text-[#111827] p-3 outline-none focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20 transition-all"
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
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md transition-all">
            <h2 className="mb-4 text-lg font-bold text-[#111827]">All Tickets</h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {tickets.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] py-4 text-center">No support tickets found.</p>
              ) : (
                tickets.map((ticket) => {
                  const isSelected = selectedTicket?._id === ticket._id;
                  return (
                    <button
                      key={ticket._id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full rounded-xl border p-4 text-left transition-all duration-300 ${
                        isSelected
                          ? "border-[#F4B860] bg-[#FFF4E5]"
                          : "border-[#E5E7EB] bg-white hover:border-[#F4B860]/50 hover:bg-[#FFF4E5]/30"
                      }`}
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-sm text-[#111827]">{ticket.subject}</h3>
                          <p className="text-xs text-[#6B7280] mt-1.5">
                            ID: <span className="font-mono text-[#111827] font-semibold">{ticket.ticketId}</span> • {ticket.category} • <span className="text-[#F59E0B] font-medium">{ticket.priority}</span>
                          </p>
                          <p className="text-xs text-[#6B7280] mt-1">
                            User: <span className="font-medium text-[#111827]">{ticket.userId?.username || ticket.userId?.name || "Member"}</span>
                          </p>
                        </div>

                        <span className={`h-fit rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          ticket.status?.toLowerCase() === "open"
                            ? "bg-emerald-50 text-[#10B981] border border-[#10B981]/20"
                            : "bg-gray-50 text-[#6B7280] border border-[#E5E7EB]"
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md transition-all">
            {!selectedTicket ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <p className="text-sm text-[#9CA3AF]">Select a ticket from the left panel to manage.</p>
              </div>
            ) : (
              <div className="flex flex-col h-[500px]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-[#111827]">
                      {selectedTicket.subject}
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Ticket ID: {selectedTicket.ticketId}
                    </p>
                  </div>

                  <select
                    className="rounded-xl border border-[#E5E7EB] bg-white text-[#111827] p-2 text-xs font-medium outline-none focus:border-[#F4B860]"
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                    <option>Closed</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                  {selectedTicket.replies?.map((item) => (
                    <div
                      key={item._id}
                      className={`rounded-xl p-3 border max-w-[85%] ${
                        item.senderType === "admin"
                          ? "bg-[#FFF4E5] border-[#F4B860]/20 text-[#111827] ml-auto"
                          : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]"
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] mb-0.5">
                        {item.senderType === "admin" ? "Admin" : "User"}
                      </p>
                      <p className="text-sm leading-relaxed text-[#374151] whitespace-pre-wrap">{item.message}</p>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== "Closed" && (
                  <div className="flex gap-2 border-t border-[#E5E7EB] pt-4 shrink-0">
                    <input
                      className="flex-1 bg-white border border-[#E5E7EB] rounded-xl h-11 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-all outline-none px-4 focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20"
                      placeholder="Write admin reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />

                    <button
                      onClick={sendReply}
                      className="rounded-xl bg-[#111827] text-white hover:bg-[#1F2937] px-5 font-semibold text-sm transition-all duration-300 active:scale-[0.98] shadow-sm hover:scale-[1.02]"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
