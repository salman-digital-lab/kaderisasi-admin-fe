export interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export interface DataMembers {
  id: string;
  key: string;
  no: number;
  name: string;
  publicUser: {
    id: number;
    email: string;
  };
  whatsapp: string;
  university_id?: string;
  universityName: string;
  level: number;
  levelName?: string;
  aktivis?: string[];
}

export interface DataRegistrant extends DataMembers {
  register: string;
}

export interface DataMemberDetail {
  id?: string;
  name: string;
  gender: string;
  email: string;
  line: string;
  whatsapp: string;
  instagram: string;
  universityId?: string;
  universityName: string;
  major: string;
  intake_year: number;
  city: string;
  province: string;
}

export interface DataActivity {
  id: number;
  key: string;
  no: number;
  name: string;
  registration_start: string;
  registration_end: string;
  description: string;
  minimum_level: number;
  levelName?: string;
  activity_type: string;
  questionnaire?: string;
  selection_start: string;
  selection_end: string;
  activity_start: string;
  activity_end: string;
  publish: number;
}

export interface DataActivityDetail {
  activity_name: string;
  description: string;
  minimum_role: string;
  activity_type: string;
  additional_questionnaire: string;
  registration_start: string;
  registration_end: string;
  selection_start: string;
  selection_end: string;
  activity_start: string;
  activity_end: string;
  is_published: boolean;
}

export interface DataMaster {
  id?: number;
  no?: number;
  province_id?: string;
  name: string;
  provinceName?: string;
}
