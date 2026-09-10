import type { FormInstance } from "antd";

/** Manual modal submissions need the same error focus as Form.onFinish. */
export async function validateFieldsAndFocus<T>(
  form: FormInstance<T>,
): Promise<T> {
  try {
    return await form.validateFields();
  } catch (error) {
    const first = form.getFieldsError().find((field) => field.errors.length);
    if (first) form.scrollToField(first.name, { focus: true, block: "center" });
    throw error;
  }
}
