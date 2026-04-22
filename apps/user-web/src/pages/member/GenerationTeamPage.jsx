import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import { directTeamColumns } from "../../config/table.config";

export default function GenerationTeamPage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Generation Team" subtitle="Multi-level referral network overview" />
      <Card>
        <DataTable columns={directTeamColumns} rows={[]} emptyText="No Generation Data Found" />
      </Card>
    </div>
  );
}
