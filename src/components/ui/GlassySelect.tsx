'use client';

import { ChevronDown } from 'lucide-react';
import React, { SelectHTMLAttributes, forwardRef } from 'react';

interface GlassySelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    containerClassName?: string;
    options: { label: string; value: string; disabled?: boolean }[];
    placeholder?: string;
}

export const GlassySelect = forwardRef<HTMLSelectElement, GlassySelectProps>(
    ({ className = '', containerClassName = '', options, placeholder, ...props }, ref) => {
        return (
            <div className={`relative ${containerClassName}`}>
                <select
                    ref={ref}
                    className={`
            w-full appearance-none
            bg-white/40 hover:bg-white/60
            backdrop-blur-md
            border border-white/50
            text-[#4B4036] font-medium text-sm
            py-2 pl-3 pr-8
            rounded-xl
            shadow-[0_4px_14px_0_rgba(0,0,0,0.05)]
            focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 focus:border-[#FFB6C1]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            cursor-pointer
            truncate
            ${className}
          `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled className="bg-white/80 backdrop-blur-md">
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className="bg-white text-[#4B4036]"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#8F7A65]">
                    <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                </div>
            </div>
        );
    }
);

GlassySelect.displayName = 'GlassySelect';
