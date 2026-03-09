import React, { useState, useEffect } from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number;
    onChange: (value: number) => void;
    /** Jika true, user dapat menginput nilai negatif. Default: false */
    allowNegative?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, allowNegative = false, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Format number ke tampilan mata uang
    const formatCurrency = (num: number): string => {
        if (num === 0) return '';
        const isNegative = num < 0;
        const formatted = new Intl.NumberFormat('id-ID').format(Math.abs(num));
        return isNegative ? `-${formatted}` : formatted;
    };

    // Parse string input ke number; mendukung tanda minus di depan jika allowNegative aktif
    const parseCurrency = (str: string): number => {
        if (allowNegative) {
            const isNegative = str.startsWith('-');
            // Hapus semua karakter selain digit
            const cleaned = str.replace(/\D/g, '');
            const parsed = parseInt(cleaned) || 0;
            return isNegative ? -parsed : parsed;
        }
        // Mode normal: hanya izinkan digit positif
        const cleaned = str.replace(/\D/g, '');
        return parseInt(cleaned) || 0;
    };

    // Update display saat prop value berubah dari luar
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(formatCurrency(value));
        }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Izinkan user mengetik tanda minus di awal jika allowNegative aktif,
        // tanpa langsung memformat agar tidak memotong input yang sedang diketik
        if (allowNegative && inputValue === '-') {
            setDisplayValue('-');
            onChange(0);
            return;
        }

        const numericValue = parseCurrency(inputValue);
        setDisplayValue(formatCurrency(numericValue));
        onChange(numericValue);
    };

    const handleFocus = () => {
        setIsFocused(true);
        // Tampilkan nilai mentah saat fokus agar lebih mudah diedit
        if (value === 0) {
            setDisplayValue('');
        } else {
            setDisplayValue(formatCurrency(value));
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Format ulang saat blur
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
