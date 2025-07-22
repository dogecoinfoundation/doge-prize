interface InputGroupProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

export function InputGroup({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  className = ''
}: InputGroupProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-white">
          {label}
        </label>
      )}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg blur opacity-0 
                      group-hover:opacity-20 transition duration-200" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="relative w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200 outline-none
                   placeholder-gray-400 dark:placeholder-gray-500
                   hover:border-blue-500/50 dark:hover:border-blue-400/50"
        />
      </div>
    </div>
  );
} 