export default function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <div className="mb-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#F4B860] to-[#E8A13F]" />

      <h1 className="text-3xl font-bold leading-none text-[#111827] md:text-4xl">
        {title}
      </h1>

      {subtitle ? (
        <p className="mt-2 text-sm text-[#6B7280]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}