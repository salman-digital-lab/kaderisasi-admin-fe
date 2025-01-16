export type PostLoginResp = {
  message: string;
  data: {
    token: {
      token: string;
    };
  };
};

export type PutLogoutResp = {
  message: string;
};
