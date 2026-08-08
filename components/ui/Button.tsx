"use client";

import {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { LoaderCircle } from "lucide-react";

type Props =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    loading?: boolean;
    variant?:
      | "primary"
      | "secondary"
      | "danger";
    size?: "default" | "icon";
  };

export default function Button({
  children,
  loading = false,
  variant = "primary",
  size = "default",
  className = "",
  disabled,
  type = "button",
  ...props
}: Props) {
  const variants = {
    primary: `
      border
      border-blue-600
      bg-blue-600
      text-white
      shadow-sm
      shadow-blue-600/20
      hover:-translate-y-0.5
      hover:border-blue-700
      hover:bg-blue-700
      hover:shadow-md
      hover:shadow-blue-600/25
      active:translate-y-0
    `,

    secondary: `
      border
      border-slate-200
      bg-white
      text-slate-700
      shadow-sm
      hover:-translate-y-0.5
      hover:border-slate-300
      hover:bg-slate-50
      hover:text-slate-900
      hover:shadow-md
      active:translate-y-0
    `,

    danger: `
      border
      border-red-600
      bg-red-600
      text-white
      shadow-sm
      shadow-red-600/20
      hover:-translate-y-0.5
      hover:border-red-700
      hover:bg-red-700
      hover:shadow-md
      hover:shadow-red-600/25
      active:translate-y-0
    `,
  };

  const sizes = {
    default: `
      min-h-11
      rounded-xl
      px-5
      py-2.5
      text-sm
    `,

    icon: `
      h-12
      w-12
      shrink-0
      rounded-2xl
      p-0
    `,
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        whitespace-nowrap
        font-semibold
        transition-all
        duration-300
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-500
        focus-visible:ring-offset-2
        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading && (
        <LoaderCircle
          size={17}
          strokeWidth={2.2}
          className="shrink-0 animate-spin"
          aria-hidden="true"
        />
      )}

      {children}
    </button>
  );
}