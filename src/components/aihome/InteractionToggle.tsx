'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HandRaisedIcon } from '@heroicons/react/24/outline';

interface InteractionToggleProps {
    isEnabled: boolean;
    onToggle: () => void;
    isLoading?: boolean;
}

export default function InteractionToggle({ isEnabled, onToggle, isLoading }: InteractionToggleProps) {
    return (
        <motion.button
            onClick={onToggle}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
                relative w-10 h-10 rounded-full shadow-md flex items-center justify-center 
                transition-all duration-300 cursor-pointer border border-white/20
                ${isEnabled
                    ? 'bg-[#A7C7E7] hover:bg-[#8FB8E0]' // Same blue as home button when active
                    : 'bg-[#E0E0E0] hover:bg-[#D0D0D0]' // Soft gray when inactive
                }
                ${isLoading ? 'opacity-60' : ''}
            `}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
                <HandRaisedIcon className={`w-5 h-5 transition-colors duration-300 ${isEnabled ? 'text-white' : 'text-[#8A8A8A]'
                    }`} />
            )}

            {/* Active indicator dot */}
            {isEnabled && !isLoading && (
                <motion.div
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#34C759] rounded-full border-2 border-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                />
            )}
        </motion.button>
    );
}
