// Canciones de una playlist: las cinco primeras y el resto bajo un botón.
'use client';

import { useState } from 'react';
import type { PlaylistEntry } from '@blackpink/types';

const VISIBLE = 5;

export interface PlaylistEntriesProps {
  entries: PlaylistEntry[];
  labels: { more: string; less: string };
}

export function PlaylistEntries({ entries, labels }: PlaylistEntriesProps) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? entries : entries.slice(0, VISIBLE);

  return (
    <>
      <ol className="mt-5 flex-1">
        {shown.map((entry) => (
          <li
            key={entry.position}
            className="border-line flex items-baseline gap-3 border-b py-2 last:border-b-0"
          >
            <span data-numeric className="text-fg-subtle w-5 shrink-0 text-xs">
              {String(entry.position).padStart(2, '0')}
            </span>
            <span className="text-fg min-w-0 flex-1 truncate text-sm">{entry.title}</span>
            {entry.subtitle ? (
              <span className="text-fg-subtle shrink-0 truncate text-xs">{entry.subtitle}</span>
            ) : null}
          </li>
        ))}
      </ol>

      {entries.length > VISIBLE ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="text-fg-subtle hover:text-accent-text focus-visible:outline-focus ease-out-soft mt-3 self-start text-xs underline underline-offset-4 transition-colors duration-[var(--dur-2)] focus-visible:outline-2"
        >
          {expanded ? labels.less : labels.more}
        </button>
      ) : null}
    </>
  );
}
