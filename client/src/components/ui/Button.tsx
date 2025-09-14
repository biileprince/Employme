import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) => {
  // Base styles
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  // Size styles
  const sizeStyles = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
  };
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-border bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent',
    ghost: 'bg-transparent hover:bg-muted hover:text-foreground',
  };
  
  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // Loading and disabled styles
  const stateStyles = (isLoading || disabled) ? 'opacity-70 cursor-not-allowed' : '';
  
  const buttonClasses = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    widthStyle,
    stateStyles,
    className
  ].join(' ');
  
  return (
    <button
      className={buttonClasses}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="wave-loader">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
