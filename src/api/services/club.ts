import { notification } from "antd";
import { removeEmptyValueFromObj } from "../../functions";
import {
  getClubsReq,
  getClubsResp,
  getClubResp,
  postClubReq,
  postClubResp,
  putClubReq,
  putClubResp,
  uploadLogoResp,
  uploadImageMediaResp,
  addYoutubeMediaResp,
  deleteMediaReq,
  deleteMediaResp,
  addYoutubeMediaReq,
} from "../../types/services/club";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getClubs = async (props: getClubsReq) => {
  try {
    const searchParams = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(searchParams).toString();
    const res = await axios.get<getClubsResp>("/clubs?" + urlSearch);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getClub = async (id: number) => {
  try {
    const res = await axios.get<getClubResp>("/clubs/" + id);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const postClub = async (data: postClubReq) => {
  try {
    const res = await axios.post<postClubResp>("/clubs", data);
    notification.success({
      message: "Berhasil",
      description: "Unit Kegiatan berhasil ditambahkan",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const putClub = async (id: number, data: putClubReq) => {
  try {
    const res = await axios.put<putClubResp>("/clubs/" + id, data);
    notification.success({
      message: "Berhasil",
      description: "Unit Kegiatan berhasil diubah",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};



export const uploadClubLogo = async (id: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post<uploadLogoResp>(
      "/clubs/" + id + "/logo",
      formData
    );
    notification.success({
      message: "Berhasil",
      description: "Logo berhasil diunggah",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const uploadClubImageMedia = async (id: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("media_type", "image");

    const res = await axios.post<uploadImageMediaResp>(
      "/clubs/" + id + "/media/image",
      formData
    );
    notification.success({
      message: "Berhasil",
      description: "Gambar berhasil diunggah",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const addClubYoutubeMedia = async (
  id: number,
  data: addYoutubeMediaReq
) => {
  try {
    const res = await axios.post<addYoutubeMediaResp>(
      "/clubs/" + id + "/media/youtube",
      data
    );
    notification.success({
      message: "Berhasil",
      description: "Video YouTube berhasil ditambahkan",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const deleteClubMedia = async (id: number, data: deleteMediaReq) => {
  try {
    const res = await axios.put<deleteMediaResp>(
      "/clubs/" + id + "/delete-media",
      data
    );
    notification.success({
      message: "Berhasil",
      description: "Media berhasil dihapus",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
