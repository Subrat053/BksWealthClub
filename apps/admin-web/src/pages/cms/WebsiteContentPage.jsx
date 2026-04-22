import PageHeader from "../../components/common/PageHeader";


import AdminPageHeader from "../../components/layout/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";
import { cmsSections } from "../../config/data";

export default function WebsiteContentPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="CMS"
        subtitle="Edit website banners, sections, text blocks, and static content."
        primaryActionText="Save Changes"
        secondaryActionText="Preview"
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-lg font-semibold text-white">Edit Section</h2>

          <div className="mt-5 grid gap-4">
            <select className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none">
              <option>Select Section</option>
              <option>Hero Banner</option>
              <option>About</option>
              <option>Testimonials</option>
            </select>

            <input
              type="text"
              placeholder="Section Title"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />

            <textarea
              rows="6"
              placeholder="Section Description"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />

            <input
              type="text"
              placeholder="Image URL"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />

            <div className="flex gap-3">
              <button className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2944a8]">
                Update Section
              </button>
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-blue-50 hover:bg-white/10">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="mb-5 text-lg font-semibold text-white">Existing Sections</h2>

          <div className="space-y-4">
            {cmsSections.map((item) => (
              <div
                key={item.id}
                className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{item.sectionName}</h3>
                    <p className="mt-1 text-sm text-blue-100/75">{item.title}</p>
                    <p className="mt-2 text-sm text-blue-100/65">{item.description}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                    Edit
                  </button>
                  <button className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
