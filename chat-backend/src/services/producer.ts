import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'chat-backend',
  brokers: ['localhost:9092', '0.0.0.0:29092'],
  logLevel: logLevel.ERROR,
});

const producer = kafka.producer();

export const run = async (res: any) => {
  await producer.connect();

  await producer.send({
    topic: 'chat-messages',
    messages: [{ key: 'user1', value: JSON.stringify(res) }],
  });

  console.log('message sent successfully ==> ', res);
};
