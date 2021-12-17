import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, Timeout } from '@nestjs/schedule';
import axios from 'axios';

import * as dotenv from 'dotenv';
dotenv.config();

import config from './config';
import { PC_V2_FACTORY_CONTRACT_ABI } from './constants/pcv2_factory_contract_abi';
import { PairsCronjob } from './entities/pairs_cronjob.entity';
import { PairsCronjobDto } from './dtos/pairs_cronjob.dto';
import { TokenPairService } from 'src/tokenpair/tokenpair.service';

const Web3 = require("web3");
const bsc_web3 = new Web3(new Web3.providers.HttpProvider(config.BSC_MAINNET));
const pcv2Inst = new bsc_web3.eth.Contract(PC_V2_FACTORY_CONTRACT_ABI as any, config.PC_V2_FACTORY_CONTRACT);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

@Injectable()
export class CronjobService {

    private readonly logger = new Logger(CronjobService.name);

    constructor(
        @InjectRepository(PairsCronjob)
        private readonly pairCronjobRepository: Repository<PairsCronjob>,
        private readonly tokenPairService: TokenPairService
    ) {}

    @Cron('*/30 * * * * *')
    async handleCron() {

    }

    @Timeout(0)
    async addPCV2TokenPairCronjob() {                   /// add cronjobs for pancakeswap v2
        // for (let i=0; i<10; i++) {
        //     const pairCronjob = new PairsCronjob();
        //     pairCronjob.network = 'bsc';
        //     pairCronjob.pool = 'pcv2';
        //     pairCronjob.from = i * 60000;
        //     pairCronjob.to = (i + 1) * 60000 -1;
        //     pairCronjob.active = true;
        //     pairCronjob.current_index = i * 60000;    /// index that need to get pair now.

        //     await this.pairCronjobRepository.save(pairCronjob);
        // }

        // const pairCronjob = new PairsCronjob();
        // pairCronjob.network = 'bsc';
        // pairCronjob.pool = 'pcv2';
        // pairCronjob.from = 600000;
        // pairCronjob.to = 622700;
        // pairCronjob.active = true;
        // pairCronjob.current_index = 600000;    /// index that need to get pair now.
        // await this.pairCronjobRepository.save(pairCronjob);
    }

    @Timeout(1000)
    async runPCV2TokenPairsCron() {
        if (process.env.ENABLE_CRONJOB == '0') {
            console.log('diabled cronjob'); return;
        }

        const pairCronjobs = await this.pairCronjobRepository.find({
            where: {pool: 'pcv2', network: 'bsc', active: true},
            order: {from: 'ASC'}
        })

        console.log('cronjob length', pairCronjobs.length);

        const jobs = pairCronjobs.map(job => this.getPCV2TokenPair(job.toPairsCronjobDto()));

        Promise.all(jobs)
        .then((res) => {
            // console.log('result ', res);
        }).catch(error => {
            console.log(error);
        })

        // this.getPCV2TokenPair(0);
        // console.log('cronstart');
    }

    async getPCV2TokenPair(pairCron: PairsCronjobDto) {
        
        const from = pairCron.from;
        const to = pairCron.to;
        let current_index = pairCron.current_index;

        while(current_index <= to) {

            try {
                console.log('current index ', current_index);

                // console.log('Get pair address....');
                const pair_address = await pcv2Inst.methods.allPairs(current_index).call();
                console.log('pair address: ', pair_address);
                
                // console.log('Get pair abi...')
                const pair_abi_url = `https://api.bscscan.com/api?module=contract&action=getabi&address=${pair_address}&apikey=${process.env.BSC_KEY}`;
                let res = await axios.get(pair_abi_url);
                while(res.data.message == 'NOTOK') {
                    await delay(1000)          /// if failed, delay 1s and try again;
                    res = await axios.get(pair_abi_url);
                }
                const pair_abi: any = JSON.parse(res.data.result);
                // console.log('Got pair abi')

                const pairInst = new bsc_web3.eth.Contract(pair_abi, pair_address);
                // console.log('Get token0 address....')
                const token0 = await pairInst.methods.token0().call();
                // console.log('token0 address: ', token0);

                // console.log('Get token1 address....')
                const token1 = await pairInst.methods.token1().call();
                // console.log('token1 address: ', token1);

                const token0_info_url = `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${token0}&apikey=${process.env.BSC_KEY}`;
                const token1_info_url = `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${token1}&apikey=${process.env.BSC_KEY}`;
                
                // console.log('get token0 info....')
                res = await axios.get(token0_info_url);
                while(res.data.message == 'NOTOK') {
                    await delay(1000)          /// if failed, delay 1s and try again;
                    res = await axios.get(token0_info_url);
                }
                const token0_info = res.data.result;
                console.log('token0 info: ', res.data.message);
                

                // console.log('get token1 info....')
                res = await axios.get(token1_info_url);
                while(res.data.message == 'NOTOK') {
                    await delay(1000)          /// if failed, delay 1s and try again;
                    res = await axios.get(token1_info_url);
                }
                const token1_info = res.data.result;
                console.log('token1 info: ', res.data.message);

                
                const token_pair = {
                    pair_address: pair_address,
                    
                    token0_address: token0,
                    token0_symbol: token0_info[0].symbol,
                    token0_name: token0_info[0].tokenName,

                    token1_address: token1,
                    token1_symbol: token1_info[0].symbol,
                    token1_name: token1_info[0].tokenName,

                    network: 'bsc',
                    pool: 'pcv2',
                    pair_index: current_index
                }

                console.log('token pair', token_pair);

                ///// save pair info to tokepair table
                await this.tokenPairService.addTokenPair(token_pair, false);

                /// increase current index;                
                current_index++;
                let cron = await this.pairCronjobRepository.findOne({
                    where: {id: pairCron.id}
                });
                cron.current_index = current_index;
                await this.pairCronjobRepository.save(cron);

                await delay(1000);

            } catch (error) {
                console.log('error ', error, current_index);
                console.log('delayed');
                await delay(10000);
            }

            
        }

        console.log('complete')
        

        
    }
        
        
        

        // console.log('Get pair address....');
        // const pair_address = await pcv2Inst.methods.allPairs(0).call();
        // console.log('pair address: ', pair_address);
        
        // console.log('Get pair abi...')
        // const pair_abi_url = `https://api.bscscan.com/api?module=contract&action=getabi&address=${pair_address}&apikey=${process.env.BSC_KEY}`;
        // let res = await axios.get(pair_abi_url);
        // const pair_abi: any = JSON.parse(res.data.result);
        // console.log('Got pair abi')

        // const pairInst = new bsc_web3.eth.Contract(pair_abi, pair_address);
        // console.log('Get token0 address....')
        // const token0 = await pairInst.methods.token0().call();
        // console.log('token0 address: ', token0);

        // console.log('Get token1 address....')
        // const token1 = await pairInst.methods.token1().call();
        // console.log('token1 address: ', token1);

        // const token0_info_url = `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${token0}&apikey=${process.env.BSC_KEY}`;
        // const token1_info_url = `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${token1}&apikey=${process.env.BSC_KEY}`;
        
        // console.log('get token0 info....')
        // res = await axios.get(token0_info_url);
        // const token0_info = res.data.result;
        // console.log('token0 info: ', token0_info);
        

        // console.log('get token1 info....')
        // res = await axios.get(token1_info_url);
        // const token1_info = res.data.result;
        // console.log('token1 info: ', token1_info);
}
