import { useEffect, useRef, useState } from 'react';

export interface MultiSelectOption {
  value: number;
  label: string;
  hint?: string;
  group?: string;
}

interface Props {
  label: string;
  options: MultiSelectOption[];
  selected: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  showGroups?: boolean;
  allowAll?: boolean;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
  showGroups = false,
  allowAll = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedSet = new Set(selected);
  const activeLabels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label);

  const filtered = options.filter(
    (o) => !query || o.label.toLowerCase().includes(query.toLowerCase()),
  );

  const toggle = (value: number) => {
    if (selectedSet.has(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const grouped = new Map<string | null, MultiSelectOption[]>();
  for (const option of filtered) {
    const key = showGroups ? (option.group ?? null) : null;
    const list = grouped.get(key) ?? [];
    list.push(option);
    grouped.set(key, list);
  }

  const summary = activeLabels.length
    ? activeLabels.slice(0, 2).join(', ') + (activeLabels.length > 2 ? ` +${activeLabels.length - 2}` : '')
    : placeholder ?? 'Все';

  return (
    <div className={`multiselect ${open ? 'open' : ''}`} ref={ref}>
      <button type="button" className="multiselect-trigger" onClick={() => setOpen(!open)}>
        <span className="multiselect-label">{label}:</span>
        <span className="multiselect-value">{summary}</span>
        <span className="multiselect-chevron">▼</span>
      </button>

      {open && (
        <div className="multiselect-menu">
          <input
            autoFocus
            className="multiselect-search"
            placeholder="Поиск…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {allowAll && (
            <label className="multiselect-option">
              <input
                type="checkbox"
                checked={selected.length === 0}
                onChange={() => onChange([])}
              />
              <span>Все</span>
            </label>
          )}
          {filtered.length === 0 && <div className="multiselect-empty">Ничего не найдено</div>}
          {Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group ?? '__none'}>
              {group && <div className="multiselect-group-label">{group}</div>}
              {items.map((option) => (
                <label key={option.value} className="multiselect-option">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(option.value)}
                    onChange={() => toggle(option.value)}
                  />
                  <span>{option.label}</span>
                  {option.hint && <span className="ms-count">{option.hint}</span>}
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
