import { createFileRoute } from "@tanstack/react-router";
import { ResearchArticle } from "@/components/ratana/ResearchArticle";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "The Next Hospital Bed Is At Home | Rātana Research" },
      {
        name: "description",
        content:
          "Research: how shifting 5–15% of suitable inpatient care into the home could release millions of bed-days and billions in capacity value across Australia, the US, the EU and Singapore.",
      },
      { property: "og:title", content: "The Next Hospital Bed Is At Home | Rātana" },
      {
        property: "og:description",
        content:
          "A 5–15% shift of suitable inpatient care into the home could release millions of bed-days and billions in capacity value. The prize is the command layer for a distributed hospital.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://ratana.cloud/research" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ratana.cloud/research" }],
  }),
  component: ResearchArticle,
});
