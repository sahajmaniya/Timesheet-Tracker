export type BreakItem = {
  id: string;
  start: string;
  end: string;
};

export type TimeEntry = {
  id: string;
  positionId: string;
  date: string;
  punchIn: string;
  punchOut: string;
  notes: string | null;
  breaks: BreakItem[];
  breakMinutes: number;
  workedMinutes: number;
  /** Day hours in tenths as the position's voucher counts them. */
  workedTenths: number;
  /** ISA days: gaps between work are separate sessions, not breaks. */
  sessionBased: boolean;
  createdAt: string;
  updatedAt: string;
};
