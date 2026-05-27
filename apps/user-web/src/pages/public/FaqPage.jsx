import Card from "../../components/common/Card";

const faqs = [
  { q: "How do I join?", a: "Register using a sponsor ID or referral link." },
  { q: "How much is activation?", a: "The current package target is 75 USD." },
  { q: "Can rules change?", a: "Yes, all core business rules are kept configurable." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto my-8 max-w-7xl px-4 lg:my-10">
      <Card
        title="Frequently Asked Questions"
        className="border border-[#E5E7EB] bg-white shadow-sm"
      >
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.q}
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
              <h3 className="font-semibold text-[#111827]">
                {faq.q}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}