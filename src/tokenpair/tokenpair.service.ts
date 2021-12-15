import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TokenPair } from './entities/tokenpair.entity';

import * as dotenv from 'dotenv';
import { CreateTokenPairDto } from './dtos/create_tokenpair.dto';
import { getFromDto } from 'src/common/utils/repository.util';

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
    // pair.pair_address = payload.pair_address;
    // pair.token0_address = payload.token0_address;
    // pair.token0_name = payload.token0_name;
    // pair.token0_symbol = payload.token0_symbol;
    // pair.token1_address = payload.token1_address;
    // pair.token1_name = payload.token1_name;
    // pair.token1_symbol = payload.token1_symbol;
    // pair.pair_index = payload.pair_index;
    const pair: TokenPair = getFromDto(payload, new TokenPair());    
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

    async searchBSCToken(search): Promise<TokenPair[]> {
      /// mana
      // return this.tokenPairRepository.find({
      //   where: {pair_address: '0x1d6EbDaf71108fa9676FeE4B005391C467F8F0f8'}
      // })

      console.log('search: ', search);
      const query = this.tokenPairRepository.createQueryBuilder('token_pairs')
      .where(`token_pairs.token0_symbol like '%${search}%'`).getSql()
        console.log(query);

      return this.tokenPairRepository.createQueryBuilder('token_pairs')
        .where(`token_pairs.token0_symbol like '%${search}%'`)
        .getMany();
    }
}
