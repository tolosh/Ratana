import { createFileRoute } from "@tanstack/react-router";
import { ScribeShell } from "@/components/scribe/ScribeShell";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Rātana Scribe" },
      { name: "description", content: "Record, review and sign clinical notes." },
      { property: "og:title", content: "Rātana Scribe" },
      { property: "og:description", content: "Record, review and sign clinical notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScribeShell,
});
