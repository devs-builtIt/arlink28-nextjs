import type { ReactNode } from "react";
import type { PropertyOption } from "@arlink28/api-client";
import { DETAIL_FIELDS, PRICE_LABEL, type DetailField, type DetailValues, type OtherType } from "@/utils/productTypes";

type Props = {
  type: OtherType;
  details: DetailValues;
  onDetails: (next: DetailValues) => void;
  fromPrice: string;
  onFromPrice: (next: string) => void;
  baseCurrency: string;
  onCurrency: (next: string) => void;
  properties?: PropertyOption[];
  fieldErrors?: Record<string, string[]>;
  disabled?: boolean;
  autoFocus?: boolean;
};

/** The fields a flight, hotel reservation or visa has that a holiday package doesn't. */
export default function TypeDetailsFields({
  type,
  details,
  onDetails,
  fromPrice,
  onFromPrice,
  baseCurrency,
  onCurrency,
  properties = [],
  fieldErrors,
  disabled,
  autoFocus,
}: Props) {
  const set = (key: string, value: string) => onDetails({ ...details, [key]: value });
  const priceLabel = PRICE_LABEL[type];
  const fields = DETAIL_FIELDS[type];

  const errorFor = (key: string) =>
    fieldErrors?.[key]?.[0] ?? fieldErrors?.[key.charAt(0).toUpperCase() + key.slice(1)]?.[0];

  function control(field: DetailField, first: boolean) {
    const common = {
      id: `detail-${field.key}`,
      className: "input",
      value: details[field.key] ?? "",
      disabled,
      required: field.required,
      autoFocus: autoFocus && first,
    };
    const onChange = (e: { target: { value: string } }) => set(field.key, e.target.value);

    if (field.kind === "select") {
      return (
        <select {...common} onChange={onChange}>
          <option value="">Not specified</option>
          {field.options?.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      );
    }
    if (field.kind === "property") {
      return (
        <select {...common} onChange={onChange}>
          <option value="">Not one of ours</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}, {p.destinationName}
            </option>
          ))}
        </select>
      );
    }
    if (field.kind === "textarea" || field.kind === "lines") {
      return (
        <textarea
          {...common}
          className="input textarea"
          rows={field.kind === "lines" ? 5 : 3}
          maxLength={field.max}
          onChange={onChange}
        />
      );
    }
    if (field.kind === "date") return <input {...common} type="date" onChange={onChange} />;
    return (
      <input
        {...common}
        type="text"
        inputMode={field.kind === "money" ? "decimal" : undefined}
        placeholder={field.placeholder}
        maxLength={field.max}
        onChange={onChange}
      />
    );
  }

  const field = (f: DetailField, first: boolean) => (
    <div className="field" key={f.key}>
      <label htmlFor={`detail-${f.key}`}>
        {f.label}
        {!f.required && <span className="optional"> optional</span>}
      </label>
      {control(f, first)}
      {f.hint && <span className="field-hint">{f.hint}</span>}
      {errorFor(f.key) && <span className="field-error">{errorFor(f.key)}</span>}
    </div>
  );

  const currency = (label: string) => (
    <div className="field">
      <label htmlFor="pkg-currency">{label}</label>
      <input
        id="pkg-currency"
        className="input"
        value={baseCurrency}
        onChange={(e) => onCurrency(e.target.value.toUpperCase())}
        maxLength={3}
        required
        disabled={disabled}
      />
    </div>
  );

  // Fields marked `pair` share a row with the next one. The price row follows the first row.
  const rows: ReactNode[] = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.pair && fields[i + 1]) {
      rows.push(
        <div className="field-row" key={f.key}>
          {field(f, i === 0)}
          {field(fields[i + 1], false)}
        </div>,
      );
      i++;
    } else {
      rows.push(field(f, i === 0));
    }
    if (i <= 1 && priceLabel) {
      rows.push(
        <div className="field-row" key="price">
          <div className="field">
            <label htmlFor="pkg-from-price">
              {priceLabel} <span className="optional">optional</span>
            </label>
            <input
              id="pkg-from-price"
              className="input"
              inputMode="decimal"
              value={fromPrice}
              onChange={(e) => onFromPrice(e.target.value)}
              disabled={disabled}
            />
            <span className="field-hint">Leave empty to show &ldquo;Enquire for a price&rdquo;.</span>
          </div>
          {currency("Currency")}
        </div>,
      );
    }
  }
  if (!priceLabel)
    rows.push(
      <div className="field-row" key="currency">
        {currency("Fee currency")}
      </div>,
    );

  return <>{rows}</>;
}
