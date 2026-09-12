// Foto de una integrante con su crédito.

import Image from 'next/image';
import { MediaFrame, type MediaRatio } from '@blackpink/ui';
import type { MemberSummary } from '@blackpink/types';

export interface MemberPhotoProps {
  member: Pick<
    MemberSummary,
    | 'stageName'
    | 'imageUrl'
    | 'imageWidth'
    | 'imageHeight'
    | 'imageAlt'
    | 'imageAuthor'
    | 'imageLicense'
    | 'imageFocus'
  >;
  ratio?: MediaRatio;
  zoom?: boolean;
  sizes: string;
  priority?: boolean;
  hideCredit?: boolean;
  className?: string;
}

export function MemberPhoto({
  member,
  ratio = 'portrait',
  zoom = false,
  sizes,
  priority = false,
  hideCredit = false,
  className,
}: MemberPhotoProps) {
  const { imageUrl, imageWidth, imageHeight } = member;

  if (!imageUrl || !imageWidth || !imageHeight) {
    return (
      <MediaFrame
        ratio={ratio}
        glyph={member.stageName.charAt(0)}
        label={member.stageName}
        zoom={zoom}
        className={className}
      />
    );
  }

  return (
    <div className="relative">
      <MediaFrame ratio={ratio} zoom={zoom} className={className}>
        <Image
          src={imageUrl}
          width={imageWidth}
          height={imageHeight}
          sizes={sizes}
          priority={priority}
          alt={member.imageAlt ?? ''}
          className="h-full w-full object-cover"
          style={{ objectPosition: member.imageFocus ?? '50% 30%' }}
        />
      </MediaFrame>

      {hideCredit ? null : <Credit member={member} />}
    </div>
  );
}

function Credit({ member }: { member: MemberPhotoProps['member'] }) {
  if (!member.imageAuthor) return null;

  return (
    <span
      className="text-fg/70 text-2xs pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 tracking-normal"
      aria-hidden="true"
    >
      © {member.imageAuthor}
      {member.imageLicense ? ` · ${member.imageLicense}` : ''}
    </span>
  );
}
