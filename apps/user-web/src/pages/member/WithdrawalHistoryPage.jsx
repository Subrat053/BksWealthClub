import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import { withdrawalColumns } from "../../config/table.config";

export default function WithdrawalHistoryPage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Withdrawal History" subtitle="Track payout requests, charges, and status updates" />
      <Card title="Withdrawal Report">
        <DataTable columns={withdrawalColumns} rows={[]} emptyText="No Data Found" />
      </Card>
    </div>
  );
}
