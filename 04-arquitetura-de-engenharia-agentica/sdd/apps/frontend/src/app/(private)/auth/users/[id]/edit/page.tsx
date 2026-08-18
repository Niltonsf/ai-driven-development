import { UserFormPage } from '@/modules/auth/pages/user-form.page';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  return <UserFormPage userId={id} />;
}
