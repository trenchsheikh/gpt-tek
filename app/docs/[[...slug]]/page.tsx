import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { documentation } from "@/lib/documentation";
import DocsReader from "../reader";

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return [{ slug: [] }, ...documentation.map((page) => ({ slug: [page.slug] }))];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = documentation.find((item) => item.slug === (slug?.[0] || "overview"));
  return { title: page ? page.title + " | AgentRouter Docs" : "AgentRouter Docs", description: page?.description };
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  if (slug && slug.length > 1) notFound();
  const page = documentation.find((item) => item.slug === (slug?.[0] || "overview"));
  if (!page) notFound();
  return <DocsReader page={page} pages={documentation} />;
}
