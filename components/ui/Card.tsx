import {
  KeyboardEvent,
  ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export default function Card({
  children,
  className = "",
  onClick,
}: Props) {
  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (!onClick) return;

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onClick();
    }
  };

  const interactiveClasses = onClick
    ? `
      cursor-pointer
      hover:-translate-y-1
      hover:border-slate-300
      hover:shadow-lg
      focus:outline-none
      focus-visible:ring-2
      focus-visible:ring-blue-500
      focus-visible:ring-offset-2
      active:translate-y-0
    `
    : "";

  return (
    <div
      onClick={onClick}
      onKeyDown={
        onClick
          ? handleKeyDown
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-300
        ${interactiveClasses}
        ${className}
      `}
    >
      {children}
    </div>
  );
}