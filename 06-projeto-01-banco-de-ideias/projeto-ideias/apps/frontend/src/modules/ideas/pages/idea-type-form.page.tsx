import { IdeaTypeFormComponent } from '../components/idea-type-form.component';

interface IdeaTypeFormPageProps {
  ideaTypeId?: string;
}

export default function IdeaTypeFormPage({ ideaTypeId }: IdeaTypeFormPageProps) {
  return <IdeaTypeFormComponent ideaTypeId={ideaTypeId} />;
}
