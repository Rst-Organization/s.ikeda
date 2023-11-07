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
const sqs = new AWS.SQS();

export const handler = async (event: any = {}): Promise<any> => {
  console.log(JSON.stringify(event));
  const object = event.Records[0].body;
  const objectId = JSON.parse(object).Key;
  console.log('objectId', objectId);

  const params = {
    Image: {
      S3Object: {
        Bucket: process.env.BUCKET_NAME,
        Name: objectId,
      },
    },
    MaxLabels: 3,
    MinConfidence: 80,
  };

  try {
    const response = await new AWS.Rekognition().detectLabels(params).promise();
    console.log('labels', response.Labels);
    const labels = response.Labels?.map((label) => label.Name).join(', ');
    console.log('Names', labels);

    //PersonがTOPだったら次のSQSに送る
    if (labels?.includes('Person')) {
      await handleSQS(object);
      return;
    }

    //AI回答生成
    const ans = await aichat(labels!);
    //AI回答をLINE返信
    await handleTextMessage(object, ans);

    //SQSからメッセージを削除
    const queueUrl = process.env.SQS_URL;
    const params2 = {
      QueueUrl: queueUrl!,
      ReceiptHandle: event.Records[0].receiptHandle,
    };
    await sqs.deleteMessage(params2).promise();
    await handleRecommendSQS(JSON.parse(object).userId);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

//LINE返信
async function handleTextMessage(object: any, ans: string) {
  const replayToken = JSON.parse(object).replyToken;
  await client.replyMessage(replayToken, {
    type: 'text',
    text: ans,
  });
  return;
}

//次のSQSに送る
async function handleSQS(object: any = {}): Promise<any> {
  const sqs = new AWS.SQS();
  const sqsparams = {
    MessageBody: object,
    QueueUrl: process.env.SECOUND_SQS_URL!,
  };
  await sqs.sendMessage(sqsparams).promise();
  console.log('次のSQSにメッセージを送信しました。');
  return;
}

//AI回答生成
async function aichat(labels: string) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `あなたは老害おじさんです。あなたは写真の解析結果から老害おじさんのように辛辣な感想を述べます。その感想は若者を不快な気持ちにさせます。写真の解析結果は${labels}です。この解析結果から想像を働かして辛辣かつ不快なコメントを生成してください。老害なので絶対に英語は使えません。日本語に直してください。(例) 〇〇が写っているな。暇なら働け！`,
      },
      {
        role: 'user',
        content: `写真に写っているものは${labels}ですが、感想を述べて`,
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

//レコメンドSQSにメッセージを送信
async function handleRecommendSQS(userId: string): Promise<any> {
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
