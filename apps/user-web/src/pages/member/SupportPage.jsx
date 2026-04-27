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
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-slate-300">
            Raise your query and track support replies.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={createTicket}
            className="rounded-2xl border border-white/10 bg-[#03071f] p-5"
          >
            <h2 className="mb-4 text-xl font-semibold">Create Ticket</h2>

            <input
              className="mb-3 w-full rounded-xl bg-[#07122d] p-3 outline-none"
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Category
            </label>

            <select
              className="mb-3 w-full rounded-xl bg-[#07122d] p-3 outline-none"
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

            <label className="mb-2 block text-sm font-medium text-slate-300">
              Priority Level
            </label>

            <select
              className="mb-3 w-full rounded-xl bg-[#07122d] p-3 outline-none"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>

            <textarea
              className="mb-3 w-full rounded-xl bg-[#07122d] p-3 outline-none"
              rows="5"
              placeholder="Describe your issue"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />

            <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-[#03071f]">
              Submit Ticket
            </button>
          </form>

          <div className="rounded-2xl border border-white/10 bg-[#03071f] p-5">
            <h2 className="mb-4 text-xl font-semibold">My Tickets</h2>

            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full rounded-xl border border-white/10 bg-[#07122d] p-4 text-left hover:border-cyan-300"
                >
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{ticket.subject}</h3>
                    <span className="text-xs text-cyan-300">
                      {ticket.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    {ticket.ticketId} • {ticket.category} • {ticket.priority}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#03071f] p-5">
            <h2 className="mb-4 text-xl font-semibold">Conversation</h2>

            {!selectedTicket ? (
              <p className="text-slate-400">Select a ticket to view replies.</p>
            ) : (
              <>
                <h3 className="mb-3 font-bold">{selectedTicket.subject}</h3>

                <div className="mb-4 max-h-[400px] space-y-3 overflow-y-auto">
                  {selectedTicket.replies.map((item) => (
                    <div
                      key={item._id}
                      className={`rounded-xl p-3 ${item.senderType === "user"
                        ? "bg-cyan-400 text-[#03071f]"
                        : "bg-[#07122d] text-white"
                        }`}
                    >
                      <p className="text-sm font-bold">
                        {item.senderType === "user" ? "You" : "Admin"}
                      </p>
                      <p>{item.message}</p>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== "Closed" && (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl bg-[#07122d] p-3 outline-none"
                      placeholder="Type reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />

                    <button
                      onClick={sendReply}
                      className="rounded-xl bg-cyan-400 px-5 font-bold text-[#03071f]"
                    >
                      Send
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      {/* </div> */}
    </div>
  );
}
