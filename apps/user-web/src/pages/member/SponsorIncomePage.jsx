import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import { incomeColumns } from "../../config/table.config";

export default function SponsorIncomePage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Sponsor Income" subtitle="Direct referral-based earning records" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Today</p><p className="mt-2 text-2xl font-bold">$ 0</p></Card>
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">This Week</p><p className="mt-2 text-2xl font-bold">$ 0</p></Card>
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">All Time</p><p className="mt-2 text-2xl font-bold">$ 0</p></Card>
      </div>
      <Card>
        <DataTable columns={incomeColumns} rows={[]} emptyText="No sponsor income records" />
      </Card>
    </div>
  );
}
