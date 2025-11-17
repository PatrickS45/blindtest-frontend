import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'small' | 'medium' | 'large' | 'xl'
  icon?: React.ReactNode
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'medium',
      icon,
      loading = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base styles
          'font-display font-semibold rounded-2xl transition-all duration-200',
          'inline-flex items-center justify-center gap-2',
          'focus:outline-none focus:ring-4 focus:ring-primary/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95',

          // Variants
          {
            'bg-gradient-to-br from-primary to-primary-dark text-white shadow-glow hover:shadow-glow-lg':
              variant === 'primary',
            'bg-bg-card text-text-primary border-2 border-primary hover:bg-primary/10':
              variant === 'secondary',
            'bg-error text-white hover:bg-error/90':
              variant === 'danger',
            'bg-success text-white hover:bg-success/90':
              variant === 'success',
            'bg-transparent text-text-primary hover:bg-white/5':
              variant === 'ghost',
          },

          // Sizes
          {
            'px-4 py-2 text-sm': size === 'small',
            'px-6 py-3 text-base': size === 'medium',
            'px-8 py-4 text-lg': size === 'large',
            'px-12 py-6 text-2xl': size === 'xl',
          },

          className
        )}
        {...props}
      >
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <>
            {icon && <span>{icon}</span>}
            {children}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
