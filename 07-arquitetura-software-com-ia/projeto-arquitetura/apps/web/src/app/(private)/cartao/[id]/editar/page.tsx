import { EditarCartaoPage } from "../../../../../modules/cartao/pages/editar-cartao.page";

export default async function Page({ params }: PageProps<"/cartao/[id]/editar">) {
  const { id } = await params;
  return <EditarCartaoPage cartaoId={id} />;
}
