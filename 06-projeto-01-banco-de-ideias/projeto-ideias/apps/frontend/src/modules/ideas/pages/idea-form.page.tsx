import { IdeaFormComponent } from '../components/idea-form.component';

interface IdeaFormPageProps {
  ideaId?: string;
}

export default function IdeaFormPage({ ideaId }: IdeaFormPageProps) {
  return <IdeaFormComponent ideaId={ideaId} />;
}
