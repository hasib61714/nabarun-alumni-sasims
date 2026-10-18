import npsLogo from "@/assets/institutions/nps.png";
import blmsLogo from "@/assets/institutions/blms.png";
import coachingLogo from "@/assets/institutions/coaching.png";

export interface Institution {
  id: string;
  name: string;
  nameBn: string;
  logo: string;
  /** One-line description shown on the home page cards. */
  desc: string;
  address?: string;
  established?: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  /** Google Maps link; the map button is only shown when this is set. */
  mapUrl?: string;
}

export const institutions: Institution[] = [
  {
    id: "nps",
    name: "Nabarun Public School",
    nameBn: "নবারুণ পাবলিক স্কুল",
    logo: npsLogo,
    desc: "মানসম্মত শিক্ষা ও নৈতিক মূল্যবোধের প্রতিষ্ঠান।",
    established: "2003",
    phone: "+8801716461562",
    phoneDisplay: "+880 1716 461562",
    email: "info.nabarun@gmail.com",
  },
  {
    id: "blms",
    name: "Biplob Lopa Memorial Girls School",
    nameBn: "বিপ্লব লোপা মেমোরিয়াল গার্লস স্কুল",
    logo: blmsLogo,
    desc: "প্লে থেকে দশম শ্রেণি পর্যন্ত — সকাল ও দিবা শিফটে পাঠদান।",
    phone: "+8801717333008",
    phoneDisplay: "+880 1717 333008",
    email: "info.nabarun@gmail.com",
  },
  {
    id: "coaching",
    name: "Nabarun Coaching Center",
    nameBn: "নবারুণ কোচিং সেন্টার",
    logo: coachingLogo,
    desc: "পরীক্ষার প্রস্তুতি ও বিশেষ কোচিং সেবা।",
    established: "1996",
    phone: "+8801798615440",
    phoneDisplay: "+880 1798 615440",
    email: "info.nabarun@gmail.com",
  },
];
