import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Res,
  HttpStatus,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import axios from 'axios';

import * as dotenv from 'dotenv';
import { BitqueryService } from 'src/services/bitquery.service';
import { CreateTokenPairDto } from './dtos/create_tokenpair.dto';
import { TokenPairDto } from './dtos/tokenpair.dto';
import { TokenPair } from './entities/tokenpair.entity';
import { TokenPairService } from './tokenpair.service';

dotenv.config();

function pad(num, size = 2) {
    const s = '000000000' + num;
    return s.substr(s.length - size);
}

const formatFull = (d) => 
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatMonth = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const since = () => {
    const now = new Date();
    if (now.getHours() <= 23) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return formatFull(yesterday);
    }
    return formatFull(now);
};



@Controller('token_pair')
@ApiTags('Token Pair')
@ApiBearerAuth()
export class TokenPairController {
  constructor(
    private bitqueryService: BitqueryService,
    private tokenPairService: TokenPairService,
  ) {}

  @Get()
  async getTokenPair(@Res() res) {
    res.end('success');
  }

  @Get('add')
  async addTokenPair(@Res() res) {

  }

  @Get('get_token_pairs/:token_address')
//   @ApiOkResponse(TokenPairDto)
  async getTokenPairs(@Param('token_address') token_address: string) {
      const token_pairs = await this.tokenPairService.getTokenPairs(token_address);
      return token_pairs;
  }

  @Post('get_price_chart_data')
  async getPirceChartData(@Body() body: any) {
      
      // const from = formatFull(new Date(body.from * 1000)) + 'T' + formatMonth(new Date(body.from * 1000));
      // const to = formatFull(new Date(body.to * 1000)) + 'T' + formatMonth(new Date(body.to * 1000));

      const from = body.from;
      const to = body.to;

      console.log(from, to);
      const token_pair = await this.tokenPairService.getTokenPairByPairAddress(body.pair_address);
      if (token_pair) {

        const price_chart_query = `
        {
            ethereum(network: bsc) {
              dexTrades(options: {limit: 2000, desc: "timeInterval.minute"}, date: {till: "${to}"}, exchangeName: {in: ["Pancake", "Pancake v2"]}, baseCurrency: {is: "${token_pair.token0_address}"}, quoteCurrency: {is: "${token_pair.token1_address}"}) {
                timeInterval {
                  minute(count: 45)
                }
                baseAmount
                quoteAmount
                trades: count
                quotePrice
                maximum_price: quotePrice(calculate: maximum)
                minimum_price: quotePrice(calculate: minimum)
                open_price: minimum(of: block, get: quote_price)
                close_price: maximum(of: block, get: quote_price)
              }
            }
          }
        `;

        const result = await this.bitqueryService.runQuery(price_chart_query);
        

        
        let trades = result.data.ethereum.dexTrades;

        if (trades.length > 0) {
          trades = trades.filter(trade => trade.maximum_price != trade.minimum_price);
          if (trades.length == 0) trades = result.data.ethereum.dexTrades[result.data.ethereum.dexTrades.length - 1]
          return trades;
        } else {
          return [];
        }
        

      } else {
        return [];
      }
  }

  @Post('get_lp_info')
  async getLPInfo(@Body() body: any) {
    const result = await this.tokenPairService.getLPInfo(body.pair_address);
    return result;
  }

  @Post('search_bsc_token')
  async searchBSCToken(@Body() body: any) {
    const result = await this.tokenPairService.searchBSCToken(body.search);
    return result;
  }

  
}
