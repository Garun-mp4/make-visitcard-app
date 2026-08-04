import type { ImgHTMLAttributes } from 'react'

import { cn, initials } from '@/lib/utils'

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  shape?: 'circle' | 'rounded' | 'square'
}

const sizes = { sm: 'size-10 text-sm', md: 'size-14 text-base', lg: 'size-20 text-2xl' }
const shapes = { circle: 'rounded-full', rounded: 'rounded-2xl', square: 'rounded-md' }

export function Avatar({
  name,
  src,
  size = 'md',
  shape = 'circle',
  className,
  ...props
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={`Фото ${name}`}
        loading="lazy"
        className={cn(
          'object-cover bg-[var(--accent-soft)]',
          sizes[size],
          shapes[shape],
          className,
        )}
        {...props}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={`Инициалы ${name}`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-[var(--accent-soft)] font-medium text-[var(--accent)]',
        sizes[size],
        shapes[shape],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
