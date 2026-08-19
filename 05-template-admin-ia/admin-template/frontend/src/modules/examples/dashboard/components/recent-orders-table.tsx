/**
 * Recent Orders — DataTable compacta (replica bloco "Recent Orders").
 */
"use client";
import { Card, Badge, DataTable } from "@/shared/components/ui";
import type { DataTableColumn } from "@/shared/components/ui";
import { recentOrders, type RecentOrder } from "../mock-data";

const statusVariant: Record<RecentOrder["status"], "success" | "warning" | "error"> = {
  Delivered: "success",
  Pending: "warning",
  Canceled: "error",
};

const columns: DataTableColumn<RecentOrder>[] = [
  { key: "product", header: "Products", cell: (r) => r.product },
  { key: "category", header: "Category", cell: (r) => r.category },
  { key: "price", header: "Price", cell: (r) => r.price },
  {
    key: "status",
    header: "Status",
    cell: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge>,
  },
];

export function RecentOrdersTable() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Recent Orders</Card.Title>
      </Card.Header>
      <DataTable columns={columns} data={recentOrders} rowKey={(r) => r.id} />
    </Card>
  );
}
