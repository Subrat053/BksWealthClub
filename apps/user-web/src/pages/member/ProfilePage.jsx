import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="My Account" subtitle="Manage personal and wallet profile details" />
      <Card>
        <form className="grid gap-4 md:grid-cols-2">
          <FormField label="Full Name">
            <input defaultValue="Demo Member" className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70" />
          </FormField>
          <FormField label="Email">
            <input defaultValue="member@example.com" className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70" />
          </FormField>
          <FormField label="Phone">
            <input defaultValue="+91-0000000000" className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70" />
          </FormField>
          <FormField label="USDT Wallet">
            <input defaultValue="T..." className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70" />
          </FormField>
          <div className="md:col-span-2">
            <Button type="submit">Update Profile</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
