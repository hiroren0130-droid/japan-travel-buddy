type Props = {
  title: string;
  children: React.ReactNode;
};

export default function DaySection({
  title,
  children,
}: Props) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-blue-700">
        📅 {title}
      </h2>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}