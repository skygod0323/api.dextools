import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';

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
import { query } from 'express';

dotenv.config();

const API_URI = 'https://graphql.bitquery.io/';
const API_KEY = 'BQYfX4lPeSm1TEfHiyBBpJeJVa1coppX';

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

@Injectable()
export class BitqueryService {
  constructor() {}

  async runQuery(q) {
    const query = gql`
      ${q}
    `;
    return client.query({ query });
  }
}
