import PageHeader from "../../components/common/PageHeader";
import AdminTable from "../../components/common/AdminTable";

const columns = [
  { key: "question", label: "Question" },
  { key: "answer", label: "Answer" },
  { key: "status", label: "Status" },
];

export default function FaqManagerPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="FAQ Manager" subtitle="Create and edit public FAQs" />
      <AdminTable columns={columns} rows={[]} emptyText="No FAQs added" />
    </div>
  );
}
