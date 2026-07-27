import { format } from "date-fns";

export const uzDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const months = [
    "yanvar","fevral","mart","aprel","may","iyun",
    "iyul","avgust","sentabr","oktabr","noyabr","dekabr"
  ];
  return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const uzDateTime = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${uzDate(date)}, ${format(date, "HH:mm")}`;
};

export const uzDayName = (n: number) => {
  const days = ["Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba","Yakshanba"];
  return days[n - 1] ?? "";
};

export const uzNumber = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(n);

// Aliases used across admin pages
export const fmtDate = uzDate;
export const fmtDateTime = uzDateTime;