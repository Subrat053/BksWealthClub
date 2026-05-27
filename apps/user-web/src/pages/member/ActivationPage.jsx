import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";

export default function ActivationPage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Activation" subtitle="Activate your account package through company wallet" />
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#F4B860]/30 bg-[#FFF4E5] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[#E8A13F] font-semibold">Activation Package</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">$ 75</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-rose-600 font-semibold">Status</p>
            <p className="mt-2 text-3xl font-bold text-rose-700">Inactive</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Wallet Balance</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">$ 0</p>
          </div>
        </div>
        <Button className="mt-5">Activate Account</Button>
      </Card>
    </div>
  );
}
