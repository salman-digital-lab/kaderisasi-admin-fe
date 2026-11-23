import {
  type PROBLEM_OWNER_ENUM,
  type PROBLEM_STATUS_ENUM,
} from "../constants/ruangcurhat";
import { type AdminUser } from "./adminuser";
import { type PublicUser } from "./members";
import type { University } from "./university";

export type RuangCurhatData = {
  id: number;
  user_id: number;
  problem_ownership: PROBLEM_OWNER_ENUM;
  owner_name: string;
  problem_category: string;
  problem_description: string;
  handling_technic: string;
  counselor_gender: string;
  counselor_id: number;
  status: PROBLEM_STATUS_ENUM;
  additional_notes: string;
  created_at: string;
  updated_at: string;
  publicUser: PublicUser;
  adminUser?: AdminUser;
  university?: University | null;
};
