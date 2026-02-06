export type Lt1Presenter = {
  id: string;
  name: string;
  title: string;
  ownerDiscordId?: string;
  discordId?: string;
  status: "active" | "cancelled";
};

export const lt1Presenters: Lt1Presenter[] = [
  {
    id: "tbd-1",
    name: "Coming Soon",
    title: "TBD",
    ownerDiscordId: "957974197953511524",
    discordId: "957974197953511524",
    status: "active",
  },
  { id: "tbd-2", name: "Coming Soon", title: "TBD", status: "active" },
];
