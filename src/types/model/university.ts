export type University = {
  id: number;
  name: string;
  province_id?: number;
  province?: {
    id: number;
    name: string;
  };
};
