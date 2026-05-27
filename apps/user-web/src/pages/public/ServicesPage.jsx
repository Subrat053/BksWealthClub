import Card from "../../components/common/Card";
import Button from "../../components/common/Button";

const services = [
  {
    title: "Direct Sponsorship Tracking",
    description:
      "Monitor direct referrals, sponsor relationships, team performance, and growth statistics in real time.",
  },
  {
    title: "Autopool Participation",
    description:
      "Track rebirth entries, queue movements, autopool completions, and level progression seamlessly.",
  },
  {
    title: "Member Wallet Management",
    description:
      "Manage wallet balances, withdrawals, transfers, transaction history, and income tracking securely.",
  },
  {
    title: "Team Analytics",
    description:
      "View detailed analytics of network growth, active members, level reports, and performance insights.",
  },
  {
    title: "Reward & Achievement System",
    description:
      "Access achiever rewards, milestone bonuses, leadership recognition, and business incentive programs.",
  },
  {
    title: "Secure Account Access",
    description:
      "Advanced account protection with secure authentication, verification flows, and role-based access.",
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto my-8 max-w-7xl px-4 lg:my-10">
      <Card
        title="Services"
        className="border border-[#E5E7EB] bg-white shadow-sm"
      >
        <div className="mb-6">
          <p className="max-w-3xl text-sm leading-relaxed text-[#6B7280]">
            Explore our premium business and community management services
            designed to simplify network operations, improve engagement, and
            support scalable growth for all members.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
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
                Premium Service
              </div>

              <h3 className="text-lg font-semibold text-[#111827]">
                {service.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                {service.description}
              </p>

              <div className="mt-5">
                <Button variant="secondary">
                  Learn More
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}