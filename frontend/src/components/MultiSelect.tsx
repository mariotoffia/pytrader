import { useState, useMemo } from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Multi-select dropdown component for selecting multiple values with search
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  label,
  disabled = false,
}: MultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }
    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    // Select all filtered options
    const allFilteredValues = filteredOptions.map((opt) => opt.value);
    const newSelected = [...new Set([...selected, ...allFilteredValues])];
    onChange(newSelected);
  };

  const handleClearAll = () => {
    // Clear all filtered options
    const filteredValues = new Set(filteredOptions.map((opt) => opt.value));
    const newSelected = selected.filter((v) => !filteredValues.has(v));
    onChange(newSelected);
  };

  return (
    <div className="multi-select">
      {label && <label className="multi-select-label">{label}</label>}

      <div className="multi-select-search">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="search-input"
        />
      </div>

      <div className="multi-select-actions">
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled || filteredOptions.length === 0}
          className="btn-link"
        >
          Select All {filteredOptions.length !== options.length && `(${filteredOptions.length})`}
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={
            disabled ||
            filteredOptions.length === 0 ||
            !filteredOptions.some((opt) => selected.includes(opt.value))
          }
          className="btn-link"
        >
          Clear All
        </button>
        <span className="selected-count">
          {selected.length} of {options.length} selected
        </span>
      </div>

      <div className="multi-select-options">
        {filteredOptions.length === 0 ? (
          <div className="no-results">No options found</div>
        ) : (
          filteredOptions.map((option) => (
            <label key={option.value} className="multi-select-option">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                disabled={disabled}
              />
              <span>{option.label}</span>
            </label>
          ))
        )}
      </div>

      <style>{`
        .multi-select {
          margin-bottom: 1rem;
        }

        .multi-select-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .multi-select-search {
          margin-bottom: 0.5rem;
        }

        .search-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #374151;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .multi-select-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .selected-count {
          margin-left: auto;
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .btn-link {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0;
          text-decoration: underline;
        }

        .btn-link:hover:not(:disabled) {
          color: #2563eb;
        }

        .btn-link:disabled {
          color: #9ca3af;
          cursor: not-allowed;
          text-decoration: none;
        }

        .multi-select-options {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.75rem;
          max-height: 200px;
          overflow-y: auto;
          background-color: #ffffff;
        }

        .no-results {
          padding: 1rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .multi-select-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0;
          cursor: pointer;
          user-select: none;
        }

        .multi-select-option:hover {
          background-color: #f3f4f6;
        }

        .multi-select-option input[type="checkbox"] {
          cursor: pointer;
        }

        .multi-select-option input[type="checkbox"]:disabled {
          cursor: not-allowed;
        }

        .multi-select-option span {
          flex: 1;
          color: #374151;
        }
      `}</style>
    </div>
  );
}
