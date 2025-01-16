import { message } from "antd";
import { removeEmptyValueFromObj } from "../../functions";
import {
  getUniversitiesReq,
  getUniversitiesResp,
  universityReq,
  universityResp,
} from "../../types/services/university";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getUniversities = async (props: getUniversitiesReq) => {
  try {
    const urlSearch = new URLSearchParams(props).toString();
    const res = await axios.get<getUniversitiesResp>(
      "/universities?" + urlSearch,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const addUniversity = async (props: universityReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props.data);
    const res = await axios.post<universityResp>("/universities", bodyData);
    message.success(res.data.message);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const putUniversity = async (id: number, props: universityReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props.data);
    const res = await axios.put<universityResp>(
      `/universities/${id}`,
      bodyData,
    );
    message.success(res.data.message);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
