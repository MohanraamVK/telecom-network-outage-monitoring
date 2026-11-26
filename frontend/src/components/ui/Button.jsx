const VARIANTS = {
  primary: "bg-notice text-fjord-950 hover:bg-notice/90 font-semibold",
  secondary: "bg-fjord-800 text-fjord-100 ring-1 ring-inset ring-fjord-700 hover:bg-fjord-700",
  ghost: "text-fjord-300 hover:text-fjord-100 hover:bg-fjord-800",
  danger: "bg-outage/15 text-outage ring-1 ring-inset ring-outage/30 hover:bg-outage/25",
};

const SIZES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

function Button({ variant = "secondary", size = "md", className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors
        disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}

export default Button;
