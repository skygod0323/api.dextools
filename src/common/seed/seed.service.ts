import { Injectable } from '@nestjs/common';
import { TokenPairService } from 'src/tokenpair/tokenpair.service';

import { token_pairs } from './seed_tokenpair';

@Injectable()
export class SeedService {
  constructor(private readonly tokenpairService: TokenPairService) {}

  async startDevelopmentSeed() {
    await this.seedTokenPairs();
  }

  async seedTokenPairs() {
    await Promise.all(
      token_pairs.map(async (pair) => {
        await this.tokenpairService.addTokenPair(pair as any, false);
      }),
    );
  }
}