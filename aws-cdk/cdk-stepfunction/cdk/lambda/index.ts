import {
  Client,
  WebhookEvent,
  TextMessage,
  MessageEvent,
  ImageMessage,
} from '@line/bot-sdk';

import * as AWS from 'aws-sdk';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
};

const client = new Client(config);

export const handler = async (event: any = {}): Promise<any> => {
  // console.log(JSON.stringify(event));
  const linePayload = JSON.parse(event.body);
  const lineEvents: WebhookEvent[] = linePayload.events;
  // console.log(lineEvents);

  for (const lineEvent of lineEvents) {
    if (lineEvent.type === 'message') {
      const messageEvent = lineEvent as MessageEvent;

      if (messageEvent.message.type === 'text') {
        if (messageEvent.message.text === '本当に申し訳ございませんでした。') {
          const userId = messageEvent.source.userId || '';
          await deleteSQSMessage(userId);
          return;
        }

        const res = await aichat(messageEvent.message.text);
        await handleTextMessage(messageEvent, res);

        const userId = messageEvent.source.userId || '';
        await handleSQS(userId);
        return;
      } else if (messageEvent.message.type === 'image') {
        await handleImageMessage(messageEvent);
        return;
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Message processed successfully.' }),
  };
};

//LINE返信
async function handleTextMessage(event: MessageEvent, res: string) {
  const replaytoken = event.replyToken;
  await client.replyMessage(replaytoken, {
    type: 'text',
    text: res,
  });
  return;
}

//S3に画像を保存してSQSにメッセージを送信
async function handleImageMessage(event: MessageEvent) {
  //S3に画像を保存
  const s3 = new AWS.S3();

  const messageId = event.message.id;

  const image = await client.getMessageContent(messageId);
  const data = [];
  for await (const chunk of image) {
    data.push(chunk);
  }

  const s3Params = {
    Bucket: process.env.BUCKET_NAME!,
    Key: `${messageId}.jpg`,
    Body: Buffer.concat(data),
    ContentType: 'image/jpeg',
  };

  await s3.putObject(s3Params).promise();

  //キューにメッセージを送信
  const sqs = new AWS.SQS();
  const sqsParams = {
    MessageBody: JSON.stringify({
      Key: `${messageId}.jpg`,
      replyToken: event.replyToken,
    }),
    QueueUrl: process.env.SQS_URL!,
  };
  await sqs.sendMessage(sqsParams).promise();
  console.log('SQSにメッセージを送信しました。');

  return;
}

//AI回答生成
async function aichat(message: string) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `あなたは老害おじさんです。あなたは老害おじさんのようにユーザーに対して辛辣なコメントを述べます。そのコメントは若者を不快な気持ちにさせます。老害なので絶対に英語は使えません。(口癖) 「はあ。本当にこれだから最近の若者は。」`,
      },
      {
        role: 'user',
        content: message,
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  for (const choice of chatCompletion.choices) {
    const response = choice.message.content || '...';
    console.log(`ai: ${response}`);
    return response;
  }
  return '...';
}

// レコメンドSQSに削除フラグを混ぜてメッセージ送信
async function deleteSQSMessage(userId: string) {
  const sqs = new AWS.SQS();
  const sqsParams = {
    MessageBody: JSON.stringify({
      userId: userId,
      delete: true,
    }),
    QueueUrl: process.env.RECOMMEND_SQS_URL!,
    MessageGroupId: userId, //グループIDを指定
    MessageDeduplicationId: uuidv4(), //重複IDをユニークにする
  };
  await sqs.sendMessage(sqsParams).promise();
  console.log('レコメンドSQSに謝罪メッセージを送信しました。');
  return;
}

//レコメンドSQSにメッセージを送信
async function handleSQS(userId: string): Promise<any> {
  const sqs = new AWS.SQS();
  const sqsParams = {
    MessageBody: JSON.stringify({
      userId: userId,
      delete: false,
    }),
    QueueUrl: process.env.RECOMMEND_SQS_URL!,
    MessageGroupId: userId, //グループIDを指定
    MessageDeduplicationId: userId, //重複IDを指定
  };
  await sqs.sendMessage(sqsParams).promise();
  console.log('レコメンドSQSにメッセージを送信しました。');
  return;
}
