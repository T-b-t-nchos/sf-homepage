export type Lt1Presenter = {
  id: string;
  name: string;
  title: string;
  status: "active" | "cancelled";
  discordId?: string; // Optional: Link to Discord user for self-service cancellation
};

export const lt1Presenters: Lt1Presenter[] = [
  { id: "tbd-1", name: "Coming Soon", title: "TBD", status: "active", discordId: "957974197953511524" },
  { id: "tbd-2", name: "Coming Soon", title: "TBD", status: "active" },
];
