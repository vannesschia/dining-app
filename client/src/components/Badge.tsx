const colorClasses = {
  amber: "bg-amber-50 border-amber-200 text-amber-800",
  neutral: "bg-neutral-50 border-neutral-200 text-neutral-800",
  lime: "bg-lime-50 border-lime-200 text-lime-800",
  blue: "bg-blue-50 border-blue-200 text-blue-800",
  red: "bg-red-50 border-red-200 text-red-800"
} as const

type BadgeColor = keyof typeof colorClasses

interface BadgeProps {
  children: React.ReactNode
  className?: string
  color?: BadgeColor
}

function Badge({
  children,
  className = "",
  color = "amber",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex max-w-full items-center
        py-0.5 px-2 rounded-lg text-fluid-xs font-mono tracking-tight border
        ${colorClasses[color]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export default Badge