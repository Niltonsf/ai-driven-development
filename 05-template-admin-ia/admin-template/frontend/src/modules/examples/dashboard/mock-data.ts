/**
 * Dashboard mocks (variante eCommerce — replica de index.html do template).
 * Determinísticos, em pt-BR onde aplicável (rótulos preservados quando o template usa inglês).
 */

export type StatItem = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
};

export const stats: StatItem[] = [
  { label: "Customers", value: "3,782", delta: "11.01%", trend: "up" },
  { label: "Orders", value: "5,359", delta: "9.05%", trend: "down" },
];

export const monthlySalesCategories = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const monthlySales = [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112];

export const monthlyTargetPercent = 75.55;

export const statisticsCategories = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const statisticsSales = [180, 190, 170, 160, 175, 165, 170, 200, 180, 175, 200, 195];
export const statisticsRevenue = [40, 30, 50, 40, 55, 25, 60, 50, 70, 65, 80, 75];

export type CountryShare = { name: string; sales: string; percent: number };
export const countriesShare: CountryShare[] = [
  { name: "USA", sales: "2,379 Customers", percent: 79 },
  { name: "France", sales: "589 Customers", percent: 23 },
];

export type RecentOrder = {
  id: string;
  product: string;
  category: string;
  price: string;
  status: "Delivered" | "Pending" | "Canceled";
};

export const recentOrders: RecentOrder[] = [
  { id: "1", product: 'MacBook Pro 13"', category: "Laptop", price: "$2399.00", status: "Delivered" },
  { id: "2", product: "Apple Watch Ultra", category: "Watch", price: "$879.00", status: "Pending" },
  { id: "3", product: "iPhone 15 Pro Max", category: "SmartPhone", price: "$1869.00", status: "Delivered" },
  { id: "4", product: "iPad Pro 3rd Gen", category: "Electronics", price: "$1699.00", status: "Canceled" },
  { id: "5", product: "AirPods Pro 2nd Gen", category: "Accessories", price: "$240.00", status: "Delivered" },
];
