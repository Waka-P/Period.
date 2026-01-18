"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import styles from "./Settings.module.css";

type EditableFieldProps = {
  label: string;
  value: string | number | undefined;
  unit?: string;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
  inputType?: "text" | "number";
  inputMode?: "text" | "numeric" | "decimal";
  step?: string;
  disabled?: boolean;
  error?: string;
};

export default function EditableField({
  label,
  value,
  unit,
  isEditing,
  saving,
  onEdit,
  onSave,
  onCancel,
  inputType = "text",
  inputMode = "text",
  step,
  disabled = false,
  error,
}: EditableFieldProps) {
  const [inputValue, setInputValue] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setInputValue(String(value ?? ""));
      inputRef.current?.focus();
    }
  }, [isEditing, value]);

  const handleSave = async () => {
    if (saving) return;
    await onSave(inputValue);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    if (
      e.key === "Enter" &&
      (inputType !== "text" || !e.nativeEvent.isComposing)
    ) {
      e.preventDefault();
      await handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleBlur = () => {
    onCancel();
  };

  if (disabled) {
    return (
      <div className={styles.profItem}>
        <h4 className={styles.label}>{label}</h4>
        <p className={styles.value}>未設定</p>
      </div>
    );
  }

  return (
    <div className={styles.profItem}>
      <div>
        <h4 className={styles.label}>{label}</h4>
        {isEditing ? (
          <div
            className={
              unit
                ? styles.valueRow
                : clsx(styles.inputWrapper, styles.valueRow)
            }
          >
            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                type={inputType}
                inputMode={inputMode}
                step={step}
                className={styles.valueInput}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                disabled={saving}
              />
              <button
                type="button"
                className={styles.inputSaveBtn}
                onClick={handleSave}
                onMouseDown={(e) => e.preventDefault()}
                disabled={saving}
                aria-label="保存"
                title="保存"
              >
                <FaCheck />
              </button>
            </div>
            {unit && <span className={styles.unit}>{unit}</span>}
          </div>
        ) : (
          <button
            type="button"
            className={styles.value}
            onClick={onEdit}
            title="クリックで編集"
          >
            {value}
            {unit && <>&nbsp;{unit}</>}
          </button>
        )}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
