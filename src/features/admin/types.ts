export interface FormResult {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}
