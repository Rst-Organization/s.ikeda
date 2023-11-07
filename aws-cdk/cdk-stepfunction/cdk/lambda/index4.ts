import * as AWS from 'aws-sdk';
import {
  Client,
  WebhookEvent,
  TextMessage,
  MessageEvent,
  ImageMessage,
} from '@line/bot-sdk';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
};
const client = new Client(config);

export const handler = async (event: any = {}): Promise<any> => {
  console.log(JSON.stringify(event));
  const object = event.Records[0].body;
  const userId = JSON.parse(object).userId;
  console.log('userId', userId);
  const deleteFlag = JSON.parse(object).delete;
  console.log('deleteFlag', deleteFlag);

  if (deleteFlag) {
    await handlePushImage(userId);
    await deleteSQSMessage(event);
    return;
  }

  const res = await aichat();
  await handlePushMessage(userId, res);
  await deleteSQSMessage(event);
};

//LINEプッシュ通知
async function handlePushMessage(userId: string, ans: string) {
  await client.pushMessage(userId, {
    type: 'text',
    text: ans,
  });
  return;
}

//受信したメッセージを削除
async function deleteSQSMessage(event: any): Promise<any> {
  try {
    const sqs = new AWS.SQS();

    const deleteParams = {
      QueueUrl: process.env.SQS_URL!,
      ReceiptHandle: event.Records[0].receiptHandle!,
    };
    await sqs.deleteMessage(deleteParams).promise();
    console.log('メッセージを削除しました。');
    return;
  } catch (e) {
    console.log('メッセージを削除できませんでした。');
    return;
  }
}

//AI回答生成
async function aichat() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `あなたは老害おじさんです。あなたは自分が送ったメッセージを既読無視されています。怒ったあなたは辛辣かつ不快なコメントを生成します。そのコメントはユーザーを不快な気持ちにさせます。老害なので絶対に英語は使えません。日本語で話してください。(例) 自分から連絡しておいて返信無いとはどういう事だ！！`,
      },
      {
        role: 'user',
        content: '既読無視されて怒ったメッセージを生成してください。',
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

//画像をプッシュ通知
async function handlePushImage(userId: string) {
  await client.pushMessage(userId, {
    type: 'sticker',
    packageId: '8515',
    stickerId: '16581242',
  });
  return;
}

//SQSに送る
// async function handleSQS(userId: string): Promise<any> {
//   const sqs = new AWS.SQS();
//   const sqsparams = {
//     MessageBody: JSON.stringify({
//       userId: userId,
//       delete: false,
//     }),
//     QueueUrl: process.env.SQS_URL!,
//     MessageGroupId: userId,
//     MessageDeduplicationId: userId, //重複IDを指定
//   };
//   await sqs.sendMessage(sqsparams).promise();
//   console.log('同じSQSにメッセージを送信しました。');
//   return;
// }
