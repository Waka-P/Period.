import HalfModal from "@/app/components/HalfModal";
import type { WorkoutFormData } from "@/schemas/workoutSchema";
import {
  LocalizationProvider,
  StaticTimePicker,
  type StaticTimePickerProps,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import type { Locale } from "date-fns";
import { format, isAfter, isMatch, parse, set } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { useRef } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { FaRegClock } from "react-icons/fa6";
import ActionBar from "./ActionBar";
import "./TimePicker.css";
import styles from "./TimePicker.module.css";

interface MobileTimePickerProps
  extends Omit<StaticTimePickerProps, "name" | "value"> {
  label: string | null;
  value: string | null;
}

const jaLocale: Locale = {
  ...ja,
  options: {
    ...ja.options,
    weekStartsOn: 1,
  },
};

export default function TimePicker({
  name,
  onChange,
}: {
  name: "startTime" | "endTime";
  onChange: () => void;
}) {
  const { control } = useFormContext<WorkoutFormData>();

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { ref, onChange: fieldOnChange, value, ...fieldProps },
      }) => {
        const isValidTimeString = value && isMatch(value, "HH:mm");

        return (
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={jaLocale}
          >
            <TPicker
              onChange={(val) => {
                fieldOnChange(val ? format(val, "HH:mm") : null);
                onChange();
              }}
              value={isValidTimeString ? value : null}
              {...fieldProps}
              label={isValidTimeString ? value : "時間を選択"}
            />
          </LocalizationProvider>
        );
      }}
    />
  );
}

function TPicker({
  label,
  slots,
  onChange,
  value,
  ...other
}: MobileTimePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { control } = useFormContext<WorkoutFormData>();
  const day = useWatch({
    control,
    name: "workoutDate",
  });
  return (
    <HalfModal
      title="時間を選択"
      description="運動した時間を選択してください"
      isNested
      trigger={
        <button type="button" ref={triggerRef} className={styles.trigger}>
          {label}
          <FaRegClock className={styles.triggerIcon} />
        </button>
      }
    >
      <div data-vaul-no-drag>
        <StaticTimePicker
          ref={null}
          localeText={{
            toolbarTitle: "時間を選択",
            cancelButtonLabel: "キャンセル",
            okButtonLabel: "OK",
          }}
          slots={{
            actionBar: ActionBar,
            ...slots,
          }}
          slotProps={{
            // biome-ignore lint: anyで回避
            actionBar: { triggerRef } as any,
          }}
          value={value ? parse(value, "HH:mm", new Date(day)) : null}
          onChange={onChange}
          minutesStep={1}
          shouldDisableTime={(value) => {
            if (!day || !value) return false;

            const selectedDateTime = set(new Date(day), {
              hours: value.getHours(),
              minutes: value.getMinutes(),
              seconds: 0,
              milliseconds: 0,
            });

            return isAfter(selectedDateTime, new Date());
          }}
          {...other}
        />
      </div>
    </HalfModal>
  );
}
