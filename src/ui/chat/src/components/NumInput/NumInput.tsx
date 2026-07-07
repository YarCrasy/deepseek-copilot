import "./NumInput.css";

type NumInputProps = {
  id?: string;
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

function NumInput({ id, label, value, min = 0, max, step, disabled = false, onChange }: NumInputProps) {
  return (
    <div className="numInput">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export default NumInput;
