import { AxiosError } from "axios";
import axios from "./axios";
import { PostLoginResp, PutLogoutResp } from "../types/services/auth";
import { useAuthStore } from "../stores/authStore";

type FieldType = {
  email?: string;
  password?: string;
};

export const loginUser = async (values: FieldType) => {
  try {
    const res = await axios.post<PostLoginResp>("/auth/login", values);
    // Don't update store here - let the component handle it
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError)
      throw new Error(error.response?.data.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await axios.put<PutLogoutResp>("/auth/logout");

    // Clear auth state from Zustand store (this will also clear localStorage via persistence)
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};
