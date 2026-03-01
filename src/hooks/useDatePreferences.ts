import { useDatePreferencesContext } from "@/contexts/DatePreferencesContext";

export function useDatePreferences() {
  const context = useDatePreferencesContext();
  return context;
}
