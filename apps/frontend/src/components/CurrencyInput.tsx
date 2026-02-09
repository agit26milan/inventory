import React, { useState, useEffect } from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number;
    onChange: (value: number) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Format number to currency display
    const formatCurrency = (num: number): string => {
        if (num === 0) return '';
        return new Intl.NumberFormat('id-ID').format(num);
    };

    // Parse currency string to number
    const parseCurrency = (str: string): number => {
        const cleaned = str.replace(/\D/g, '');
        return parseInt(cleaned) || 0;
    };

    // Update display value when prop value changes
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(formatCurrency(value));
        }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const numericValue = parseCurrency(inputValue);
        
        // Update display with formatted value
        setDisplayValue(formatCurrency(numericValue));
        
        // Call parent onChange with numeric value
        onChange(numericValue);
    };

    const handleFocus = () => {
        setIsFocused(true);
        // Show raw number when focused for easier editing
        if (value === 0) {
            setDisplayValue('');
        } else {
            setDisplayValue(formatCurrency(value));
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Format on blur
        setDisplayValue(formatCurrency(value));
    };

    return (
        <div style={{ position: 'relative' }}>
            <span
                style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#888',
                    pointerEvents: 'none',
                    fontSize: '0.95rem',
                }}
            >
                Rp
            </span>
            <input
                {...props}
                type="text"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{
                    paddingLeft: '38px',
                    ...props.style,
                }}
            />
        </div>
    );
};
