import { createFileRoute } from "@tanstack/react-router";
import { TechnologyPage } from "@/components/ratana/TechnologyPage";

export const Route = createFileRoute("/technology")({
  head: () => ({
    meta: [
      { title: "Technology Platform | Rātana Hospital-at-Home" },
      { name: "description", content: "See how Rātana turns home observations, device feeds and hospital context into explainable, auditable clinical work." },
      { property: "og:title", content: "The technology layer for hospital-level care at home | Rātana" },
      { property: "og:description", content: "Explore Rātana's platform architecture, patient state, clinical workflows, interoperability and governed access." },
      { property: "og:url", content: "https://ratana.cloud/technology" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ratana.cloud/technology" }],
  }),
  component: TechnologyPage,
});