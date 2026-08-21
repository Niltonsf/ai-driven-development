import { ProcessingDetailComponent } from '@/modules/ideas/components/processing-detail.component';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function ProcessingDetailRoutePage({
  params,
}: RouteParams) {
  const { id } = await params;
  return <ProcessingDetailComponent processingId={id} />;
}
