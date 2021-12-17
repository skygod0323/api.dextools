import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TokenPair } from './entities/tokenpair.entity';

import * as dotenv from 'dotenv';
import { CreateTokenPairDto } from './dtos/create_tokenpair.dto';
import { getFromDto } from 'src/common/utils/repository.util';
import { Timeout } from '@nestjs/schedule';
import config from 'src/cronjob/config';
import axios from 'axios';

dotenv.config();


const Web3 = require("web3");
const bsc_web3 = new Web3(new Web3.providers.HttpProvider(config.BSC_MAINNET));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

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

      const result = await this.tokenPairRepository.createQueryBuilder('token_pairs')
        .select("token0_address, token0_symbol, token0_name")
        .where(`token0_address like '%${search}%'`)
        .orWhere(`token0_symbol like '%${search}%'`)
        .orWhere(`token0_name like '%${search}%'`)
        .groupBy('token0_address, token0_symbol, token0_name')
        .getRawMany();

      return result;
    }

    async getLPInfo(pair_address: String) {
      try {
        const pair = await this.tokenPairRepository.findOne({
          where: {pair_address: pair_address}
        })
  
        console.log(pair);
  
        const token1_info_url = `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${pair.token1_address}&apikey=${process.env.BSC_KEY}`;
  
        console.log('getting token1 info');
        let res = await axios.get(token1_info_url);
        console.log(res.data);
        while(res.data.message == 'NOTOK') {
            await delay(500)          /// if failed, delay 1s and try again;
            res = await axios.get(token1_info_url);
        }
        const token1_info: any = res.data.result[0];
        console.log(token1_info);
  
        const token1_balance_url = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${pair.token1_address}&address=${pair.pair_address}&tag=latest&apikey=${process.env.BSC_KEY}`;
        console.log('getting token1 balance');
        res = await axios.get(token1_balance_url);
        console.log(res.data);
        while(res.data.message == 'NOTOK') {
            await delay(500)          /// if failed, delay 1s and try again;
            res = await axios.get(token1_balance_url);
        }
        const token1_balance: any = JSON.parse(res.data.result);
  
        return {decimal: token1_info.divisor, balance: token1_balance};
      } catch {
        return false;
      }
    }

    @Timeout(0)
    async test() {
      // const pair = await this.tokenPairRepository.findOne({
      //   where: {pair_address: '0x1d6EbDaf71108fa9676FeE4B005391C467F8F0f8'}
      // })

      // console.log(pair);

      // const token1_info_url = `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${pair.token1_address}&apikey=${process.env.BSC_KEY}`;

      // console.log('getting token1 info');
      // let res = await axios.get(token1_info_url);
      // console.log(res.data);
      // while(res.data.message == 'NOTOK') {
      //     await delay(500)          /// if failed, delay 1s and try again;
      //     res = await axios.get(token1_info_url);
      // }
      // const token1_info: any = res.data.result;
      // console.log(token1_info);

      // const token1_balance_url = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${pair.token1_address}&address=${pair.pair_address}&tag=latest&apikey=${process.env.BSC_KEY}`;
      // console.log('getting token1 balance');
      // res = await axios.get(token1_balance_url);
      // console.log(res.data);
      // while(res.data.message == 'NOTOK') {
      //     await delay(500)          /// if failed, delay 1s and try again;
      //     res = await axios.get(token1_balance_url);
      // }
      // const token0_balance: any = JSON.parse(res.data.result);




      
      // console.log(token0_balance);
    }
}
