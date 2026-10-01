import source from "./theme-guide.json";

export interface TalentGuide {
  name: string;
  summary: string;
  characteristics: string;
  activities: string[];
  support: string;
}
export interface TalentDomainGuide {
  name: string;
  referenceName: string;
  focus: string;
}
export const DOMAIN_GUIDES: TalentDomainGuide[] = [
  {
    name: "Pemikiran",
    referenceName: "Thinking",
    focus: "Mengolah informasi, ide, dan gagasan.",
  },
  {
    name: "Pengaruh",
    referenceName: "Influencing",
    focus: "Memengaruhi dan menggerakkan orang lain.",
  },
  {
    name: "Hubungan",
    referenceName: "Relating",
    focus: "Membangun hubungan yang setara dengan orang lain.",
  },
  {
    name: "Eksekusi",
    referenceName: "Striving",
    focus: "Dorongan dari dalam diri untuk bekerja dan berbuat.",
  },
];
const guides = new Map<string, TalentGuide>(
  source.themes.map((theme) => [theme.name, theme]),
);
export const REPORT_SOURCE = source.source;
export const THEME_COMPARISONS = source.comparisons;
export function getTalentGuide(name: string): TalentGuide | undefined {
  return guides.get(name);
}
export function rankBand(rank: number): { label: string; className: string } {
  if (rank <= 7) return { label: "Menonjol", className: "top" };
  if (rank <= 27) return { label: "Pendukung", className: "support" };
  return { label: "Kurang menonjol", className: "lower" };
}
