"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const portierMdComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 text-pretty last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--gjest-ink)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-5 text-pretty [li]:pl-0.5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-5 text-pretty [li]:pl-0.5">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-pretty">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[var(--gjest-teal)] underline decoration-[var(--gjest-teal)]/40 underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-[var(--gjest-teal)]/35 pl-3 italic text-[var(--gjest-ink-muted)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-[rgba(54,92,107,0.2)]" />,
  code: ({ children, className }) => {
    const isFenced = Boolean(className?.startsWith("language-"));
    if (isFenced) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="rounded-sm bg-[rgba(54,92,107,0.1)] px-1 font-mono text-[0.9em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-sm bg-[rgba(54,92,107,0.06)] p-3 font-mono text-[0.85em]">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse border border-[rgba(54,92,107,0.2)] text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[rgba(54,92,107,0.08)]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-[rgba(54,92,107,0.2)] px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[rgba(54,92,107,0.15)] px-2 py-1">{children}</td>
  ),
};

export const PortierMessageMarkdown = ({ source }: { source: string }) => {
  if (!source) return null;
  return (
    <div className="gjest-portier-md min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={portierMdComponents}>
        {source}
      </ReactMarkdown>
    </div>
  );
};
