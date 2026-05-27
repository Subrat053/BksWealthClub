import Card from "../../components/common/Card";
import Button from "../../components/common/Button";

const projects = [
  {
    title: "Global Expansion Campaign",
    status: "Active",
    description:
      "Expanding the community network across multiple regions with structured onboarding and sponsor-driven growth.",
  },
  {
    title: "Autopool Growth Initiative",
    status: "Ongoing",
    description:
      "Focused on improving rebirth queue participation and increasing pool completion efficiency.",
  },
  {
    title: "Leadership Reward Program",
    status: "Upcoming",
    description:
      "A premium achievers program designed for top-performing members and community leaders.",
  },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto my-8 max-w-7xl px-4 lg:my-10">
      <Card
        title="Projects"
        className="border border-[#E5E7EB] bg-white shadow-sm"
      >
        <div className="mb-6">
          <p className="max-w-3xl text-sm leading-relaxed text-[#6B7280]">
            Explore ongoing community campaigns, autopool initiatives, leadership
            programs, and upcoming business development activities designed to
            strengthen network growth and member participation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.title}
              className="
                rounded-2xl
                border
                border-[#E5E7EB]
                bg-white
                p-5
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-[2px]
                hover:border-[#F4B860]/40
                hover:bg-[#FFF4E5]
                hover:shadow-md
              "
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#111827]">
                  {project.title}
                </h3>

                <span
                  className="
                    rounded-full
                    bg-[#FFF4E5]
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-[#E8A13F]
                  "
                >
                  {project.status}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-[#6B7280]">
                {project.description}
              </p>

              <div className="mt-5">
                <Button variant="secondary">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}