export interface DefaultSubcategoryDefinition {
  name: string;
  icon: string;
  color: string;
  order: number;
}

export interface DefaultCategoryDefinition {
  name: string;
  icon: string;
  color: string;
  subcategories: DefaultSubcategoryDefinition[];
}

export const DEFAULT_CATEGORIES: readonly DefaultCategoryDefinition[] = [
  {
    name: 'Moradia',
    icon: 'home',
    color: '#4A90D9',
    subcategories: [
      { name: 'Aluguel ou Financiamento', icon: 'building', color: '#4A90D9', order: 1 },
      { name: 'Condomínio', icon: 'building-2', color: '#4A90D9', order: 2 },
      { name: 'Energia Elétrica', icon: 'zap', color: '#4A90D9', order: 3 },
      { name: 'Água e Esgoto', icon: 'droplet', color: '#4A90D9', order: 4 },
      { name: 'Gás', icon: 'flame', color: '#4A90D9', order: 5 },
      { name: 'Internet e TV', icon: 'wifi', color: '#4A90D9', order: 6 },
      { name: 'Manutenção e Reparos', icon: 'wrench', color: '#4A90D9', order: 7 },
    ],
  },
  {
    name: 'Alimentação',
    icon: 'utensils',
    color: '#F5A623',
    subcategories: [
      { name: 'Supermercado', icon: 'shopping-cart', color: '#F5A623', order: 1 },
      { name: 'Restaurantes e Delivery', icon: 'utensils-crossed', color: '#F5A623', order: 2 },
      { name: 'Padaria', icon: 'croissant', color: '#F5A623', order: 3 },
      { name: 'Feira', icon: 'carrot', color: '#F5A623', order: 4 },
    ],
  },
  {
    name: 'Transporte',
    icon: 'car',
    color: '#7ED321',
    subcategories: [
      { name: 'Combustível', icon: 'fuel', color: '#7ED321', order: 1 },
      { name: 'Transporte Público', icon: 'bus', color: '#7ED321', order: 2 },
      { name: 'Aplicativos de Transporte', icon: 'car-taxi-front', color: '#7ED321', order: 3 },
      { name: 'Estacionamento e Pedágio', icon: 'parking-circle', color: '#7ED321', order: 4 },
      { name: 'Manutenção do Veículo', icon: 'car-front', color: '#7ED321', order: 5 },
      { name: 'Seguro do Veículo', icon: 'shield-check', color: '#7ED321', order: 6 },
    ],
  },
  {
    name: 'Saúde',
    icon: 'heart-pulse',
    color: '#D0021B',
    subcategories: [
      { name: 'Plano de Saúde', icon: 'shield-plus', color: '#D0021B', order: 1 },
      { name: 'Farmácia', icon: 'pill', color: '#D0021B', order: 2 },
      { name: 'Consultas e Exames', icon: 'stethoscope', color: '#D0021B', order: 3 },
      { name: 'Academia e Bem-estar', icon: 'dumbbell', color: '#D0021B', order: 4 },
    ],
  },
  {
    name: 'Educação',
    icon: 'graduation-cap',
    color: '#9013FE',
    subcategories: [
      { name: 'Mensalidade Escolar', icon: 'school', color: '#9013FE', order: 1 },
      { name: 'Cursos e Idiomas', icon: 'book-open', color: '#9013FE', order: 2 },
      { name: 'Material Didático', icon: 'notebook', color: '#9013FE', order: 3 },
      { name: 'Livros', icon: 'book', color: '#9013FE', order: 4 },
    ],
  },
  {
    name: 'Lazer',
    icon: 'party-popper',
    color: '#F8E71C',
    subcategories: [
      { name: 'Cinema e Streaming', icon: 'clapperboard', color: '#F8E71C', order: 1 },
      { name: 'Viagens', icon: 'plane', color: '#F8E71C', order: 2 },
      { name: 'Hobbies', icon: 'gamepad-2', color: '#F8E71C', order: 3 },
      { name: 'Eventos e Shows', icon: 'ticket', color: '#F8E71C', order: 4 },
    ],
  },
  {
    name: 'Vestuário',
    icon: 'shirt',
    color: '#50E3C2',
    subcategories: [
      { name: 'Roupas', icon: 'shirt', color: '#50E3C2', order: 1 },
      { name: 'Calçados', icon: 'footprints', color: '#50E3C2', order: 2 },
      { name: 'Acessórios', icon: 'watch', color: '#50E3C2', order: 3 },
    ],
  },
  {
    name: 'Contas e Serviços',
    icon: 'receipt',
    color: '#4A4A4A',
    subcategories: [
      { name: 'Telefone Celular', icon: 'smartphone', color: '#4A4A4A', order: 1 },
      { name: 'Assinaturas Digitais', icon: 'monitor-play', color: '#4A4A4A', order: 2 },
      { name: 'Serviços Domésticos', icon: 'sparkle', color: '#4A4A4A', order: 3 },
      { name: 'Seguros', icon: 'shield', color: '#4A4A4A', order: 4 },
    ],
  },
  {
    name: 'Cuidados Pessoais',
    icon: 'sparkles',
    color: '#B8860B',
    subcategories: [
      { name: 'Cabeleireiro e Estética', icon: 'scissors', color: '#B8860B', order: 1 },
      { name: 'Higiene Pessoal', icon: 'shower-head', color: '#B8860B', order: 2 },
      { name: 'Cosméticos', icon: 'sparkles', color: '#B8860B', order: 3 },
    ],
  },
  {
    name: 'Filhos e Família',
    icon: 'baby',
    color: '#FF6F91',
    subcategories: [
      { name: 'Creche e Babá', icon: 'baby', color: '#FF6F91', order: 1 },
      { name: 'Brinquedos', icon: 'blocks', color: '#FF6F91', order: 2 },
      { name: 'Mesada', icon: 'wallet', color: '#FF6F91', order: 3 },
      { name: 'Roupas Infantis', icon: 'shirt', color: '#FF6F91', order: 4 },
    ],
  },
  {
    name: 'Pets',
    icon: 'paw-print',
    color: '#8B572A',
    subcategories: [
      { name: 'Ração e Petiscos', icon: 'bone', color: '#8B572A', order: 1 },
      { name: 'Veterinário e Vacinas', icon: 'syringe', color: '#8B572A', order: 2 },
      { name: 'Banho e Tosa', icon: 'scissors', color: '#8B572A', order: 3 },
      { name: 'Acessórios para Pets', icon: 'paw-print', color: '#8B572A', order: 4 },
    ],
  },
  {
    name: 'Financeiro e Investimentos',
    icon: 'piggy-bank',
    color: '#417505',
    subcategories: [
      { name: 'Poupança', icon: 'piggy-bank', color: '#417505', order: 1 },
      { name: 'Investimentos', icon: 'trending-up', color: '#417505', order: 2 },
      { name: 'Empréstimos e Financiamentos', icon: 'landmark', color: '#417505', order: 3 },
      { name: 'Fatura do Cartão de Crédito', icon: 'credit-card', color: '#417505', order: 4 },
      { name: 'Taxas e Tarifas Bancárias', icon: 'percent', color: '#417505', order: 5 },
    ],
  },
  {
    name: 'Presentes e Doações',
    icon: 'gift',
    color: '#E91E63',
    subcategories: [
      { name: 'Presentes', icon: 'gift', color: '#E91E63', order: 1 },
      { name: 'Doações', icon: 'hand-heart', color: '#E91E63', order: 2 },
      { name: 'Celebrações', icon: 'cake', color: '#E91E63', order: 3 },
    ],
  },
  {
    name: 'Impostos e Taxas',
    icon: 'landmark',
    color: '#607D8B',
    subcategories: [
      { name: 'IPTU', icon: 'home', color: '#607D8B', order: 1 },
      { name: 'IPVA', icon: 'car', color: '#607D8B', order: 2 },
      { name: 'Imposto de Renda', icon: 'file-text', color: '#607D8B', order: 3 },
      { name: 'Taxas Diversas', icon: 'receipt', color: '#607D8B', order: 4 },
    ],
  },
] as const;
