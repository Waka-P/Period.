import HalfModal from "@/app/components/HalfModal";
import type { WorkoutFormData } from "@/schemas/workoutSchema";
import * as Slider from "@radix-ui/react-slider";
import { useRef } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { IoMdHeart } from "react-icons/io";
import { MdHeartBroken } from "react-icons/md";
import styles from "./LoadLevelBtn.module.css";

export function LoadLevelBtn({ onChange }: { onChange: () => void }) {
  const { control } = useFormContext<WorkoutFormData>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const loadLevel = useWatch({
    control,
    name: "loadLevel",
  });
  const getLoadLevelDesc = (level: number) => {
    switch (level) {
      case 1:
        return "余裕";
      case 2:
        return "軽め";
      case 3:
        return "普通";
      case 4:
        return "きつい";
      case 5:
        return "とてもきつい";
      default:
        return "";
    }
  };

  const handleOkClick = () => {
    if (triggerRef.current) {
      triggerRef.current.click();
    }
  };

  return (
    <HalfModal
      title="負荷レベルを選択"
      description="1~5の負荷レベルから選択してください"
      isNested
      trigger={
        <button type="button" className={styles.button} ref={triggerRef}>
          Lv.{loadLevel}
        </button>
      }
    >
      <div className={styles.wrapper}>
        <h2 className={styles.loadTitle}>負荷</h2>
        <p className={styles.loadLevel}>
          {loadLevel < 4 ? <IoMdHeart /> : <MdHeartBroken />}
          {loadLevel}
        </p>
        <div data-vaul-no-drag>
          <Controller
            control={control}
            name="loadLevel"
            render={({ field }) => (
              <Slider.Root
                className={styles.sliderRoot}
                value={[field.value]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => {
                  field.onChange(value[0]);
                  onChange();
                }}
              >
                <Slider.Track className={styles.sliderTrack}>
                  <Slider.Range className={styles.sliderRange} />
                </Slider.Track>
                <Slider.Thumb
                  className={styles.sliderThumb}
                  aria-label="load-level"
                />
              </Slider.Root>
            )}
          ></Controller>
        </div>
        <p className={styles.loadDesc}>{getLoadLevelDesc(loadLevel)}</p>
        <button
          type="button"
          className={styles.okButton}
          onClick={handleOkClick}
        >
          OK
        </button>
      </div>
    </HalfModal>
  );
}
