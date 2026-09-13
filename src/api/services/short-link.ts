import axios from "../axios";
import type {
  ShortLink,
  ShortLinkInput,
  ShortLinkPage,
} from "../../types/model/short-link";

export async function getShortLinks(params: {
  search: string;
  page: number;
  per_page: number;
}): Promise<ShortLinkPage> {
  const response = await axios.get<{ data: ShortLinkPage }>("/short-links", {
    params,
  });
  return response.data.data;
}

export async function createShortLink(
  input: ShortLinkInput,
): Promise<ShortLink> {
  const response = await axios.post<{ data: ShortLink }>("/short-links", input);
  return response.data.data;
}

export async function updateShortLink(
  code: string,
  original_url: string,
): Promise<ShortLink> {
  const response = await axios.patch<{ data: ShortLink }>(
    `/short-links/${encodeURIComponent(code)}`,
    { original_url },
  );
  return response.data.data;
}

export async function deleteShortLink(code: string): Promise<void> {
  await axios.delete(`/short-links/${encodeURIComponent(code)}`);
}
