// apps/website/lib/projects.ts
// Single source of truth for all current projects.
// To add a new project: append an entry to this array.
// The slug must match the folder name under app/current-projects/[slug]/

export type ProjectStatus = "Active" | "Completed" | "Upcoming";

export interface Project {
  slug: string;
  status: ProjectStatus;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  date: string;
  images: string[];
  tags: string[];
  goal?: string | null;
  participants?: number | null;
  highlight?: string | null;
  body?: string | null;
  budget?: string | null;
  objectives?: string[];
}

export const PROJECTS: Project[] = [
  {
    slug: "training-center",
    status: "Active",
    title: "1000MM Bangladesh Training Center",
    subtitle: "A Legacy in the Making",
    description:
      "Groundbreaking held on December 10, 2025 at BASC Campus. Help complete a fully functioning missionary training center that will prepare generations of gospel workers for Bangladesh and beyond.",
    location: "BASC Campus, Bangladesh",
    date: "Dec 10, 2025 — Ongoing",
    images: ["/images/projects/training-center.jpg"],
    tags: ["Construction", "Training", "Mission"],
  },
  {
    slug: "batch-29",
    status: "Active",
    title: "29th Batch Missionary Training Program 2026",
    subtitle: "29 Years of Faithful Mission",
    description:
      "An intensive four-week residential training program at BANC, Gazipur preparing 60–100 young missionaries in evangelism, health ministry, leadership, and digital outreach. Total budget: BDT 1,891,382 (≈ USD 15,503).",
    location: "BANC Campus, Gazipur, Bangladesh",
    date: "Oct 04–31, 2026",
    images: ["/images/projects/batch-29/batch-29-1.jpg"],
    tags: ["Training", "Evangelism", "Youth"],
  },
  {
    slug: "bicycle-for-missionaries",
    status: "Active",
    title: "Wheels for Mission: Bicycles for Missionaries",
    subtitle: "Every Bicycle Carries the Gospel",
    description:
      "Providing 60 durable bicycles to missionaries serving rural villages, riverine regions, and remote communities — cutting travel time and cost so they can reach more people, strengthen churches, and disciple new believers. A practical, sustainable, zero-emission tool for ministry. Total budget: ≈ USD 17,300.",
    location: "Rural & remote communities, Bangladesh",
    date: "2026 — Ongoing",
    images: ["/images/projects/bicycle-ministry/bicycle-ministry-1.jpg"],
    tags: ["Transportation", "Evangelism", "Sustainability"],
  },
  {
    slug: "medical-kits",
    status: "Active",
    title: "Medical Kits for Missionaries",
    subtitle: "Healing Hands, Open Doors",
    description:
      "Equipping 60 missionaries with portable medical kit boxes — blood pressure monitors, glucometers, pulse oximeters, first-aid supplies and more — so they can meet physical needs, build trust, and open doors for the Gospel in remote and underserved communities. Total budget: ≈ USD 16,275.",
    location: "Villages, slums, coastal & hill areas, Bangladesh",
    date: "2026 — Ongoing",
    images: ["/images/projects/medical-kits/medical-kits-1.jpg"],
    tags: ["Healthcare", "Compassion", "Evangelism"],
  },
];
