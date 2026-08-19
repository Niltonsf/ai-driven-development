/**
 * User Profile
 * Replica: sites/demo.tailadmin.com/profile.html
 * Fidelidade: MÉDIA
 */
import { PageHeader, ProfileCard, Card, Badge, Button } from "@/shared/components/ui";

export function ProfileContent() {
  return (
    <>
      <PageHeader
        title="Profile"
        breadcrumbs={[{ label: "Início", href: "/dashboard" }, { label: "Profile" }]}
      />
      <ProfileCard
        name="Ana Beatriz Souza"
        role="Team Manager"
        badge={<Badge variant="success">Online</Badge>}
        actions={<Button variant="secondary">Editar perfil</Button>}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Informações pessoais</Card.Title>
          </Card.Header>
          <Card.Body>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Nome", "Ana Beatriz"],
                ["Sobrenome", "Souza"],
                ["Email", "ana.souza@exemplo.com.br"],
                ["Telefone", "+55 (11) 98765-4321"],
                ["Cargo", "Team Manager"],
                ["Localização", "São Paulo, BR"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-medium uppercase text-ui-gray-500">{k}</dt>
                  <dd className="mt-1 text-sm text-ui-gray-800">{v}</dd>
                </div>
              ))}
            </dl>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Endereço</Card.Title>
          </Card.Header>
          <Card.Body>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["País", "Brasil"],
                ["Estado", "SP"],
                ["Cidade", "São Paulo"],
                ["CEP", "01310-200"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-medium uppercase text-ui-gray-500">{k}</dt>
                  <dd className="mt-1 text-sm text-ui-gray-800">{v}</dd>
                </div>
              ))}
            </dl>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
