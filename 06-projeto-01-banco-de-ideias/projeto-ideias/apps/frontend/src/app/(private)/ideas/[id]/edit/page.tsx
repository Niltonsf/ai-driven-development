import IdeaFormPage from '@/modules/ideas/pages/idea-form.page';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function IdeaEditRoutePage({ params }: RouteParams) {
  const { id } = await params;
  return <IdeaFormPage ideaId={id} />;
}
