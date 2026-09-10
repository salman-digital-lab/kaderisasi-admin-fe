import axios from "../axios";
import type { AuthSession } from "../../types/services/auth";

export async function updateProfile(displayName: string): Promise<AuthSession> {
  const response = await axios.put<{ data: AuthSession }>("/auth/profile", {
    displayName,
  });
  return response.data.data;
}
