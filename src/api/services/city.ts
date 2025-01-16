import { getCitiesResp } from "../../types/services/city";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getCities = async () => {
  try {
    const res = await axios.get<getCitiesResp>("/cities?");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};
