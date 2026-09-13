import { createFileRoute } from "@tanstack/react-router";
import { LanternApp } from "@/components/lantern/LanternApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Network Command — Rātana" },
      { name: "description", content: "Explore Rātana’s synthetic 5,000-bed Hospital in the Home operations prototype." },
      { property: "og:title", content: "Network Command — Rātana" },
      { property: "og:description", content: "A synthetic Hospital in the Home operations prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LanternApp,
});