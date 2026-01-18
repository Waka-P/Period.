"use client";
import HalfModal from "@/app/components/HalfModal";
import OnboardingForm from "@/app/onboarding/components/OnboardingForm";
import type { UserRole } from "@/generated/prisma/browser";
import { useState } from "react";
import styles from "./Settings.module.css";

type RoleSwitchBtnProps = {
  currentRole?: UserRole;
};

export default function RoleSwitchBtn({ currentRole }: RoleSwitchBtnProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className={styles.settingBtn}
        type="button"
        onClick={() => setShowModal(true)}
        title="ロールを切り替える"
      >
        切り替える
      </button>
      <HalfModal
        showModal={showModal}
        setShowModal={setShowModal}
        title="ロール切り替え"
        description="ロール選択後はOnboardingへ"
        modalClassNames={{ content: styles.fullScreenModal }}
      >
        <OnboardingForm
          isRoleSwitchModal
          currentRole={currentRole}
          onCancel={() => setShowModal(false)}
        />
      </HalfModal>
    </>
  );
}
