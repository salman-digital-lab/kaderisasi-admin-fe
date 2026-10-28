import { message } from "antd";
import axios from "../axios";
import { handleError } from "../errorHandling";
import {
  P3riForm,
  P3riRegistration,
  P3riRegistrationFilter,
  P3riRegistrationList,
  P3riStatus,
} from "../../types/model/p3ri";

type Envelope<T> = { message: string; data: T };

const query = (filter: Partial<P3riRegistrationFilter>) =>
  new URLSearchParams(
    Object.entries(filter)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();

export const getP3riForm = async () => {
  try {
    const res = await axios.get<Envelope<P3riForm>>("/p3ri/form");
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getP3riRegistrations = async (filter: P3riRegistrationFilter) => {
  try {
    const res = await axios.get<Envelope<P3riRegistrationList>>(
      "/p3ri/registrations?" + query(filter),
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getP3riRegistration = async (id: string) => {
  try {
    const res = await axios.get<Envelope<P3riRegistration>>(
      "/p3ri/registrations/" + id,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const putP3riRegistrationStatus = async (
  id: number,
  data: {
    status: P3riStatus;
    accepted_division?: string;
    admin_note?: string;
  },
) => {
  try {
    const res = await axios.put<Envelope<P3riRegistration>>(
      `/p3ri/registrations/${id}/status`,
      data,
    );
    message.success("Status pendaftar diperbarui.");
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const exportP3riRegistrations = async (
  filter: Partial<P3riRegistrationFilter>,
) => {
  try {
    const res = await axios.get<Blob>(
      "/p3ri/registrations/export?" + query(filter),
      { responseType: "blob" },
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getP3riFile = async (key: string) => {
  const res = await axios.get<Blob>(
    "/p3ri/files?" + new URLSearchParams({ key }).toString(),
    { responseType: "blob" },
  );
  return res.data;
};
