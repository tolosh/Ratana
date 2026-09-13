import { createFileRoute } from "@tanstack/react-router";
import { RatanaHome } from "@/components/ratana/RatanaHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rātana | Hospital-in-the-Home Command Platform" },
      { name: "description", content: "A command platform for health providers scaling Hospital in the Home care. Monitor patients, prioritise work, coordinate escalation, and reduce bed pressure." },
      { property: "og:title", content: "Move more hospital care home, safely. | Rātana" },
      { property: "og:description", content: "Explore Rātana’s synthetic MVP for managing 5,000 active Hospital in the Home patients across desktop and mobile workflows." },
      { property: "og:url", content: "https://ratana.cloud/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ratana.cloud/" }],
  }),
  component: RatanaHome,
});