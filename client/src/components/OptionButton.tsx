import { useState, useRef, useEffect } from "react"

interface OptionButtonProps {
  children: React.ReactNode,
  className?: string
  
}
// hover:border-amber-200 hover:bg-conic-[from_270deg,rgba(232, 236, 248,1)_0%,rgba(232, 236, 248,0.50)_50%,rgba(232, 236, 248,0)_75%,rgba(232, 236, 248,1)_100%] hover:text-amber-800 transition-all ease-in-out
function OptionButton({children, className = ""}: OptionButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return(
    <div ref={ref} className="relative">
      <div>
        <div
          className={`
            w-full overflow-hidden rounded-lg border border-neutral-400 text-center
            px-4 py-8 font-bold
            transition-[opacity,transform] duration-100
            ${open ? "opacity-0 pointer-events-none" : "opacity-100"}
            bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%] ${className}
            ${className}
          `}
          onClick={() => (setOpen(!open))}
          aria-expanded={open}
        >
          {children}
        </div>

        <div
          className={`absolute inset-0 transition-[opacity,transform] duration-100
            ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <div className="grid grid-cols-3 grid-rows-1 gap-1 h-full">
            <button
              className="rounded-lg border border-neutral-400 hover:bg-neutral-50 font-bold text-sm bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]"
              onClick={() => {
                setOpen(false);
              }}
            >
              Breakfast
            </button>
            <button
              className="rounded-lg border border-neutral-400 hover:bg-neutral-50 font-bold text-sm bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]"
              onClick={() => {
                setOpen(false);
              }}
            >
              Lunch
            </button>
            <button
              className="rounded-lg border border-neutral-400 hover:bg-neutral-50 font-bold text-sm bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]"
              onClick={() => {
                setOpen(false);
              }}
            >
              Dinner
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptionButton