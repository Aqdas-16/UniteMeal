import { Sun } from "lucide-react"

export function ThemeToggle({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={`inline-flex h-9 w-9 items-center justify-center text-slate-600 ${
        className ?? ""
      }`}
      aria-hidden="true"
    >
      <Sun className="h-5 w-5" />
    </div>
  )
}