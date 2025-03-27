export type Badge = {
  _id: string;
  name: string;
  description: string;
  type: "achievement" | "rank" | "improvement" | "special";
  representation: "emoji" | "icon" | "image";
  icon: string;
  isActive: true | false;
  criteria: string;
  awarded?: number;
  createdAt?: string;
  updatedAt?: string;
};