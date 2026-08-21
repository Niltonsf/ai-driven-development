import IdeaTypeFormPage from '@/modules/ideas/pages/idea-type-form.page';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function IdeaTypeEditRoutePage({ params }: RouteParams) {
  const { id } = await params;
  return <IdeaTypeFormPage ideaTypeId={id} />;
}
