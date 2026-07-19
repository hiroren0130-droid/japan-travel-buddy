import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  subtitle?: string;
};

export default function SectionTitle({
  children,
  subtitle,
}: Props) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold text-gray-900">
        {children}
      </h2>

      {subtitle && (
        <p className="mt-1 text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}