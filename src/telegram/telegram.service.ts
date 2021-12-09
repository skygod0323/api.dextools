import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';

import { Setting } from './entities/setting.entity';
import axios from 'axios';

const fs = require('fs');
import { setContext } from 'apollo-link-context';
const gql = require('graphql-tag');
const ApolloClient = require('apollo-boost').ApolloClient;
const fetch = require('cross-fetch/polyfill').fetch;
const createHttpLink = require('apollo-link-http').createHttpLink;
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;
const PImage = require('pureimage');

import * as dotenv from 'dotenv';
import { Bot } from './entities/bot.entity';

dotenv.config();

const API_URI = 'https://graphql.bitquery.io/';
const API_KEY = 'BQYfX4lPeSm1TEfHiyBBpJeJVa1coppX';
const DATA_DIR = process.env.DATA_DIR || '/mnt/e/uploads/';
const ASSETS_DIR = process.env.ASSETS_DIR || './assets/';

function pad(num, size = 2) {
  const s = '000000000' + num;
  return s.substr(s.length - size);
}

const formatFull = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
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

const httpLink = createHttpLink({
  uri: API_URI,
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      'X-API-KEY': API_KEY ? API_KEY : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function fetchPrices(network, baseCurrency, quoteCurrency) {
  const query = gql`{
  ethereum(network: bsc) {
    dexTrades(options: {limit: 300, asc: "timeInterval.minute"}, date: {since: "${since()}"}, exchangeName: {in: ["Pancake", "Pancake v2"]}, baseCurrency: {is: "${baseCurrency}"}, quoteCurrency: {is: "${quoteCurrency}"}) {
      timeInterval {
        minute(count: 15)
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
  return client.query({ query });
}

function drawChart(data, group, showAxis): Promise<string> {
  const width = 900;
  const height = 500;
  const tickCount = 100;
  const xValueCount = 10;
  const yValueCount = 15;
  const padding = showAxis ? 30 : 20;
  const xrPadding = showAxis ? 100 : 20;
  const yFont = 12;
  const xFont = 14;

  // console.log(data);

  if (data.length > tickCount) {
    data = data.slice(data.length - tickCount, data.length);
  }

  const count = data.length;

  let allMax = 0;
  let allMin = Number(data[0].close_price);

  const prices = data.map((row, index) => {
    let upOrDown;
    const closePrice = Number(row.close_price);
    const openPrice = Number(row.open_price);
    if (index === 0) {
      upOrDown = closePrice >= openPrice;
    } else {
      upOrDown = closePrice > Number(data[index - 1].close_price);
    }
    if (closePrice > allMax) {
      allMax = closePrice;
    }
    if (closePrice < allMin) {
      allMin = closePrice;
    }
    return {
      time: row.timeInterval.minute,
      max: Number(row.maximum_price),
      min: Number(row.minimum_price),
      open: openPrice,
      close: closePrice,
      up: upOrDown,
    };
  });

  // calculate x-axis labels(time)
  const startDate = new Date(prices[0].time);
  const endDate = new Date(prices[count - 1].time);
  const diff = (endDate.getTime() - startDate.getTime()) / xValueCount;
  const times = new Array(xValueCount).fill(0).map((_, index) => {
    return formatMonth(new Date(startDate.getTime() + diff * index));
  });

  // calculate y-axis labels(value)
  const vDiff = (allMax - allMin) / yValueCount;
  const values = new Array(yValueCount).fill(0).map((_, index) => {
    const value = Number(allMin + index * vDiff);
    return value.toFixed(6);
  });

  const font = PImage.registerFont(`${ASSETS_DIR}font/verdana.ttf`, 'Verdana');
  return new Promise((resolve, reject) => {
    font.load(() => {
      const image = PImage.make(width, height);
      const context = image.getContext('2d');

      const yDiff = Math.abs(allMax - allMin);

      const xx = (width - padding * 2 - xrPadding) / count;
      const yx = (height - padding * 2) / yDiff;

      // fill background
      context.fillStyle = 'rgb(0, 0, 0)';
      context.fillRect(0, 0, width, height);

      // set line style
      context.strokeStyle = 'rgb(255, 255, 255)';
      context.lineWidth = Math.min(10, xx - 1);

      // draw prices
      for (let i = 0; i < count; i++) {
        const x = padding + xx * i;
        const sy = height - padding - (prices[i].open - allMin) * yx;
        const ey = height - padding - (prices[i].close - allMin) * yx;
        if (prices[i].up) {
          context.strokeStyle = '#26A69A';
        } else {
          context.strokeStyle = '#EF5350';
        }
        context.beginPath();
        context.moveTo(x, sy);
        context.lineTo(x, ey);
        context.stroke();
      }
      if (showAxis) {
        // draw x-axis values
        const xw = (width - padding - xrPadding) / xValueCount;
        context.fillStyle = 'white';
        context.font = `${xFont}pt Verdana`;
        for (let i = 0; i < xValueCount; i++) {
          context.fillText(
            times[i],
            i * xw + padding,
            height - padding / 2 + 5,
          );
        }

        // draw y-axis values
        context.font = `${yFont}pt Verdana`;
        const yw = (height - padding * 2) / yValueCount;
        for (let i = 0; i < yValueCount; i++) {
          context.fillText(
            values[i],
            width - xrPadding,
            height - padding - i * yw - yFont,
          );
        }
      }

      // write to an image file
      const timestamp = new Date().getTime();
      const filePath = `${DATA_DIR}${'chart-' + group}.png`;
      PImage.encodePNGToStream(image, fs.createWriteStream(filePath))
        .then(() => {
          resolve(filePath);
        })
        .catch((e) => {
          reject(e);
        });
    });
  });
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(Bot)
    private readonly botRepository: Repository<Bot>,
  ) {}

  async getSetting(key: string) {
    const value = await this.settingRepository.findOne({ key: key });
    return value;
  }

  async setBot(param: any, throwError = true) {
    let bot = await this.botRepository.findOne({
      group: param.group,
    });
    if (bot) {
      bot.network = param.network;
      bot.address = param.address;
    } else {
      bot = new Bot();
      bot.group = param.group;
      bot.network = param.network;
      bot.address = param.address;
    }

    return this.botRepository.save(bot);
  }

  async generateImage(
    network,
    baseCurrency,
    quote_currency,
    group,
    showAxis = false,
  ): Promise<string> {
    try {
      const res = await fetchPrices(network, baseCurrency, quote_currency);
      const data = res.data.ethereum.dexTrades;
      return drawChart(data, group, showAxis);
    } catch (error) {
      console.log(error);
    }
  }

  async getBotInfoByGroupId(groupId: string) {
    const bot = await this.botRepository.findOne({
      group: groupId,
    });

    return bot;
  }

  @Cron('*/30 * * * * *')
  async handleCron() {
    // this.logger.debug('Called every 30 second');
    // this.handleFunction();
  }

  async handleFunction() {
    const baseCurrency = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
    const network = 'bsc';

    const bots: Bot[] = await this.botRepository.find({});
    const bsc_key = process.env.BSC_KEY;
    //this.generateImage(network, baseCurrency, bots[0].address, bots[0].group);

    for (let i = 0; i < bots.length; i++) {
      // this.generateImage(
      //   network,
      //   baseCurrency,
      //   bots[i].address,
      //   bots[i].group,
      // );

      //get bots info
      const tokenInfoUrl = `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${bots[i].address}&apikey=${bsc_key}`;
      const csupplyUrl = `https://api.bscscan.com/api?module=stats&action=tokenCsupply&contractaddress=${bots[i].address}&apikey=${bsc_key}`;
      const res = await axios.get(tokenInfoUrl);
      const cRes = await axios.get(csupplyUrl);
      let tokenInfo, csupply;
      if (res.data.status == '1') {
        tokenInfo = res.data.result[0];
        console.log(tokenInfo.tokenPriceUSD);

        bots[i].price = tokenInfo.tokenPriceUSD;
        bots[i].supply = tokenInfo.totalSupply;
        bots[i].name = tokenInfo.tokenName;
        bots[i].symbol = tokenInfo.symbol;
      }

      if (cRes.data.status == '1') {
        bots[i].csupply = cRes.data.result;
      }

      this.botRepository.save(bots[i]);
    }
  }
}
