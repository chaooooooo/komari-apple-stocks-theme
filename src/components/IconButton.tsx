import type { ReactNode } from 'react'

type IconButtonProps = {
  title: string
  children: ReactNode
}

export function IconButton({ title, children }: IconButtonProps) {
  return (
    <button
      title={title}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] text-zinc-300 shadow-lg shadow-black/20 transition hover:bg-white/[0.09] hover:text-white"
    >
      {children}
    </button>
  )
}
