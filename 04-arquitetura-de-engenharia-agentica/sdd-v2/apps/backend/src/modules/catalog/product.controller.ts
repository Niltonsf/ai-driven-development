import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  DeleteProduct,
  Product,
  ProductNotFoundError,
  ProductStatus,
  SaveProduct,
} from '@sdd/catalog';
import type { SaveProductIn } from '@sdd/catalog';
import { PrismaProductRepository } from './product.prisma';

interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  availableOnline: boolean;
  featured: boolean;
  allowsPreOrder: boolean;
}

interface ProductPageResponse {
  items: ProductResponse[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

@Controller('products')
export class ProductController {
  constructor(private readonly productRepository: PrismaProductRepository) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveProductIn): Promise<void> {
    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute(body);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveProductIn, 'id'>,
  ): Promise<void> {
    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteProduct(this.productRepository);
    await useCase.execute({ id });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponse> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return this.toResponse(product);
  }

  @Get()
  async findPage(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<ProductPageResponse> {
    const pageNumber = parsePositiveInt(page) ?? DEFAULT_PAGE;
    const perPageNumber = parsePositiveInt(perPage) ?? DEFAULT_PER_PAGE;
    const result = await this.productRepository.findPage({
      page: pageNumber,
      perPage: perPageNumber,
    });
    return {
      items: result.items.map((product) => this.toResponse(product)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    };
  }

  private toResponse(product: Product): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      status: product.status,
      availableOnline: product.availableOnline,
      featured: product.featured,
      allowsPreOrder: product.allowsPreOrder,
    };
  }
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}
