import type { InputHTMLAttributes, ReactNode } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
}

export function Checkbox({
  label,
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={checkboxId}
        className={`
          w-4 h-4 text-primary-600 border-gray-300 rounded
          focus:ring-primary-500 focus:ring-2
          ${className}
        `}
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          className="ml-2 text-sm text-gray-700 cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  )
}

