import { createFileRoute } from "@tanstack/react-router";
import { RatanaApp } from "@/components/lantern/RatanaApp";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Synthetic MVP Demo | Rātana" },
      { name: "description", content: "Explore Rātana’s synthetic Hospital in the Home command, clinical, patient and escalation workflows." },
      { property: "og:title", content: "Synthetic MVP Demo | Rātana" },
      { property: "og:description", content: "Explore a synthetic network of 5,000 active Hospital in the Home patients." },
      { property: "og:url", content: "https://ratana.cloud/demo" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ratana.cloud/demo" }],
  }),
  component: RatanaApp,
});