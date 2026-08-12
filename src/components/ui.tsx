/** 画面共通の小さな UI 部品。ドメインロジックは持たない。 */

import type { ChangeEvent, ReactNode } from 'react';

export const Card = ({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <section className="card">
    {(title || actions) && (
      <header className="card__header">
        <div>
          {title && <h2 className="card__title">{title}</h2>}
          {description && <p className="card__description">{description}</p>}
        </div>
        {actions && <div className="card__actions">{actions}</div>}
      </header>
    )}
    {children}
  </section>
);

export const Field = ({
  label,
  hint,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}) => (
  <label className={`field${wide ? ' field--wide' : ''}`}>
    <span className="field__label">{label}</span>
    {children}
    {hint && <span className="field__hint">{hint}</span>}
  </label>
);

export const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'month' | 'email' | 'tel' | 'url';
}) => (
  <input
    className="input"
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
  />
);

export const TextArea = ({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) => (
  <textarea
    className="input input--textarea"
    rows={rows}
    value={value}
    placeholder={placeholder}
    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
  />
);

/** 数値入力。空欄は null として返す。 */
export const NumberInput = ({
  value,
  onChange,
  placeholder,
  step,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  step?: number;
}) => (
  <input
    className="input"
    type="number"
    step={step}
    value={value ?? ''}
    placeholder={placeholder}
    onChange={(e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      onChange(raw === '' ? null : Number(raw));
    }}
  />
);

/** 万円単位で入力し、円で保持する。年収系の入力に使う。 */
export const ManYenInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}) => (
  <div className="input-group">
    <input
      className="input"
      type="number"
      step={10}
      value={value == null ? '' : Math.round(value / 10_000)}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        onChange(raw === '' ? null : Number(raw) * 10_000);
      }}
    />
    <span className="input-group__suffix">万円</span>
  </div>
);

export const Select = <T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) => (
  <select
    className="input"
    value={value}
    onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T)}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

/** カンマ区切りで配列を編集する入力。 */
export const TagInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) => (
  <input
    className="input"
    type="text"
    value={value.join(', ')}
    placeholder={placeholder}
    onChange={(e: ChangeEvent<HTMLInputElement>) =>
      onChange(
        e.target.value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      )
    }
  />
);

export const Checkbox = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="checkbox">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
    />
    <span>{label}</span>
  </label>
);

/** 複数選択のトグルチップ。 */
export const ChipToggles = <T extends string>({
  value,
  onChange,
  options,
}: {
  value: T[];
  onChange: (value: T[]) => void;
  options: { value: T; label: string }[];
}) => (
  <div className="chips">
    {options.map((option) => {
      const active = value.includes(option.value);
      return (
        <button
          key={option.value}
          type="button"
          className={`chip${active ? ' chip--active' : ''}`}
          onClick={() =>
            onChange(
              active
                ? value.filter((item) => item !== option.value)
                : [...value, option.value]
            )
          }
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => (
  <button
    type={type}
    className={`button button--${variant}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

/** 0〜100 のスコアを横棒で表示する。 */
export const ScoreBar = ({ score }: { score: number }) => {
  const tone = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';
  return (
    <div className="scorebar">
      <div
        className={`scorebar__fill scorebar__fill--${tone}`}
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
      />
    </div>
  );
};

export const Stat = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good' | 'warn' | 'bad';
}) => (
  <div className={`stat${tone ? ` stat--${tone}` : ''}`}>
    <span className="stat__label">{label}</span>
    <strong className="stat__value">{value}</strong>
    {sub && <span className="stat__sub">{sub}</span>}
  </div>
);

export const EmptyState = ({ message }: { message: string }) => (
  <p className="empty">{message}</p>
);
