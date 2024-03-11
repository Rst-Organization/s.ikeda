#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkCloudfrontS3Stack } from '../lib/cdk-cloudfront-s3-stack';

const app = new cdk.App();

//cdk.jsonのContextより取得
const accountId = app.node.tryGetContext('accountId');

new CdkCloudfrontS3Stack(app, 'CdkCloudfrontS3Stack', {
  env: {
    account: accountId,
    region: 'ap-northeast-1',
  },
  accountId: accountId,
});
