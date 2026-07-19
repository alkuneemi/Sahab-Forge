export interface CustomForm {
  id: string;
  model: string;
  name: string;
  icon: string;
  html: string;
  createdAt: number;
}

const KEY_PREFIX = "sahab_custom_forms_";

export function listCustomForms(model: string): CustomForm[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + model);
    return raw ? (JSON.parse(raw) as CustomForm[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomForm(form: Omit<CustomForm, "id" | "createdAt">): CustomForm {
  const entry: CustomForm = { ...form, id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() };
  const list = listCustomForms(form.model);
  list.push(entry);
  try {
    localStorage.setItem(KEY_PREFIX + form.model, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
  return entry;
}

export function deleteCustomForm(model: string, id: string) {
  const list = listCustomForms(model).filter((f) => f.id !== id);
  try {
    localStorage.setItem(KEY_PREFIX + model, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
