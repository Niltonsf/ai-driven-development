import { EditarContaPage } from "../../../../../modules/contas/pages/editar-conta.page";

export default async function Page({ params }: PageProps<"/contas/[id]/editar">) {
  const { id } = await params;
  return <EditarContaPage contaId={id} />;
}
