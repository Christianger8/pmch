export interface ActionState {
  error?: string;
  ok?: boolean;
}

export interface PhoneCheckResult {
  ok: boolean;
  phone?: string;
  registered?: boolean;
  error?: string;
}
