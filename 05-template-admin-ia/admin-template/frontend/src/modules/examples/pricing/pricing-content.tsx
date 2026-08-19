/**
 * Pricing tables
 * Replica: sites/demo.tailadmin.com/pricing-tables.html
 * Fidelidade: ALTA — composição direta com PricingCard.
 */
import { PageHeader, PricingCard, Button } from "@/shared/components/ui";

export function PricingContent() {
  return (
    <>
      <PageHeader
        title="Pricing tables"
        breadcrumbs={[{ label: "Início", href: "/dashboard" }, { label: "Pricing" }]}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PricingCard
          planName="Starter"
          price="$19"
          period="/mês"
          description="Para times pequenos começando."
          features={[
            "5 projetos",
            "10 GB de armazenamento",
            "Suporte por email",
          ]}
          cta={<Button variant="secondary" block>Escolher Starter</Button>}
        />
        <PricingCard
          variant="featured"
          planName="Pro"
          price="$49"
          period="/mês"
          description="O plano mais popular."
          features={[
            "25 projetos",
            "100 GB de armazenamento",
            "Suporte prioritário",
            "Integrações avançadas",
          ]}
          cta={<Button block>Escolher Pro</Button>}
        />
        <PricingCard
          planName="Business"
          price="$99"
          period="/mês"
          description="Para empresas em crescimento."
          features={[
            "Projetos ilimitados",
            "1 TB de armazenamento",
            "Suporte 24/7",
            "SSO e auditoria",
          ]}
          cta={<Button variant="secondary" block>Escolher Business</Button>}
        />
      </div>
    </>
  );
}
