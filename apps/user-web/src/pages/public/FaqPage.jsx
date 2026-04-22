import Card from "../../components/common/Card";

const faqs = [
    { q: "How do I join?", a: "Register using a sponsor ID or referral link." },
    { q: "How much is activation?", a: "The current package target is 75 USD." },
    { q: "Can rules change?", a: "Yes, all core business rules are kept configurable." },
];

export default function FaqPage() {
    return (
        <div className="mx-auto max-w-7xl my-8 lg:my-10">
            <Card title="Frequently Asked Questions">
                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div key={faq.q} className="rounded-xl bg-white/5 p-4">
                            <h3 className="font-semibold">{faq.q}</h3>
                            <p className="mt-1 text-sm text-slate-300">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
