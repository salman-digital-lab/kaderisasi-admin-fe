import { AxiosError } from "axios";
import axios from "./axios";
import { PostLoginResp, PutLogoutResp } from "../types/services/auth";

type FieldType = {
  email?: string;
  password?: string;
};

export const loginUser = async (values: FieldType) => {
  try {
    const res = await axios.post<PostLoginResp>("/auth/login", values);
    const user = res.data.data;
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", user.token.token);
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

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};
