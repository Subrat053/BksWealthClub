import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";

function TreeNode({ label }) {
  return (
    <div className="rounded-xl border border-cyan-300/40 bg-[linear-gradient(170deg,#132f72,#102567)] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(2,15,54,0.45)]">
      {label}
    </div>
  );
}

export default function AutopoolTreePage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Autopool Community" subtitle="Static mock layout for queue/tree visualization" />
      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-[700px] p-4">
            <div className="flex justify-center">
              <TreeNode label="GRW328370" />
            </div>
            <div className="mx-auto mt-3 h-6 w-px bg-cyan-300" />
            <div className="mx-auto h-px w-48 bg-cyan-300/80" />
            <div className="flex justify-center gap-16">
              <TreeNode label="A1" />
              <TreeNode label="A2" />
            </div>
            <div className="mx-auto mt-3 h-6 w-px bg-cyan-300" />
            <div className="mx-auto h-px w-72 bg-cyan-300/70" />
            <div className="flex justify-center gap-6">
              <TreeNode label="B1" />
              <TreeNode label="B2" />
              <TreeNode label="B3" />
              <TreeNode label="B4" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
