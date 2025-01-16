import axios from "../axios";
import { handleError } from "../errorHandling";
import {
  GetRuangCurhatReq,
  GetRuangCurhatResp,
  GetRuangCurhatsReq,
  GetRuangCurhatsResp,
  PutRuangCurhatReq,
  PutRuangCurhatResp,
} from "../../types/services/ruangcurhat";
import { removeEmptyValueFromObj } from "../../functions";
import { notification } from "antd";
import { renderNotification } from "../../constants/render";

export const getRuangCurhats = async (props: GetRuangCurhatsReq) => {
  try {
    const urlSearch = new URLSearchParams(props).toString();
    const res = await axios.get<GetRuangCurhatsResp>(
      "/ruang-curhat?" + urlSearch,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getRuangCurhat = async (props: GetRuangCurhatReq) => {
  try {
    const res = await axios.get<GetRuangCurhatResp>(
      "/ruang-curhat/" + props.id,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const putRuangCurhat = async (props: PutRuangCurhatReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props.data);

    const res = await axios.put<PutRuangCurhatResp>(
      "/ruang-curhat/" + props.id,
      bodyData,
    );

    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
