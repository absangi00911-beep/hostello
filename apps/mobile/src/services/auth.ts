import { apiRequest, setAuthToken, clearAuthToken } from "./api";
import { LoginInput } from "@hostello/shared/validations";

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    emailVerified: boolean;
  };
}

export async function login(credentials: LoginInput): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>("/auth/mobile/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  await setAuthToken(result.token);
  return result;
}

export async function logout(): Promise<void> {
  await clearAuthToken();
}
