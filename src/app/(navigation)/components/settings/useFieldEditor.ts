import { fetcher } from "@/utils/fetcher";

export type EditingField = "name" | "height" | "weight" | "age" | null;

export type FieldEditorHandlers = {
  onEdit: () => void;
  onSave: (inputValue: string) => Promise<void>;
  onCancel: () => void;
  error: string;
};

type UseFieldEditorParams = {
  field: EditingField;
  getCurrentValue: () => string | number;
  validate: (value: string) => { valid: boolean; parsed?: number | string };
  fieldName: string;
  updateProfile?: (value: number | string) => void;
  saving: boolean;
  setEditing: (field: EditingField) => void;
  setSaving: (saving: boolean) => void;
  error: string;
  setError: (error: string) => void;
};

export function useFieldEditor({
  field,
  getCurrentValue,
  validate,
  fieldName,
  updateProfile,
  saving,
  setEditing,
  setSaving,
  error,
  setError,
}: UseFieldEditorParams): FieldEditorHandlers {
  return {
    onEdit: () => {
      if (saving) return;
      setError("");
      setEditing(field);
    },
    error,
    onSave: async (inputValue: string) => {
      if (saving) return;

      const current = getCurrentValue();
      const validation = validate(inputValue);

      if (!validation.valid || validation.parsed === current) {
        setEditing(null);
        return;
      }

      try {
        setSaving(true);
        const body = { [fieldName]: validation.parsed };
        const endpoint =
          field === "name" ? "/api/settings/name" : "/api/settings/athlete";

        const res = await fetcher<{
          success: boolean;
          user?: { name: string };
          athleteProfile?: Record<string, number>;
        }>(endpoint, {
          method: "POST",
          body: JSON.stringify(body),
        });

        if (res.success && updateProfile) {
          if (field === "name" && res.user) {
            updateProfile(res.user.name);
          } else if (res.athleteProfile) {
            updateProfile(res.athleteProfile[fieldName]);
          }
          setError("");
        }
      } catch (e) {
        console.error(e);
        const errorMessage =
          e && typeof e === "object" && "message" in e
            ? String(e.message)
            : "エラーが発生しました";
        setError(errorMessage);
        return;
      } finally {
        setSaving(false);
        setEditing(null);
      }
    },
    onCancel: () => {
      setError("");
      setEditing(null);
    },
  };
}
