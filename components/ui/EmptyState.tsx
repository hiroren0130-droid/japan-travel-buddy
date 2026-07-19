import { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
};

export default function EmptyState({
  icon = "🧳",
  title,
  description,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
      <div className="mb-4 text-5xl">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}