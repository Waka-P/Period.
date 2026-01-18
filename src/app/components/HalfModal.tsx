"use client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { Drawer } from "vaul";
import styles from "./HalfModal.module.css";

type BaseProps = {
  children: React.ReactNode;
  onClose?: () => void;
  preventDefaultClose?: boolean;
  modalClassNames?: Partial<{
    overlay: string;
    content: string;
    body: string;
    handle: string;
  }>;
  title: string;
  description: string;
};

type NestedProps = BaseProps & {
  showModal?: never;
  setShowModal?: never;
  isNested: true;
  trigger: React.ReactNode;
};

type RegularProps = BaseProps & {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  isNested?: false;
  trigger?: never;
};

type Props = NestedProps | RegularProps;

export default function HalfModal({
  children,
  showModal,
  setShowModal,
  onClose,
  preventDefaultClose,
  modalClassNames = {},
  title,
  description,
  isNested = false,
  trigger,
}: Props) {
  const router = useRouter();

  const closeModal = ({ dragged }: { dragged?: boolean } = {}) => {
    if (preventDefaultClose && !dragged) {
      return;
    }

    if (onClose) {
      onClose();
      return;
    }

    if (setShowModal) {
      setShowModal(false);
    } else {
      if (!isNested) {
        router.back();
      }
    }
  };

  if (isNested) {
    return (
      <Drawer.NestedRoot
        onOpenChange={(open) => {
          if (!open) {
            closeModal({ dragged: true });
          }
        }}
      >
        <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay
            className={clsx(
              styles.overlay,
              styles.nested,
              modalClassNames.overlay,
            )}
          />
          <Drawer.Content
            className={clsx(
              styles.content,
              styles.nested,
              modalClassNames.content,
            )}
          >
            <Drawer.Title className={styles.srOnly}>{title}</Drawer.Title>
            <Drawer.Description className={styles.srOnly}>
              {description}
            </Drawer.Description>
            <div className={clsx(styles.body, modalClassNames.body)}>
              <div className={clsx(styles.handle, modalClassNames.handle)} />
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.NestedRoot>
    );
  }

  return (
    <Drawer.Root
      open={showModal}
      onOpenChange={(open) => {
        if (!open) {
          closeModal({ dragged: true });
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          className={clsx(styles.overlay, modalClassNames.overlay)}
        />
        <Drawer.Content
          className={clsx(styles.content, modalClassNames.content)}
        >
          <Drawer.Title className={styles.srOnly}>{title}</Drawer.Title>
          <Drawer.Description className={styles.srOnly}>
            {description}
          </Drawer.Description>
          <div className={clsx(styles.body, modalClassNames.body)}>
            <div className={clsx(styles.handle, modalClassNames.handle)} />
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
