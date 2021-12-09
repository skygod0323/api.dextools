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
import * as fs from 'fs';
import { TelegramService } from './telegram.service';
import axios from 'axios';

import * as dotenv from 'dotenv';
import { BitqueryService } from 'src/services/bitquery.service';

dotenv.config();

const APP_URL = process.env.APP_URL;
const BSC_KEY = process.env.BSC_KEY;

const formatDate = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

@Controller('api/bot')
@ApiTags('Api')
@ApiBearerAuth()
export class TelegramController {
  constructor(
    private telegramService: TelegramService,
    private bitqueryService: BitqueryService,
  ) {}

  @Get()
  async getBot(@Res() res) {
    const query = `
      ethereum(network: bsc) {
        address(address: {is: "0x4319e7a95fd3f0660d25bc6a4ecdc0f3cb4200c5"}) {
          balances {
            currency {
              address
              symbol
              tokenType
            }
            value
          }
        }
      `;
    const result = await this.bitqueryService.runQuery(query);
    console.log(result);
  }

  @Get('uploads/:fileName')
  image(@Param('fileName') fileName: string, @Res() response) {
    try {
      const buffer = fs.readFileSync(
        `${__dirname}/../../public/uploads/${fileName}.png`,
      );
      response.writeHead(200, { 'Content-Type': 'image/png' });
      response.end(buffer);
    } catch (e) {
      console.log('e');
      throw new NotFoundException(
        'Image not found. Please wait for a while for the chart to be generated.',
      );
    }
  }

  @Post()
  @ApiOkResponse()
  async telegram_bot_req(@Body() body: any, @Res() res) {
    const msg = body.message.text;
    const group = body.message.chat.id;
    console.log(body, group);

    try {
      if (msg.indexOf('/marco') >= 0) {
        const param = {
          chat_id: body.message.chat.id,
          text: 'Marco message',
        };

        await this.sendMessage(param);

        return res.end('ok');
      } else if (msg.indexOf('/set_token') >= 0) {
        const tokenAddress = msg.substr(11);

        const bot = await this.telegramService.setBot({
          group: group,
          network: 'bsc',
          address: tokenAddress,
        });
        console.log(bot);

        const param = {
          chat_id: body.message.chat.id,
          text: 'Bot Successfully Added',
        };

        this.telegramService.handleFunction();

        await this.sendMessage(param);

        return res.end('ok');
      } else if (msg.indexOf('/price') >= 0) {
        const bot = await this.telegramService.getBotInfoByGroupId(group);

        let base_price;
        if (bot.network == 'bsc') {
          const now = new Date();
          const apiUrl = `https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=${BSC_KEY}`;
          const res = await axios.get(apiUrl);
          base_price = res.data.result.ethusd;
        }

        let market_cap: any = Number(bot.price) * Number(bot.supply);
        market_cap = market_cap.toFixed(3);

        const text = `<b><a href="${APP_URL}api/bot/uploads/chart-${group}">price chart</a></b>

Token: <b>${bot.name}(${bot.symbol})</b>
Price: <b>$${bot.price}</b>
Total Supply: <b>${bot.supply}</b>
Market Cap: <b>$${market_cap}</b>
BNB Price: <b>${base_price}</b>

Contract Address: ${bot.address}
                  `;

        console.log(text);
        const param = {
          chat_id: body.message.chat.id,
          parse_mode: 'html',
          disable_web_page_preview: false,
          text: text,
        };

        await this.sendMessage(param);

        return res.end('ok');
      }
    } catch (e) {
      console.log('error');
      console.log(e);
      return res.end();
    }

    return res.end();
  }

  sendMessage(param) {
    return axios.post(
      'https://api.telegram.org/bot2145651894:AAHRFtKUvrFNArD-bmd3xZm_90lKaNN2lAY/sendMessage',
      param,
    );
  }

  sendPhoto(param) {
    return axios.post(
      'https://api.telegram.org/bot2145651894:AAHRFtKUvrFNArD-bmd3xZm_90lKaNN2lAY/sendphoto',
      param,
    );
  }
}
