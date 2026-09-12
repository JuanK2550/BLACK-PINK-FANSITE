// Cabecera común de las páginas interiores.

import { Container } from '@blackpink/ui';

export interface PageHeaderProps {
  title: string;
  description: string;
  aside?: string;
}

export function PageHeader({ title, description, aside }: PageHeaderProps) {
  return (
    <Container width="wide" className="pb-block pt-block">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-display text-fg hyphens-auto text-balance text-3xl font-extrabold sm:text-4xl">
            {title}
          </h1>
          <p className="text-fg-muted mt-4 max-w-prose text-pretty text-lg">{description}</p>
        </div>
        {aside ? (
          <p data-numeric className="text-fg-subtle text-2xs shrink-0" data-uppercase>
            {aside}
          </p>
        ) : null}
      </div>
    </Container>
  );
}
