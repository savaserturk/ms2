// Import required modules
const express = require('express');
const amqp = require('amqplib/callback_api');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const RABBITMQ_CONNECTION_STRING = process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost';
const PORT = process.env.PORT || 4000;

let receivedMessages = [];

// Connect to RabbitMQ
amqp.connect(RABBITMQ_CONNECTION_STRING, (err, conn) => {
  if (err) {
    console.error('RabbitMQ connection error:', err);
    return;
  }

  conn.createChannel((err, channel) => {
    if (err) {
      console.error('Channel creation error:', err);
      return;
    }

    const queue = 'order_queue';

    channel.assertQueue(queue, { durable: false });

    channel.consume(queue, (msg) => {
      if (msg) {
        const order = JSON.parse(msg.content.toString());
        receivedMessages.push(order);
        console.log('Order received:', order);
      }
    }, { noAck: true });
  });
});

// Route to return received orders
app.get('/orders', (req, res) => {
  res.json(receivedMessages);
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ message: 'Server is healthy' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
