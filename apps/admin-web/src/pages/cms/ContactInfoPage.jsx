import PageHeader from "../../components/common/PageHeader";

export default function ContactInfoPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Contact Info Manager" subtitle="Update support email, phone, and office details" />
      <section className="grid gap-3 rounded-xl border border-white/10 bg-[#0d1c4b] p-4 md:grid-cols-2">
        <input className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none" placeholder="Support Email" />
        <input className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none" placeholder="Phone Number" />
        <input className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none md:col-span-2" placeholder="Office Address" />
        <button className="h-11 rounded-lg bg-gradient-to-r from-[#3f63db] to-[#33c0d7] text-sm font-semibold md:col-span-2">Save Contact Info</button>
      </section>
    </div>
  );
}
