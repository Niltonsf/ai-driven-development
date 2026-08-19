export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "Active" | "Draft" | "Archived";
};

export const products: Product[] = Array.from({ length: 32 }, (_, i) => {
  const categories = ["Laptop", "SmartPhone", "Watch", "Accessories", "Camera"];
  const statuses: Product["status"][] = ["Active", "Draft", "Archived"];
  return {
    id: `prod-${(i + 1).toString().padStart(3, "0")}`,
    name: [
      "MacBook Pro",
      "iPhone 15",
      "Apple Watch",
      "AirPods",
      "Galaxy S24",
      "Pixel 9",
      "Dell XPS",
      "Sony WH-1000",
    ][i % 8] + ` v${(i % 5) + 1}`,
    category: categories[i % categories.length],
    price: 199 + i * 47,
    stock: 5 + (i * 13) % 200,
    status: statuses[i % statuses.length],
  };
});
