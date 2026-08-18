import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DeleteProduct, SaveProduct, type SaveProductIn, Product } from '@sdd/catalog';
import { PrismaProductRepository } from './product.prisma';

interface ProductPageQuery {
  page?: string;
  perPage?: string;
}

function toResponse(product: Product) {
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

@Controller('products')
export class ProductController {
  constructor(private readonly productRepository: PrismaProductRepository) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: SaveProductIn): Promise<void> {
    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute(body);
  }

  @Put(':id')
  @HttpCode(200)
  async update(
    @Param('id') id: string,
    @Body() body: Omit<SaveProductIn, 'id'>,
  ): Promise<void> {
    const useCase = new SaveProduct(this.productRepository);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteProduct(this.productRepository);
    await useCase.execute({ id });
  }

  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string) {
    const product = await this.productRepository.findById(id);
    return product ? toResponse(product) : null;
  }

  @Get()
  @HttpCode(200)
  async findPage(@Query() query: ProductPageQuery) {
    const page = Number(query.page ?? 1);
    const perPage = Number(query.perPage ?? 10);
    const result = await this.productRepository.findPage({ page, perPage });
    return {
      ...result,
      items: result.items.map((product) => toResponse(product)),
    };
  }
}
