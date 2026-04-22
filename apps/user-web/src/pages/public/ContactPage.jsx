import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";

export default function ContactPage() {
    return (
        <div className="mx-auto max-w-7xl my-8 lg:my-10">
            <Card title="Contact Us" className=" mx-auto max-w-3xl">
                <form className="space-y-4">
                    <FormField label="Full Name">
                        <input className="h-12 w-full rounded-lg bg-[#2e3440] px-4 text-white outline-none" />
                    </FormField>
                    <FormField label="Email">
                        <input type="email" className="h-12 w-full rounded-lg bg-[#2e3440] px-4 text-white outline-none" />
                    </FormField>
                    <FormField label="Message">
                        <textarea className="min-h-28 w-full rounded-lg bg-[#2e3440] px-4 py-3 text-white outline-none" />
                    </FormField>
                    <Button type="submit" className="mx-auto block">Submit</Button>
                </form>
            </Card>
        </div>
    );
}
