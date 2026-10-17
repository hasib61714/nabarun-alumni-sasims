import { BookHeart, Bell, LayoutDashboard, Settings, UserRound, type LucideIcon } from "lucide-react";

export type StudentSectionId = "overview" | "profile" | "memories" | "notices" | "settings";

export interface StudentSection {
  id: StudentSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const STUDENT_SECTIONS: StudentSection[] = [
  { id: "overview", label: "ওভারভিউ", description: "আপনার অবস্থা এক নজরে", icon: LayoutDashboard },
  { id: "profile", label: "প্রোফাইল", description: "আপনার তথ্য ও ছবি", icon: UserRound },
  { id: "memories", label: "স্মৃতি", description: "আপনার লেখা স্মৃতি, ছবি ও ভিডিও", icon: BookHeart },
  { id: "notices", label: "নোটিশ", description: "প্রতিষ্ঠানের ঘোষণা", icon: Bell },
  { id: "settings", label: "সেটিংস", description: "পাসওয়ার্ড ও অ্যাকাউন্ট", icon: Settings },
];
