import Image from "next/image";
import Link from "next/link";
import type { TopbarConfig } from "./topbar.types";

type Props = { brand: TopbarConfig["brand"] };

/**
 * TopbarBrand — logo presente APENAS no mobile (xl:hidden), pois no desktop o
 * logo vive na sidebar. Replica fielmente o `<a class="xl:hidden">` do template.
 */
export function TopbarBrand({ brand }: Props) {
  return (
    <Link href={brand.href} className="xl:hidden">
      <Image src={brand.logoSrc} alt={brand.alt} width={150} height={32} priority />
    </Link>
  );
}
