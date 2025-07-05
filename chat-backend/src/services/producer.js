import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'chat-backend',
  brokers: ['localhost:9092', '0.0.0.0:29092'],
  logLevel: logLevel.ERROR,
});

const producer = kafka.producer();

export const sendMessage = async (message) => {
  try {
    await producer.connect();
    const messageToSend = {
      ...message,
      timestamp: new Date().toISOString(),
      id: message.id || Date.now().toString()
    };

    await producer.send({
      topic: 'chat-messages',
      messages: [{ 
        key: messageToSend.id, 
        value: JSON.stringify(messageToSend) 
      }],
    });

    console.log('Message sent successfully to Kafka:', messageToSend);
    return messageToSend;
  } catch (error) {
    console.error('Error sending message to Kafka:', error);
    throw error;
  }
};
