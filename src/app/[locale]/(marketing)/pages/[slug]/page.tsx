import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DOMPurify from "isomorphic-dompurify";

// Force dynamic rendering - no static generation at build time
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params;

  const page = await prisma.page.findFirst({
    where: {
      slug,
      deletedAt: null,
    },
  });

  if (!page) {
    notFound();
  }

  // SECURITY: Sanitize HTML to prevent XSS attacks
  const sanitizedBody = DOMPurify.sanitize(page.body, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "a",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "blockquote",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "figure",
      "figcaption",
      "div",
      "span",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div className="container max-w-4xl py-12">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>{page.name}</h1>
        <div dangerouslySetInnerHTML={{ __html: sanitizedBody }} />
      </article>
    </div>
  );
}
