import { Country } from "../../types/model/country";
import axios from "../axios";
import { handleError } from "../errorHandling";

type GetCountriesResp = {
  message: string;
  data: Country[];
};

export const getCountries = async () => {
  try {
    const res = await axios.get<GetCountriesResp>("/countries");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};
