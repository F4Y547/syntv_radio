import { getCachedCountries } from "@/lib/seo/data";
import { ExploreClient } from "./explore-client";

export default async function ExplorePage() {
  const countries = await getCachedCountries().catch(() => []);
  return <ExploreClient initialCountries={countries.slice(0, 60)} />;
}