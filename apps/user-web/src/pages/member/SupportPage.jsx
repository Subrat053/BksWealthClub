import { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";
import { supportColumns } from "../../config/table.config";

import { supportService } from "../../services/support.service";
export default function SupportPage() {
  // const [form, setForm] = useState({ subject: "", message: "" });
  // const [error, setError] = useState("");

  // const handleSubmit = (event) => {
  //   event.preventDefault();
  //   if (!form.subject.trim() || !form.message.trim()) {
  //     setError("Subject and message are required.");
  //     return;
  //   }
  //   setError("");
  //   setForm({ subject: "", message: "" });
  // };

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");

  const [form, setForm] = useState({
    subject: "",
    category: "Other",
    priority: "Medium",
    message: "",
  });

  const loadTickets = async () => {
    try {
      const res = await supportService.getMyTickets();
      setTickets(res.data || []);
    } catch (error) {
      console.error(error);
      setTickets([]);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const createTicket = async (e) => {
    e.preventDefault();

    try {
      await supportService.createTicket(form);

      setForm({
        subject: "",
        category: "Other",
        priority: "Medium",
        message: "",
      });

      loadTickets();
    } catch (error) {
      console.error(error);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;

    try {
      const res = await supportService.replyTicket(selectedTicket._id, {
        message: reply,
      });

      setSelectedTicket(res.data);
      setReply("");
      loadTickets();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* <SectionTitle title="Support" />
      <Card title="Support Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Subject">
            <input
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
            />
          </FormField>
          <FormField label="Message">
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              className="min-h-28 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 py-3 text-white outline-none focus:border-cyan-300/70"
            />
          </FormField>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" variant="danger">
            Submit
          </Button>
        </form>
      </Card>

      <Card title="Your Support History">
        <DataTable columns={supportColumns} rows={[]} emptyText="No support requests found." />
      </Card> */}

      {/* <div className="min-h-screen bg-[#07122d] p-6 text-white"> */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#111827]">Support Center</h1>
          <p className="text-[#6B7280] mt-1 text-sm">
            Raise your query and track support replies.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={createTicket}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <h2 className="mb-4 text-lg font-bold text-[#111827]">Create Ticket</h2>

            <div className="space-y-4">
              <div>
                <input
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl h-11 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-all duration-300 outline-none px-4 focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Category
                </label>
                <select
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl h-11 text-sm text-[#111827] transition-all duration-300 outline-none px-4 focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>Account</option>
                  <option>Payment</option>
                  <option>Referral</option>
                  <option>Income</option>
                  <option>Withdrawal</option>
                  <option>Technical</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Priority Level
                </label>
                <select
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl h-11 text-sm text-[#111827] transition-all duration-300 outline-none px-4 focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>

              <div>
                <textarea
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-all duration-300 outline-none focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20"
                  rows="4"
                  placeholder="Describe your issue..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <button className="w-full rounded-xl bg-[#111827] text-white hover:bg-[#1F2937] py-3 text-sm font-semibold transition-all duration-300 active:scale-[0.98] shadow-sm hover:scale-[1.01]">
                Submit Ticket
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="mb-4 text-lg font-bold text-[#111827]">My Tickets</h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {tickets.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] py-4 text-center">No tickets found.</p>
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
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-sm text-[#111827] truncate">{ticket.subject}</h3>
                        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          ticket.status?.toLowerCase() === "open"
                            ? "bg-emerald-50 text-[#10B981] border border-[#10B981]/20"
                            : "bg-gray-50 text-[#6B7280] border border-[#E5E7EB]"
                        }`}>
                          {ticket.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-[#6B7280]">
                        ID: <span className="font-mono text-[#111827] font-semibold">{ticket.ticketId}</span> • {ticket.category} • <span className="font-medium text-[#F59E0B]">{ticket.priority}</span>
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="mb-4 text-lg font-bold text-[#111827]">Conversation</h2>

            {!selectedTicket ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-[#9CA3AF]">Select a ticket to view replies and start messaging.</p>
              </div>
            ) : (
              <div className="flex flex-col h-[500px]">
                <div className="border-b border-[#E5E7EB] pb-3 mb-4 shrink-0">
                  <h3 className="font-bold text-sm text-[#111827] truncate">{selectedTicket.subject}</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">Ticket ID: {selectedTicket.ticketId}</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                  {selectedTicket.replies?.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF] text-center py-4">No replies yet.</p>
                  ) : (
                    selectedTicket.replies?.map((item) => (
                      <div
                        key={item._id}
                        className={`rounded-xl p-3 border max-w-[85%] ${
                          item.senderType === "user"
                            ? "bg-[#FFF4E5] border-[#F4B860]/20 text-[#111827] ml-auto"
                            : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827]"
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] mb-0.5">
                          {item.senderType === "user" ? "You" : "Admin"}
                        </p>
                        <p className="text-sm leading-relaxed text-[#374151] whitespace-pre-wrap">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {selectedTicket.status !== "Closed" && (
                  <div className="flex gap-2 border-t border-[#E5E7EB] pt-4 shrink-0">
                    <input
                      className="flex-1 bg-white border border-[#E5E7EB] rounded-xl h-11 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-all duration-300 outline-none px-4 focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20"
                      placeholder="Type reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />

                    <button
                      onClick={sendReply}
                      className="rounded-xl bg-[#111827] text-white hover:bg-[#1F2937] px-5 font-semibold text-sm transition-all duration-300 active:scale-[0.98] shadow-sm hover:scale-[1.02]"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      {/* </div> */}
    </div>
  );
}
