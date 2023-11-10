#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StepfunctionsRestApiStack } from '../lib/cdk-stepfunction-stack';
import { LambdaRestApiStack } from '../lib/lambdaChain';

const app = new cdk.App();
const channelAccessToken =
  '3ktUXkqvdWyYsMUq1SdDtFISj2XkIvUeeSpEDrCObRjZ8H6y4/anBtxDkzbxXkLbodwhiSaSk4QnIe1IoPiE4izCFzxV2zpC/6ODwi1vhLVuT6ugEOfTFzSRV/0bmV/At14THxmsvz/6rbd408UDYAdB04t89/1O/w1cDnyilFU=';
const channelSecret = '5e2cc09684c3841cfd7ef98922dee7a4';
const openaiApiKey = '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';

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
