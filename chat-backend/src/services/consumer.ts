import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'chat-backend',
  brokers: ['localhost:9092', '0.0.0.0:29092'],
  logLevel: logLevel.ERROR,
});

const consumer = kafka.consumer({ groupId: 'chat-group' });

export const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'chat-messages', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("**** arrived in consumer ****")
      const obj = JSON.parse(message.value?.toString() || '{}');
      console.log(obj);

      // console.log({
      //   partition,
      //   offset: message.offset,
      //   value: message?.value?.toString(),
      // });
    },
  });
};
