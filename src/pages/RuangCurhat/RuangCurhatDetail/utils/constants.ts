import { MenuProps } from "antd";
import { PROBLEM_STATUS_ENUM } from "../../../../types/constants/ruangcurhat";
export const UPDATE_STATUS_MENU: MenuProps["items"] = [
  {
    label: "Belum Ditangani",
    key: PROBLEM_STATUS_ENUM.BELUM_DITANGANI,
  },
  {
    label: "Sedang Ditangani",
    key: PROBLEM_STATUS_ENUM.SEDANG_DITANGANI,
  },
  {
    label: "Sudah Ditangani",
    key: PROBLEM_STATUS_ENUM.SUDAH_DITANGANI,
  },
  {
    label: "Batal",
    key: PROBLEM_STATUS_ENUM.BATAL,
  },
];
