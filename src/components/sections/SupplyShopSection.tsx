import { cn } from "@/lib/utils";
import type { ProductCardData, SectionMeta, WaitlistFormConfig } from "@/types";
import { Container } from "../layout/Container";
import { Grid } from "../layout/Grid";
import { Heading, Subheading, LabelText, BodyText, Rule } from "../ui/Typography";
import { ProductCard } from "../cards/Cards";
import { WaitlistForm } from "../forms/Forms";

interface SupplyShopSectionProps {
  meta: SectionMeta;
  products: ProductCardData[];
  waitlistConfig: WaitlistFormConfig;
  className?: string;
}

export function SupplyShopSection({
  meta, products, waitlistConfig, className,
}: SupplyShopSectionProps) {
  return (
    <section className={cn("py-24 md:py-32 bg-vynl-smoke", className)}>
      <Container>
        <div className="mb-16 flex flex-col gap-5 items-center text-center">
          {meta.label && (
            <div className="flex items-center gap-4 justify-center">
              <Rule />
              <LabelText>{meta.label}</LabelText>
              <Rule />
            </div>
          )}
          <Heading as="h2" size="2xl" className="max-w-3xl">
            {meta.title}
          </Heading>
          {meta.subtitle && (
            <Subheading className="max-w-xl">{meta.subtitle}</Subheading>
          )}
        </div>
        <Grid cols={3} gap="lg" className="mb-20">
          {products.map((p) => (
            <ProductCard key={p.id} card={p} />
          ))}
        </Grid>
        <div id="shop-waitlist" className="max-w-lg mx-auto">
          <WaitlistForm {...waitlistConfig} colorScheme="smoke" />
        </div>
      </Container>
    </section>
  );
}
