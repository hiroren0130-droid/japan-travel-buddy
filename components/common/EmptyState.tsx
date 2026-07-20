type EmptyStateProps = {
  title: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  title,
  description,
  icon = "🧳",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <div className="mb-4 text-6xl">{icon}</div>

      <h2 className="text-xl font-semibold text-gray-900">
        {title}
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-gray-600">
        {description}
      </p>

      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
}