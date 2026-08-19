"use client";
/**
 * Auth — single route com troca de modo (login / registro / esqueci minha senha).
 *
 * Replica: o template demo.tailadmin.com NÃO inclui páginas de autenticação
 * (registrado em inventory.json — meta.warnings). Esta página gera defaults
 * coerentes usando exclusivamente primitivos/composites do design system.
 * Fidelidade: DEFAULT
 */
import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  FormField,
  Checkbox,
  Card,
} from "@/shared/components/ui";

type Mode = "login" | "register" | "forgot";

export function AuthContent() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-ui-gray-800">
            {mode === "login" && "Entrar na sua conta"}
            {mode === "register" && "Criar uma nova conta"}
            {mode === "forgot" && "Recuperar senha"}
          </h1>
          <p className="mt-1 text-sm text-ui-gray-500">
            {mode === "login" && "Bem-vindo(a) de volta — acesse seu painel."}
            {mode === "register" && "Preencha os dados abaixo para começar."}
            {mode === "forgot" && "Enviaremos um link para redefinir sua senha."}
          </p>
        </div>

        <Card>
          <Card.Body>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                console.info("[demo] auth submit", mode);
              }}
              className="flex flex-col gap-4"
            >
              {mode === "register" && (
                <FormField label="Nome completo">
                  {(p) => <Input placeholder="Seu nome" {...p} />}
                </FormField>
              )}
              <FormField label="Email">
                {(p) => <Input type="email" placeholder="voce@exemplo.com.br" {...p} />}
              </FormField>
              {mode !== "forgot" && (
                <FormField label="Senha">
                  {(p) => <Input type="password" placeholder="••••••••" {...p} />}
                </FormField>
              )}
              {mode === "register" && (
                <FormField label="Confirmar senha">
                  {(p) => <Input type="password" placeholder="••••••••" {...p} />}
                </FormField>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-ui-gray-700">
                    <Checkbox /> Lembrar de mim
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm font-medium text-ui-brand-500 hover:text-ui-brand-600"
                  >
                    Esqueci a senha
                  </button>
                </div>
              )}

              <Button type="submit" block>
                {mode === "login" && "Entrar"}
                {mode === "register" && "Criar conta"}
                {mode === "forgot" && "Enviar link"}
              </Button>
            </form>
          </Card.Body>
        </Card>

        <div className="mt-6 text-center text-sm text-ui-gray-500">
          {mode === "login" && (
            <>
              Não tem uma conta?{" "}
              <button
                type="button"
                className="font-medium text-ui-brand-500 hover:text-ui-brand-600"
                onClick={() => setMode("register")}
              >
                Cadastre-se
              </button>
            </>
          )}
          {mode === "register" && (
            <>
              Já tem uma conta?{" "}
              <button
                type="button"
                className="font-medium text-ui-brand-500 hover:text-ui-brand-600"
                onClick={() => setMode("login")}
              >
                Entrar
              </button>
            </>
          )}
          {mode === "forgot" && (
            <>
              Lembrou da senha?{" "}
              <button
                type="button"
                className="font-medium text-ui-brand-500 hover:text-ui-brand-600"
                onClick={() => setMode("login")}
              >
                Voltar para o login
              </button>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-ui-gray-500">
          <Link href="/dashboard" className="hover:text-ui-gray-700">
            ← Voltar ao painel
          </Link>
        </p>
      </div>
    </div>
  );
}
