import { Club } from "../model/club";
import { Pagination } from "./base";

export type getClubsReq = {
  per_page: string;
  page: string;
  search?: string;
};

export type getClubsResp = {
  message: string;
  data: {
    meta: Pagination;
    data: Club[];
  };
};

export type getClubResp = {
  message: string;
  data: Club;
};

export type postClubReq = Partial<Club>;

export type postClubResp = {
  message: string;
  data: Club;
};

export type putClubReq = Partial<Club>;

export type putClubResp = {
  message: string;
  data: Club;
};



export type uploadLogoResp = {
  message: string;
  data: {
    logo: string;
  };
};

export type uploadImageMediaResp = {
  message: string;
  data: {
    media: {
      items: {
        media_url: string;
        media_type: 'image';
      }[];
    };
  };
};

export type addYoutubeMediaResp = {
  message: string;
  data: {
    media: {
      items: {
        media_url: string;
        media_type: 'video';
        video_source: 'youtube';
      }[];
    };
  };
};

export type deleteMediaReq = {
  index: number;
};

export type deleteMediaResp = {
  message: string;
  data: {
    media: {
      items: {
        media_url: string;
        media_type: 'image' | 'video';
        video_source?: 'youtube';
      }[];
    };
  };
};

export type addYoutubeMediaReq = {
  media_url: string;
  media_type: 'video';
  video_source: 'youtube';
};
