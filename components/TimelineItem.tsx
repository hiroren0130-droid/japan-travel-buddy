type Props = {
  time?: string;
  title: string;
  description?: string;
};

export default function TimelineItem({
  time,
  title,
  description,
}: Props) {
  return (
    <div className="relative border-l-4 border-blue-500 pl-6">

      <div className="absolute -left-[11px] top-2 h-4 w-4 rounded-full bg-blue-600" />

      {time && (
        <p className="text-sm font-semibold text-blue-600">
          {time}
        </p>
      )}

      <h3 className="text-lg font-bold">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
}