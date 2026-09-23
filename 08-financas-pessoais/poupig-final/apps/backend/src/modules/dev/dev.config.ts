import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Backend switch of the development tools.
 *
 * Only the exact value `"true"` in `DEV_TOOLS_ENABLED` turns them on; an absent
 * variable or any other value keeps them off. Production never defines it.
 */
@Injectable()
export class DevConfig {
  constructor(private readonly configService: ConfigService) {}

  get isEnabled(): boolean {
    return this.configService.get<string>('DEV_TOOLS_ENABLED') === 'true';
  }
}
