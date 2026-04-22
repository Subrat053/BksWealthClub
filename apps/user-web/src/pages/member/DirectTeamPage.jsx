import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import { directTeamColumns } from "../../config/table.config";

export default function DirectTeamPage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Direct Team" />
      <Card title="Filter">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className="h-12 rounded-xl border border-white/10 bg-[#2d3440] px-4 text-sm text-white outline-none focus:border-cyan-300/70" placeholder="Name" />
          <input className="h-12 rounded-xl border border-white/10 bg-[#2d3440] px-4 text-sm text-white outline-none focus:border-cyan-300/70" placeholder="Username" />
          <select className="h-12 rounded-xl border border-white/10 bg-[#2d3440] px-4 text-sm text-white outline-none focus:border-cyan-300/70">
            <option>Select Status</option>
          </select>
          <Button className="w-full">Search</Button>
        </div>
      </Card>
      <Card>
        <DataTable columns={directTeamColumns} rows={[]} emptyText="No Directs Found" />
      </Card>
    </div>
  );
}
