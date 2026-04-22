import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";

export default function MakeWithdrawalPage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Make Withdrawal" subtitle="Request payout with 2FA verification and wallet security" />
      <Card title="Withdrawal Form">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Amount (USD)">
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Minimum 10"
            />
          </FormField>
          <FormField label="Wallet Address">
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="USDT wallet"
            />
          </FormField>
        </div>
      </Card>

      <Card className="border border-yellow-300/50 shadow-[0_0_20px_rgba(255,221,87,0.25)]" title="Two-Factor Authentication">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm text-slate-300">Scan this QR code with Google Authenticator:</p>
          <div className="mt-3 inline-flex rounded-full border border-yellow-300/40 bg-yellow-300/10 px-4 py-1 text-lg font-semibold text-white">
            E4KMZESWF0QHCG20
          </div>
          <div className="mx-auto mt-5 grid h-56 w-56 place-items-center rounded-2xl border-2 border-pink-400 bg-white/90 text-black">
            QR placeholder
          </div>
          <input
            placeholder="Enter 6-digit code"
            className="mt-6 h-12 w-full rounded-xl border border-pink-500 bg-[#2d3440] px-4 text-center text-white outline-none"
          />
          <Button className="mt-4 w-full" variant="danger">
            Verify and Activate
          </Button>
        </div>
      </Card>
    </div>
  );
}
