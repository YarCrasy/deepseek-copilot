import "./Slider.css";

type SliderProps = {
  id?: string;
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onBlur?: (value: number) => void;
};

function Slider({ id, label, value, min, max, step, disabled = false, onChange, onBlur }: SliderProps) {
  return (
    <div className="slider">
      {label && <label htmlFor={id}> {label} </label>}
      <div className="sliderWithValue">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          onBlur={(event) => onBlur?.(Number(event.target.value))}
        />
        {value !== undefined && <span className="sliderValue">{value.toFixed(2)}</span>}
      </div>
    </div>
  );
}

export default Slider;
