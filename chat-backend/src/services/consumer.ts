import { Kafka, logLevel } from 'kafkajs';
import { broadcastMessage } from '../app';

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
      console.log("**** Message arrived in consumer ****");
      try {
        const messageObj = JSON.parse(message.value?.toString() || '{}');
        console.log('Kafka message:', messageObj);
        
        // Broadcast the message to all connected WebSocket clients
        broadcastMessage({
          type: 'kafka-message',
          ...messageObj,
          kafkaMetadata: {
            topic,
            partition,
            offset: message.offset
          }
        });
      } catch (error) {
        console.error('Error processing Kafka message:', error);
      }
    },
  });
};
