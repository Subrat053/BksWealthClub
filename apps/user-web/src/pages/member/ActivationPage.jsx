import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";

export default function ActivationPage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Activation" subtitle="Activate your account package through company wallet" />
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-100">Activation Package</p>
            <p className="mt-2 text-3xl font-bold">$ 75</p>
          </div>
          <div className="rounded-xl border border-red-300/25 bg-red-300/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-red-100">Status</p>
            <p className="mt-2 text-3xl font-bold">Inactive</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-200">Wallet Balance</p>
            <p className="mt-2 text-3xl font-bold">$ 0</p>
          </div>
        </div>
        <Button className="mt-5">Activate Account</Button>
      </Card>
    </div>
  );
}
