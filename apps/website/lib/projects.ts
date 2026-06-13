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
  image: string;
  tags: string[];
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
    image: "/images/projects/training-center.jpg",
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
    image: "/images/projects/batch-29/batch-29-1.jpg",
    tags: ["Training", "Evangelism", "Youth"],
  },
];
