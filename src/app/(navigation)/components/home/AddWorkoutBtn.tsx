"use client";
import HalfModal from "@/app/components/HalfModal";
import { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import styles from "./AddWorkoutBtn.module.css";
import WorkoutForm from "./WorkoutForm";

export default function AddWorkoutBtn({
  selectedDate,
}: {
  selectedDate: Date;
}) {
  const [showFormModal, setShowFormModal] = useState(false);
  const openFormModal = () => {
    setShowFormModal(true);
  };
  return (
    <>
      <button type="button" className={styles.button} onClick={openFormModal}>
        <FaPlus />
      </button>
      <HalfModal
        showModal={showFormModal}
        setShowModal={setShowFormModal}
        title="運動の記録を追加する"
        description="新しい運動の記録を追加できます"
        modalClassNames={{
          content: styles.formModalContent,
          body: styles.formModalBody,
          handle: styles.formModalHandle,
        }}
      >
        <WorkoutForm
          closeFormModal={() => setShowFormModal(false)}
          selectedDate={selectedDate}
        />
      </HalfModal>
    </>
  );
}
