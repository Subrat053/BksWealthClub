import { useState } from "react";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";
import { supportColumns } from "../../config/table.config";

export default function SupportPage() {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setError("");
    setForm({ subject: "", message: "" });
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Support" />
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
      </Card>
    </div>
  );
}
