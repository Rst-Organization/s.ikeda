#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StepfunctionsRestApiStack } from '../lib/cdk-stepfunction-stack';
import { LambdaRestApiStack } from '../lib/lambdaChain';

const app = new cdk.App();
const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN || '';
const channelSecret = process.env.CHANNEL_SECRET || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';

new StepfunctionsRestApiStack(app, 'CdkStepfunctionStack', {
  env: {
    account: '037355278352',
    region: 'ap-northeast-1',
  },
});

new LambdaRestApiStack(app, 'LambdaRestApiStack', {
  channelAccessToken: channelAccessToken,
  channelSecret: channelSecret,
  openaiApiKey: openaiApiKey,
  env: {
    account: '037355278352',
    region: 'ap-northeast-1',
  },
});
