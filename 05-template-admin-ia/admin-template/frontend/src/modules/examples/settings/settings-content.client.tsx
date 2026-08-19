"use client";
/**
 * Settings
 * Replica: sem equivalente direto no template — defaults coerentes (account/security/notifications).
 * Fidelidade: DEFAULT
 */
import { useState } from "react";
import {
  PageHeader,
  Tabs,
  FormSection,
  FormFooter,
  FormField,
  Input,
  Switch,
  Button,
  Label,
} from "@/shared/components/ui";

export function SettingsContent() {
  const [tab, setTab] = useState("account");

  return (
    <>
      <PageHeader
        title="Configurações"
        breadcrumbs={[{ label: "Início", href: "/dashboard" }, { label: "Configurações" }]}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="account">Conta</Tabs.Trigger>
          <Tabs.Trigger value="security">Segurança</Tabs.Trigger>
          <Tabs.Trigger value="notifications">Notificações</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="account">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.info("[demo] settings/account");
            }}
            className="flex flex-col gap-5"
          >
            <FormSection title="Dados da conta" description="Informações públicas do perfil.">
              <FormField label="Nome">
                {(p) => <Input {...p} defaultValue="Ana Beatriz" />}
              </FormField>
              <FormField label="Email">
                {(p) => <Input type="email" {...p} defaultValue="ana@exemplo.com.br" />}
              </FormField>
            </FormSection>
            <FormFooter>
              <Button variant="ghost" type="button">Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </FormFooter>
          </form>
        </Tabs.Content>

        <Tabs.Content value="security">
          <FormSection title="Segurança" description="Atualize sua senha e ative 2FA.">
            <FormField label="Senha atual">{(p) => <Input type="password" {...p} />}</FormField>
            <FormField label="Nova senha">{(p) => <Input type="password" {...p} />}</FormField>
            <div className="flex items-center justify-between">
              <Label>Autenticação em dois fatores</Label>
              <Switch />
            </div>
          </FormSection>
        </Tabs.Content>

        <Tabs.Content value="notifications">
          <FormSection title="Notificações por email">
            <div className="flex items-center justify-between">
              <Label>Resumo semanal</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Alertas de segurança</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Novidades do produto</Label>
              <Switch />
            </div>
          </FormSection>
        </Tabs.Content>
      </Tabs>
    </>
  );
}
