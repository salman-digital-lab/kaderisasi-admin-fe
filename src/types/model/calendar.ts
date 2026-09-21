export interface CalendarActivity {
  id: number;
  name: string;
  slug: string;
  is_published: boolean;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  activity: CalendarActivity | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarInput {
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  activity_id: number | null;
}
