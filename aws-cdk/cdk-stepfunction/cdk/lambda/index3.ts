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
    Attributes: ['ALL'],
  };

  try {
    const response: any = await new AWS.Rekognition()
      .detectFaces(params)
      .promise();
    console.log('responce', response);
    const primaryEmotion = response?.FaceDetails[0].Emotions.reduce(
      (prev: any, current: any) => {
        return prev.Confidence > current.Confidence ? prev : current;
      }
    );
    const mainEmotion = primaryEmotion?.Type;
    const gender = response.FaceDetails[0].Gender.Value;
    const content = `性別:${gender},感情:${mainEmotion}`;

    console.log('AnalysisResults', content);

    // //AI回答生成
    const ans = await aichat(content!);
    // //AI回答をLINE返信
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

//AI回答生成
async function aichat(content: string) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `あなたは老害おじさんです。あなたは人物写真の性別と感情の解析結果から老害おじさんのように辛辣な感想を述べます。その感想は若者を不快な気持ちにさせます。写真の解析結果は${content}です。この解析結果から想像を働かして辛辣かつ不快なコメントを生成してください。老害なので絶対に英語は使えません。日本語に直してください。(例) 〇〇のようだね。本当に辛気臭いな若者は。`,
      },
      {
        role: 'user',
        content: `写真に写っている人物の性別と感情は${content}ですが、感想を述べて`,
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
