/**
 * Customers Demographic — placeholder de mapa substituído por lista de países
 * (composite de mapa não disponível na app — adaptação registrada no header).
 */
import { Card, Progress } from "@/shared/components/ui";
import { countriesShare } from "../mock-data";

export function CustomersDemographicCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Customers Demographic</Card.Title>
      </Card.Header>
      <Card.Body>
        <p className="text-sm text-ui-gray-500">
          Number of customers based on country (mapa substituído por lista — adaptação registrada).
        </p>
        <ul className="mt-5 flex flex-col gap-5">
          {countriesShare.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ui-gray-100 text-xs font-semibold text-ui-gray-700">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ui-gray-800">{c.name}</span>
                    <span className="text-xs text-ui-gray-500">{c.percent}%</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ui-gray-500">{c.sales}</p>
                  <Progress value={c.percent} className="mt-2" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card.Body>
    </Card>
  );
}
