import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TokenPair } from './entities/tokenpair.entity';

import * as dotenv from 'dotenv';
import { CreateTokenPairDto } from './dtos/create_tokenpair.dto';

dotenv.config();




@Injectable()
export class TokenPairService {
  constructor(
    @InjectRepository(TokenPair)
    private readonly tokenPairRepository: Repository<TokenPair>,
  ) {}

  async addTokenPair(payload: CreateTokenPairDto, throwError = true) {
    const found = await this.tokenPairRepository.findOne({
      pair_address: payload.pair_address,
    });

    if (found) {
      if (throwError) {
        throw new BadRequestException('Token Pair already exists');
      } else {
        return found;
      }
    }
    const pair = new TokenPair();
    pair.pair_address = payload.pair_address;
    pair.token0_address = payload.token0_address;
    pair.token0_name = payload.token0_name;
    pair.token0_symbol = payload.token0_symbol;
    pair.token1_address = payload.token1_address;
    pair.token1_name = payload.token1_name;
    pair.token1_symbol = payload.token1_symbol;
    return this.tokenPairRepository.save(pair);
  }

    getTokenPairs(token_address: string): Promise<TokenPair[]> {
        return this.tokenPairRepository.find({
            where: { token0_address: token_address }
        });
    }

    getTokenPairByPairAddress(pair_address: string): Promise<TokenPair> {
        return this.tokenPairRepository.findOne({
            where: {pair_address: pair_address}
        })
    }
}