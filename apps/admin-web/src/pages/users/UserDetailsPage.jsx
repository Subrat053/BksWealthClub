import PageHeader from "../../components/common/PageHeader";



export default function UserDetailsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="User Details" subtitle="Profile review, activation state, and account actions" />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-[#0d1c4b] p-4">
          <h3 className="text-sm font-semibold">Profile Snapshot</h3>
          <p className="mt-3 text-sm text-slate-300">Username: GRW328370</p>
          <p className="text-sm text-slate-300">Sponsor: GRW100001</p>
          <p className="text-sm text-slate-300">Status: Inactive</p>
        </section>
        <section className="rounded-xl border border-white/10 bg-[#0d1c4b] p-4">
          <h3 className="text-sm font-semibold">Actions</h3>
          <div className="mt-3 flex gap-2">
            <button className="rounded-lg bg-[#1fce6d] px-4 py-2 text-xs font-semibold">Approve</button>
            <button className="rounded-lg bg-[#ff2a5f] px-4 py-2 text-xs font-semibold">Reject</button>
            <button className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold">Suspend</button>
          </div>
        </section>
      </div>
    </div>
  );
}
