import "./Toggle.css";

type ToggleProps = {
  id: string;
  label?: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
};

function Toggle({ id, label, checked, onToggle }: ToggleProps) {
  return (
    <div className="toggleSwitch">
      {label && <label htmlFor={id}>{label}</label>}
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onToggle(e.target.checked)} />
    </div>
  );
}

export default Toggle;
