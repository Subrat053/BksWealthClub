import PageHeader from "../../components/common/PageHeader";

export default function PaymentWalletSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Wallet / Payment Settings" subtitle="Configure company wallet addresses and chain support" />
      <section className="grid gap-3 rounded-xl border border-white/10 bg-[#0d1c4b] p-4 md:grid-cols-2">
        <input className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none" placeholder="USDT TRC20 Wallet" />
        <input className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none" placeholder="USDT BEP20 Wallet" />
        <input className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none md:col-span-2" placeholder="Withdrawal Fee %" />
        <button className="h-11 rounded-lg bg-gradient-to-r from-[#3f63db] to-[#33c0d7] text-sm font-semibold md:col-span-2">Save Wallet Settings</button>
      </section>
    </div>
  );
}
