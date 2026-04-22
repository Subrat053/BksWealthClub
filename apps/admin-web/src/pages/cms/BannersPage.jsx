import PageHeader from "../../components/common/PageHeader";

export default function BannersPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Banner Manager" subtitle="Upload or replace hero and campaign banners" />
      <section className="rounded-xl border border-white/10 bg-[#0d1c4b] p-4">
        <input type="file" className="h-11 w-full rounded-lg bg-[#2d3440] px-4 py-2 text-sm outline-none" />
        <button className="mt-3 rounded-lg bg-gradient-to-r from-[#3f63db] to-[#33c0d7] px-4 py-2 text-sm font-semibold">Upload Placeholder</button>
      </section>
    </div>
  );
}
