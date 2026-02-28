import React, { useState, useEffect, useRef } from 'react';

interface Option {
    value: number | string;
    label: string;
}

interface SearchableDropdownProps {
    options: Option[];
    value: number | string;
    onChange: (value: number | string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Pilih...',
    className = '',
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: number | string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`searchable-dropdown ${className}`} ref={wrapperRef} style={{ position: 'relative' }}>
            <div
                className={`form-select ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <span style={{ fontSize: '0.8em', marginLeft: '8px' }}>▼</span>
            </div>

            {isOpen && (
                <div className="dropdown-menu" style={{
                    position: 'absolute',
                    top: '-200px',
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    color: 'var(--text-primary)',
                    height: '200px'
                }}>
                    <div className="p-2 border-bottom" style={{ borderBottom: '1px solid var(--border)' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Cari..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', padding: '4px 8px' }}
                        />
                    </div>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className="dropdown-item"
                                onClick={() => handleSelect(option.value)}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: option.value === value ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    borderBottom: '1px solid var(--border)',
                                    color: 'var(--text-primary)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = option.value === value ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Pilihan tidak ditemukan</div>
                    )}
                </div>
            )}
        </div>
    );
};
