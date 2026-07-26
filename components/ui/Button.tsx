"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "default" | "icon";
};

export default function Button({
  children,
  loading = false,
  variant = "primary",
  size = "default",
  className = "",
  disabled,
  ...props
}: Props) {
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    default: "px-5 py-2.5 text-sm",
    icon: "h-11 w-11 p-0",
  };

  return (
    <button
  type={props.type ?? "button"}
  {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        font-semibold
        transition-all
        duration-200
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading && (
        <svg
  className="h-4 w-4 animate-spin"
  aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            opacity=".25"
          />

          <path
            d="M22 12A10 10 0 0012 2"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      )}

      {children}
    </button>
  );
}