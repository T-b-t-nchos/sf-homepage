import React from "react";
import { Link } from "react-router-dom";


type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
    variant?: Variant;
    size?: Size;
    href?: string;
    to?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
};

const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";

const sizeStyles: Record<Size, string> = {
    sm: "px-3 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-4 text-base",
};

const styles: Record<Variant, string> = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900",
    secondary:
        "bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 focus:ring-gray-900",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-900",
};

export default function Button({
    variant = "primary",
    size = "md",
    href,
    to,
    onClick,
    type = "button",
    disabled = false,
    children,
    className: extraClassName = "",
}: Props) {
    const className = [
        base,
        sizeStyles[size],
        styles[variant],
        disabled ? "opacity-60 cursor-not-allowed" : "",
        extraClassName,
    ]
        .filter(Boolean)
        .join(" ");

    // Internal navigation using React Router
    if (to) {
        return (
            <Link className={className} to={to}>
                {children}
            </Link>
        );
    }

    // External link
    if (href) {
        return (
            <a className={className} href={href} target="_blank" rel="noreferrer">
                {children}
            </a>
        );
    }

    return (
        <button type={type} className={className} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
}
