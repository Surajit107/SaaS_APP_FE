import type { ReactElement } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

const markdownComponents: Components = {
  p({ children }) {
    return <p className="mb-2 last:mb-0 first:mt-0">{children}</p>;
  },
  strong({ children }) {
    return <strong className="text-foreground font-semibold">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
  ul({ children }) {
    return <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>;
  },
  ol({ children }) {
    return (
      <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0 [&>li]:pl-0.5">{children}</ol>
    );
  },
  li({ children }) {
    return <li className="[&>p]:mb-0">{children}</li>;
  },
  h1({ children }) {
    return <h1 className="mt-3 mb-2 text-sm font-semibold first:mt-0">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mt-3 mb-2 text-sm font-semibold first:mt-0">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mt-2 mb-1.5 text-xs font-semibold first:mt-0">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="text-muted-foreground border-muted-foreground/30 mb-2 border-l-2 pl-3 last:mb-0">
        {children}
      </blockquote>
    );
  },
  hr() {
    return <hr className="border-border my-3" />;
  },
  a({ href, children }) {
    return (
      <a
        className="text-primary font-medium underline underline-offset-2"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  },
  code({ className, children, ...props }) {
    const isFenced = Boolean(className?.includes('language-'));
    return (
      <code
        className={cn(
          'font-mono text-[0.65rem]',
          isFenced ? cn('block w-full', className) : 'bg-muted/70 rounded px-1 py-px',
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }) {
    return (
      <pre className="bg-muted/70 mb-2 max-h-[min(240px,40dvh)] overflow-x-auto overflow-y-auto rounded-md p-2 last:mb-0">
        {children}
      </pre>
    );
  },
  table({ children }) {
    return (
      <div className="mb-2 max-w-full overflow-x-auto last:mb-0">
        <table className="w-full border-collapse border-spacing-0 text-left text-[0.65rem]">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-muted/40">{children}</thead>;
  },
  tr({ children }) {
    return <tr className="border-border border-b last:border-b-0">{children}</tr>;
  },
  th({ children }) {
    return <th className="border-border border px-2 py-1.5 font-semibold">{children}</th>;
  },
  td({ children }) {
    return <td className="border-border border px-2 py-1 align-top">{children}</td>;
  },
  del({ children }) {
    return <del className="text-muted-foreground">{children}</del>;
  },
};

export type ChatAssistantMarkdownProps = {
  content: string;
};

/**
 * Renders assistant markdown (GFM) with chat-sized typography. Caller should avoid
 * passing visibly incomplete markdown (e.g. mid typewriter) so emphasis fences parse.
 */
export function ChatAssistantMarkdown({ content }: ChatAssistantMarkdownProps): ReactElement {
  return (
    <div className="break-words">
      <Markdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  );
}
