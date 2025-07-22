interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false
}: ButtonProps) {
  const baseStyles = `
    relative px-4 py-2.5 rounded-lg font-medium transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
    before:absolute before:inset-0 before:rounded-lg before:transition-all before:duration-200
    hover:before:scale-105 active:before:scale-100
    before:opacity-0 hover:before:opacity-100
    before:bg-gradient-to-r
  `;
  
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-blue-500 to-blue-600 text-white
      before:from-blue-600 before:to-blue-700
      shadow-sm hover:shadow-md active:shadow-sm
      disabled:before:hidden
    `,
    secondary: `
      bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800
      dark:from-gray-700 dark:to-gray-800 dark:text-white
      before:from-gray-200 before:to-gray-300
      dark:before:from-gray-600 dark:before:to-gray-700
      shadow-sm hover:shadow-md active:shadow-sm
      disabled:before:hidden
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white
      before:from-red-600 before:to-red-700
      shadow-sm hover:shadow-md active:shadow-sm
      disabled:before:hidden
    `
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <span className="relative">{children}</span>
    </button>
  );
} 