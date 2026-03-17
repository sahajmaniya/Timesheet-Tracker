export type BreakItem = {
  id: string;
  start: string;
  end: string;
};

export type TimeEntry = {
  id: string;
  date: string;
  punchIn: string;
  punchOut: string;
  notes: string | null;
  breaks: BreakItem[];
  breakMinutes: number;
  workedMinutes: number;
  createdAt: string;
  updatedAt: string;
};
