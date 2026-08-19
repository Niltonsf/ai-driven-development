export type User = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "Ativo" | "Inativo" | "Pendente";
  createdAt: string;
};

const firstNames = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Felipe", "Gabriela", "Henrique", "Isabela", "João"];
const lastNames = ["Souza", "Lima", "Pereira", "Oliveira", "Costa", "Almeida", "Ribeiro", "Mendes", "Cardoso", "Barros"];
const roles: User["role"][] = ["Admin", "Editor", "Viewer"];
const statuses: User["status"][] = ["Ativo", "Inativo", "Pendente"];

export const users: User[] = Array.from({ length: 24 }, (_, i) => {
  const f = firstNames[i % firstNames.length];
  const l = lastNames[(i * 3) % lastNames.length];
  return {
    id: `u-${i + 1}`,
    name: `${f} ${l}`,
    email: `${f.toLowerCase()}.${l.toLowerCase()}@exemplo.com.br`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    createdAt: `2025-${String(((i % 12) + 1)).padStart(2, "0")}-15`,
  };
});
