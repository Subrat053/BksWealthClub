import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";

export default function ContactPage() {
  return (
    <div className="mx-auto my-8 max-w-7xl px-4 lg:my-10">
      <Card
        title="Contact Us"
        className="mx-auto max-w-3xl border border-[#E5E7EB] bg-white shadow-sm"
      >
        <form className="space-y-5">
          <FormField label="Full Name">
            <input
              className="
                h-12
                w-full
                rounded-xl
                border
                border-[#E5E7EB]
                bg-white
                px-4
                text-[#111827]
                placeholder:text-[#9CA3AF]
                outline-none
                transition-all
                duration-300
                focus:border-[#F4B860]
                focus:ring-4
                focus:ring-[#F4B860]/20
              "
              placeholder="Enter your full name"
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              className="
                h-12
                w-full
                rounded-xl
                border
                border-[#E5E7EB]
                bg-white
                px-4
                text-[#111827]
                placeholder:text-[#9CA3AF]
                outline-none
                transition-all
                duration-300
                focus:border-[#F4B860]
                focus:ring-4
                focus:ring-[#F4B860]/20
              "
              placeholder="Enter your email"
            />
          </FormField>

          <FormField label="Message">
            <textarea
              className="
                min-h-32
                w-full
                rounded-xl
                border
                border-[#E5E7EB]
                bg-white
                px-4
                py-3
                text-[#111827]
                placeholder:text-[#9CA3AF]
                outline-none
                transition-all
                duration-300
                focus:border-[#F4B860]
                focus:ring-4
                focus:ring-[#F4B860]/20
              "
              placeholder="Write your message..."
            />
          </FormField>

          <Button
            type="submit"
            variant="secondary"
            className="mx-auto block"
          >
            Submit
          </Button>
        </form>
      </Card>
    </div>
  );
}