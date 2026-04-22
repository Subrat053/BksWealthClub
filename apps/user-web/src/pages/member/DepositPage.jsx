import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";

export default function DepositPage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Deposit" subtitle="Submit wallet deposit request for account funding" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Min Activation</p><p className="mt-2 text-2xl font-bold">$ 75</p></Card>
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Pending Requests</p><p className="mt-2 text-2xl font-bold">0</p></Card>
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Approved</p><p className="mt-2 text-2xl font-bold">0</p></Card>
      </div>
      <Card title="Deposit Request">
        <form className="grid gap-4 md:grid-cols-2">
          <FormField label="Amount (USD)">
            <input className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70" placeholder="75" />
          </FormField>
          <FormField label="Transaction Hash">
            <input className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70" placeholder="0x..." />
          </FormField>
          <FormField label="Wallet Type">
            <select className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70">
              <option>USDT (TRC20)</option>
              <option>USDT (BEP20)</option>
            </select>
          </FormField>
          <FormField label="Proof Upload (placeholder)">
            <input type="file" className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 py-3 text-white outline-none" />
          </FormField>
          <div className="md:col-span-2">
            <Button type="submit">Submit Deposit</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
