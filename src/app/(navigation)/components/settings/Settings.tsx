"use client";

import HalfModal from "@/app/components/HalfModal";
import onboardingStyles from "@/app/onboarding/components/OnboardingForm.module.css";
import type {
  ActivityLevel,
  AthleteProfile,
  Gender,
  User,
  UserRole,
} from "@/generated/prisma/browser";
import { getPusherClient } from "@/lib/pusher";
import { fetcher } from "@/utils/fetcher";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { FaInfo } from "react-icons/fa6";
import { IoFemale, IoMale } from "react-icons/io5";
import DeleteAccountBtn from "./DeleteAccountBtn";
import EditableField from "./EditableField";
import LogoutBtn from "./LogoutBtn";
import PartnerLinkBtn from "./PartnerLinkBtn";
import RoleSwitchBtn from "./RoleSwitchBtn";
import styles from "./Settings.module.css";
import type { EditingField } from "./useFieldEditor";
import { useFieldEditor } from "./useFieldEditor";

type SettingsProps = {
  user: User;
  athleteProfile?: AthleteProfile | null;
  initialPartnerInfo?: {
    linked: boolean;
    label?: string;
    partnerName?: string;
  };
};

const activityLevelLabels: Record<ActivityLevel, string> = {
  BEGINNER: "初級",
  INTERMEDIATE: "中級",
  ADVANCED: "上級",
};

const genderLabels: Record<Gender, string> = {
  MALE: "男性",
  FEMALE: "女性",
};

const roleLabels: Record<UserRole, string> = {
  ATHLETE: "アスリート",
  TRAINER: "トレーナー",
};

export default function Settings({
  user,
  athleteProfile,
  initialPartnerInfo,
}: SettingsProps) {
  const isTrainer = user.role === "TRAINER";
  const [partnerLinked, setPartnerLinked] = useState(
    initialPartnerInfo?.linked ?? false,
  );
  const [partnerLabel, setPartnerLabel] = useState<string>(
    initialPartnerInfo?.label ?? "",
  );
  const [partnerName, setPartnerName] = useState<string>(
    initialPartnerInfo?.partnerName ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showProfileInfoModal, setShowProfileInfoModal] = useState(false);

  const [editing, setEditing] = useState<EditingField>(null);
  const [nameError, setNameError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [weightError, setWeightError] = useState("");
  const [ageError, setAgeError] = useState("");

  const nameHandler = useFieldEditor({
    field: "name",
    getCurrentValue: () => user.name ?? "",
    validate: (value) => {
      const trimmed = value.trim();
      return { valid: trimmed.length > 0, parsed: trimmed };
    },
    fieldName: "name",
    updateProfile: (value) => {
      user.name = value as string;
    },
    saving,
    setEditing,
    setSaving,
    error: nameError,
    setError: setNameError,
  });

  const heightHandler = useFieldEditor({
    field: "height",
    getCurrentValue: () => athleteProfile?.heightCm ?? 0,
    validate: (value) => {
      const num = Number(value);
      return { valid: Number.isInteger(num) && num > 0, parsed: num };
    },
    fieldName: "heightCm",
    updateProfile: (value) => {
      if (athleteProfile) athleteProfile.heightCm = value as number;
    },
    saving,
    setEditing,
    setSaving,
    error: heightError,
    setError: setHeightError,
  });

  const weightHandler = useFieldEditor({
    field: "weight",
    getCurrentValue: () => athleteProfile?.weightKg ?? 0,
    validate: (value) => {
      const num = Number(value);
      return { valid: Number.isFinite(num) && num > 0, parsed: num };
    },
    fieldName: "weightKg",
    updateProfile: (value) => {
      if (athleteProfile) athleteProfile.weightKg = value as number;
    },
    saving,
    setEditing,
    setSaving,
    error: weightError,
    setError: setWeightError,
  });

  const ageHandler = useFieldEditor({
    field: "age",
    getCurrentValue: () => athleteProfile?.age ?? 0,
    validate: (value) => {
      const num = Number(value);
      return { valid: Number.isInteger(num) && num > 0, parsed: num };
    },
    fieldName: "age",
    updateProfile: (value) => {
      if (athleteProfile) athleteProfile.age = value as number;
    },
    saving,
    setEditing,
    setSaving,
    error: ageError,
    setError: setAgeError,
  });
  const openLevelModal = () => {
    if (!athleteProfile) return;
    setShowLevelModal(true);
  };

  const updateActivityLevel = async (level: ActivityLevel) => {
    if (!athleteProfile || saving) return;
    if (athleteProfile.activityLevel === level) {
      setShowLevelModal(false);
      return;
    }
    try {
      setSaving(true);
      const res = await fetcher<{
        success: boolean;
        athleteProfile?: { activityLevel: ActivityLevel };
      }>("/api/settings/athlete", {
        method: "POST",
        body: JSON.stringify({ activityLevel: level }),
      });
      if (res.success && res.athleteProfile) {
        athleteProfile.activityLevel = res.athleteProfile.activityLevel;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setShowLevelModal(false);
    }
  };

  const openGenderModal = () => {
    if (!athleteProfile) return;
    setShowGenderModal(true);
  };

  const updateGender = async (gender: Gender) => {
    if (!athleteProfile || saving) return;
    if (athleteProfile.gender === gender) {
      setShowGenderModal(false);
      return;
    }
    try {
      setSaving(true);
      const res = await fetcher<{
        success: boolean;
        athleteProfile?: { gender: Gender };
      }>("/api/settings/athlete", {
        method: "POST",
        body: JSON.stringify({ gender }),
      });
      if (res.success && res.athleteProfile) {
        athleteProfile.gender = res.athleteProfile.gender;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setShowGenderModal(false);
    }
  };

  // Pusherでリアルタイム更新 + 初期ロード
  useEffect(() => {
    const loadPartner = async () => {
      try {
        const res = await fetcher<{
          success: boolean;
          linked: boolean;
          label?: string;
          partnerName?: string;
        }>("/api/settings/partner");
        if (res.success) {
          setPartnerLinked(res.linked);
          setPartnerLabel(res.label ?? "");
          setPartnerName(res.partnerName ?? "");
        }
      } catch (e) {
        console.error(e);
      }
    };

    // 初期ロード
    loadPartner();

    // Pusher接続
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`user-${user.id}`);

    channel.bind("partner:updated", (data: { linked: boolean }) => {
      if (data.linked) {
        // 連携された場合は詳細情報を取得
        loadPartner();
      } else {
        // 連携解除された場合は即座に状態を更新
        setPartnerLinked(false);
        setPartnerLabel("");
        setPartnerName("");
      }
    });

    // 従来のイベント（PartnerLinkBtnから発火）も引き続きサポート
    const handler = () => loadPartner();
    window.addEventListener("partner:updated", handler);

    return () => {
      channel.unbind("partner:updated");
      pusher.unsubscribe(`user-${user.id}`);
      window.removeEventListener("partner:updated", handler);
    };
  }, [user.id]);
  return (
    <>
      <h2 className={styles.title}>設定</h2>
      <div className={clsx(styles.wrapper, isTrainer && styles.trainerTheme)}>
        <section className={styles.section}>
          <h3 className={styles.heading}>
            プロフィール
            <button
              type="button"
              className={styles.infoBtn}
              onClick={() => setShowProfileInfoModal(true)}
              aria-label="プロフィール編集のヒント"
              title="プロフィール編集のヒント"
            >
              <FaInfo />
            </button>
          </h3>
          <div className={styles.secCont}>
            {/* トレーナーは「名前」のみ編集 */}
            {isTrainer ? (
              <EditableField
                label="名前"
                value={user.name}
                isEditing={editing === "name"}
                saving={saving}
                onEdit={nameHandler.onEdit}
                onSave={nameHandler.onSave}
                onCancel={nameHandler.onCancel}
                error={nameHandler.error}
              />
            ) : (
              <>
                <EditableField
                  label="名前"
                  value={user.name}
                  isEditing={editing === "name"}
                  saving={saving}
                  onEdit={nameHandler.onEdit}
                  onSave={nameHandler.onSave}
                  onCancel={nameHandler.onCancel}
                  error={nameHandler.error}
                />
                <EditableField
                  label="身長"
                  value={athleteProfile?.heightCm}
                  unit="cm"
                  isEditing={editing === "height"}
                  saving={saving}
                  onEdit={heightHandler.onEdit}
                  onSave={heightHandler.onSave}
                  onCancel={heightHandler.onCancel}
                  inputType="number"
                  inputMode="numeric"
                  disabled={!athleteProfile}
                  error={heightHandler.error}
                />
                <EditableField
                  label="体重"
                  value={athleteProfile?.weightKg}
                  unit="kg"
                  isEditing={editing === "weight"}
                  saving={saving}
                  onEdit={weightHandler.onEdit}
                  onSave={weightHandler.onSave}
                  onCancel={weightHandler.onCancel}
                  inputType="number"
                  inputMode="decimal"
                  step="0.1"
                  disabled={!athleteProfile}
                  error={weightHandler.error}
                />
                <EditableField
                  label="年齢"
                  value={athleteProfile?.age}
                  unit="歳"
                  isEditing={editing === "age"}
                  saving={saving}
                  onEdit={ageHandler.onEdit}
                  onSave={ageHandler.onSave}
                  onCancel={ageHandler.onCancel}
                  inputType="number"
                  inputMode="numeric"
                  disabled={!athleteProfile}
                  error={ageHandler.error}
                />
                <div className={styles.profItem}>
                  <div>
                    <h4 className={styles.label}>運動レベル</h4>
                    {athleteProfile ? (
                      <button
                        type="button"
                        className={styles.value}
                        onClick={openLevelModal}
                        title="クリックで選択"
                      >
                        {activityLevelLabels[athleteProfile.activityLevel]}
                      </button>
                    ) : (
                      <p className={styles.value}>未設定</p>
                    )}
                  </div>
                </div>
                <div className={styles.profItem}>
                  <div>
                    <h4 className={styles.label}>性別</h4>
                    {athleteProfile ? (
                      <button
                        type="button"
                        className={styles.value}
                        onClick={openGenderModal}
                        title="クリックで選択"
                      >
                        {genderLabels[athleteProfile.gender]}
                      </button>
                    ) : (
                      <p className={styles.value}>未設定</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.heading}>パートナー連携</h3>
          <div className={styles.secCont}>
            <div className={styles.settingCont}>
              <div className={styles.partnerStatus}>
                <p className={styles.settingValue}>
                  {partnerLinked ? partnerLabel : "連携していません"}
                </p>
                {partnerLinked && (
                  <div className={styles.partnerNameCont}>
                    <p className={styles.partnerName}>
                      {partnerName ? `${partnerName}` : ""}
                    </p>
                    <span className={styles.honorific}>さん</span>
                  </div>
                )}
              </div>
              <PartnerLinkBtn isTrainer={isTrainer} linked={partnerLinked} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.heading}>ロール</h3>
          <div className={styles.secCont}>
            <div className={styles.settingCont}>
              <p className={styles.settingValue}>
                {user.role ? roleLabels[user.role] : "未設定"}
              </p>
              <RoleSwitchBtn currentRole={user.role ?? undefined} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.heading}>その他</h3>
          <LogoutBtn />
          <DeleteAccountBtn />
        </section>
      </div>

      <HalfModal
        showModal={showProfileInfoModal}
        setShowModal={setShowProfileInfoModal}
        title="プロフィール編集のヒント"
        description="プロフィールの項目について"
        modalClassNames={
          isTrainer ? { content: styles.trainerModal } : undefined
        }
      >
        <p className={styles.info}>項目をクリックして編集できます。</p>
      </HalfModal>
      <HalfModal
        showModal={showGenderModal}
        setShowModal={setShowGenderModal}
        title="性別を選択"
        description="生物学的性別を選択してください。"
      >
        <p className={styles.genderInfoText}>
          健康管理やトレーニング計画を最適化するために、生物学的性別を選択してください。
        </p>
        <div className={styles.genderOptions}>
          <button
            type="button"
            className={clsx(
              onboardingStyles.genderOption,
              athleteProfile?.gender === "MALE" && onboardingStyles.active,
            )}
            onClick={() => updateGender("MALE")}
          >
            <span className={onboardingStyles.genderIcon}>
              <IoMale />
            </span>
            <p className={onboardingStyles.genderLabel}>男性</p>
          </button>
          <button
            type="button"
            className={clsx(
              onboardingStyles.genderOption,
              athleteProfile?.gender === "FEMALE" && onboardingStyles.active,
            )}
            onClick={() => updateGender("FEMALE")}
          >
            <span className={onboardingStyles.genderIcon}>
              <IoFemale />
            </span>
            <p className={onboardingStyles.genderLabel}>女性</p>
          </button>
        </div>
      </HalfModal>
      <HalfModal
        showModal={showLevelModal}
        setShowModal={setShowLevelModal}
        title="運動レベルを選択"
        description="あなたの日常的な身体活動のレベルを選択してください。"
      >
        <h2 className={onboardingStyles.levelModalTitle}>
          最も近い運動レベルを選択
        </h2>
        <button
          type="button"
          className={clsx(
            onboardingStyles.levelOption,
            athleteProfile?.activityLevel === "BEGINNER" &&
              onboardingStyles.active,
          )}
          onClick={() => updateActivityLevel("BEGINNER")}
        >
          <h3 className={onboardingStyles.levelOptionTitle}>初心者</h3>
          <p className={onboardingStyles.levelOptionText}>
            階段で息切れ・週0回運動
          </p>
        </button>
        <button
          type="button"
          className={clsx(
            onboardingStyles.levelOption,
            athleteProfile?.activityLevel === "INTERMEDIATE" &&
              onboardingStyles.active,
          )}
          onClick={() => updateActivityLevel("INTERMEDIATE")}
        >
          <h3 className={onboardingStyles.levelOptionTitle}>中級者</h3>
          <p className={onboardingStyles.levelOptionText}>週2回は運動する</p>
        </button>
        <button
          type="button"
          className={clsx(
            onboardingStyles.levelOption,
            athleteProfile?.activityLevel === "ADVANCED" &&
              onboardingStyles.active,
          )}
          onClick={() => updateActivityLevel("ADVANCED")}
        >
          <h3 className={onboardingStyles.levelOptionTitle}>上級者</h3>
          <p className={onboardingStyles.levelOptionText}>
            ほぼ毎日トレーニング
          </p>
        </button>
      </HalfModal>
    </>
  );
}
