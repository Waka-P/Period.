import {
  type PickersActionBarProps,
  usePickerActionsContext,
} from "@mui/x-date-pickers";
import clsx from "clsx";
import type { RefObject } from "react";
import styles from "./ActionBar.module.css";

export default function ActionBar({
  className,
  triggerRef,
}: PickersActionBarProps & {
  triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
  const { acceptValueChanges, cancelValueChanges } = usePickerActionsContext();
  const closePicker = () => {
    if (triggerRef?.current) {
      triggerRef.current.click();
    }
  };
  const actions = [
    {
      text: "キャンセル",
      onClick: () => {
        cancelValueChanges();
        closePicker();
      },
    },
    {
      text: "OK",
      onClick: () => {
        acceptValueChanges();
        closePicker();
      },
    },
  ];

  return (
    <div className={clsx(className, styles.actionBar)}>
      {actions.map(({ onClick, text }, index) => (
        <button
          type="button"
          // biome-ignore lint: indexが変化することがないため
          key={index}
          onClick={onClick}
          className={styles.button}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
