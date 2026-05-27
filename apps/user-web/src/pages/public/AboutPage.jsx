import Card from "../../components/common/Card";
import Button from "../../components/common/Button";

const highlights = [
  {
    title: "Community-Driven Growth",
    description:
      "Built with a referral-first approach that encourages teamwork, community expansion, and structured member participation.",
  },
  {
    title: "Smart Autopool System",
    description:
      "Advanced autopool participation designed for scalable queue management, rebirth flow, and transparent progression.",
  },
  {
    title: "Secure Wallet Management",
    description:
      "Integrated wallet tracking for withdrawals, transfers, income visibility, and financial activity management.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto my-8 max-w-7xl px-4 lg:my-10">
      <Card
        title="About BksWealthClub"
        className="border border-[#E5E7EB] bg-white shadow-sm"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Content */}
          <div>
            <div
              className="
                mb-4
                inline-flex
                rounded-xl
                bg-[#FFF4E5]
                px-3
                py-1
                text-xs
                font-semibold
                text-[#E8A13F]
              "
            >
              Premium Community Platform
            </div>

            <h2 className="text-3xl font-bold leading-tight text-[#111827]">
              Empowering Growth Through Smart Community Networking
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#6B7280]">
              BksWealthClub is a modern referral-first autopool platform
              designed to simplify community growth, automate participation
              systems, and provide transparent financial tracking for members.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">
              The platform combines structured onboarding, autopool management,
              reward distribution, wallet operations, and growth analytics into
              one unified ecosystem prepared for scalable backend integration.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary">
                Explore Features
              </Button>

              <Button variant="outline">
                Learn More
              </Button>
            </div>
          </div>

          {/* Right Highlights */}
          <div className="space-y-4">
            {highlights.map((item) => (
              <div
                key={item.title}
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
                  hover:border-[#F4B860]/50
                  hover:bg-[#FFF4E5]
                  hover:shadow-md
                "
              >
                <h3 className="text-lg font-semibold text-[#111827]">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}