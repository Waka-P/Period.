"use client";
import HalfModal from "@/app/components/HalfModal";
import type { WorkoutFormData } from "@/schemas/workoutSchema";
import {
  LocalizationProvider,
  StaticDatePicker,
  type StaticDatePickerProps,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import type { Locale } from "date-fns";
import { format, formatDate, isAfter } from "date-fns";
import "date-fns/locale/ja";
import { ja } from "date-fns/locale/ja";
import { useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FaRegCalendar } from "react-icons/fa6";
import ActionBar from "./ActionBar";
import "./DatePicker.css";
import styles from "./DatePicker.module.css";

const datePickerProps = {
  localeText: {
    toolbarTitle: "日付を選択",
    nextMonth: "次月",
    previousMonth: "前月",
    cancelButtonLabel: "キャンセル",
    okButtonLabel: "OK",
  },
  format: "yyyy年M月d日",
  ref: null,
};

const jaLocale: Locale = {
  ...ja,
  options: {
    ...ja.options,
    weekStartsOn: 1,
  },
};

export default function DatePicker({
  name,
  onChange,
}: {
  name: "workoutDate";
  onChange: () => void;
}) {
  const { control } = useFormContext<WorkoutFormData>();

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { ref, onChange: fieldOnChange, value, ...fieldProps },
      }) => (
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={jaLocale}
          dateFormats={{ year: "yyyy年" }}
        >
          <DPicker
            onChange={(val) => {
              fieldOnChange(val ? formatDate(val, "yyyy-MM-dd") : null);
              onChange();
            }}
            value={formatDate(value, "yyyy-MM-dd")}
            {...fieldProps}
            label={
              value === null || Number.isNaN(new Date(value)?.getTime())
                ? "日付を選択"
                : format(value, "yyyy年M月d日")
            }
          />
        </LocalizationProvider>
      )}
    />
  );
}

function DPicker(
  props: Omit<StaticDatePickerProps, "value"> & {
    label: string | null;
    value: string | null;
  },
) {
  const { label, value, onChange, ...other } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <HalfModal
      title="日付を選択"
      description="運動した日を選択してください"
      isNested
      trigger={
        <button type="button" ref={triggerRef} className={styles.trigger}>
          {label}
          <FaRegCalendar className={styles.triggerIcon} />
        </button>
      }
    >
      <StaticDatePicker
        slots={{
          actionBar: ActionBar,
          ...props.slots,
        }}
        slotProps={{
          calendarHeader: { format: "yyyy年MM月" },
          toolbar: { toolbarFormat: "yyyy年MM月dd日", hidden: false },
          // biome-ignore lint: anyで回避
          actionBar: { triggerRef } as any,
        }}
        value={value ? new Date(value) : null}
        onChange={onChange}
        showDaysOutsideCurrentMonth
        shouldDisableDate={(day) => isAfter(day, new Date())}
        {...other}
        {...datePickerProps}
      />
    </HalfModal>
  );
}
