import Card from "../../components/common/Card";

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl my-8 lg:my-10">
    <Card title="Services">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white/5 p-4">Direct Sponsorship Tracking</div>
        <div className="rounded-xl bg-white/5 p-4">Autopool Participation</div>
        <div className="rounded-xl bg-white/5 p-4">Member Wallet Management</div>
      </div>
    </Card>
    </div>
  );
}
