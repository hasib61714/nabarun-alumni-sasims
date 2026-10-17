import {
  BarChart3, BookHeart, CalendarDays, HandCoins, Image as ImageIcon, LayoutDashboard, Megaphone,
  MessageSquare, MessageSquareQuote, Users, type LucideIcon,
} from "lucide-react";
import type { AdminCounts } from "@/hooks/useAdminData";

export type SectionId =
  | "overview" | "students" | "memories" | "gallery" | "events"
  | "notices" | "donations" | "testimonials" | "messages" | "analytics";

export interface AdminSection {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: keyof AdminCounts;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { id: "overview", label: "ওভারভিউ", description: "এক নজরে সবকিছু", icon: LayoutDashboard },
  { id: "students", label: "ছাত্র", description: "ছাত্রদের তথ্য ও অনুমোদন", icon: Users, badge: "pendingStudents" },
  { id: "memories", label: "স্মৃতি", description: "ব্যবহারকারীদের লেখা স্মৃতি, ছবি ও ভিডিও", icon: BookHeart, badge: "pendingMemories" },
  { id: "gallery", label: "গ্যালারি", description: "ফটো গ্যালারি", icon: ImageIcon },
  { id: "events", label: "ইভেন্ট", description: "অনুষ্ঠান ও কর্মসূচি", icon: CalendarDays },
  { id: "notices", label: "নোটিশ", description: "নোটিশ বোর্ড", icon: Megaphone },
  { id: "donations", label: "অনুদান", description: "অনুদান ও ক্যাম্পেইন", icon: HandCoins, badge: "pendingDonations" },
  { id: "testimonials", label: "মতামত", description: "ছাত্রদের মতামত", icon: MessageSquareQuote, badge: "pendingTestimonials" },
  { id: "messages", label: "বার্তা", description: "যোগাযোগ ফর্মের বার্তা", icon: MessageSquare, badge: "unreadMessages" },
  { id: "analytics", label: "পরিসংখ্যান", description: "চার্ট ও বিশ্লেষণ", icon: BarChart3 },
];
