export type PostLoginResp = {
  message: string;
  data: {
    token: {
      token: string;
    };
    user: {
      id?: string;
      email?: string;
      display_name?: string;
      role?: string;
      [key: string]: any;
    };
  };
};

export type PutLogoutResp = {
  message: string;
};
