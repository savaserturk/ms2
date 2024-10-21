// Import required modules
const express = require('express'); // Express is a minimal Node.js framework for building web applications.
const amqp = require('amqplib/callback_api'); // AMQP (Advanced Message Queuing Protocol) client library for RabbitMQ.
const cors = require('cors'); // CORS (Cross-Origin Resource Sharing) middleware for handling cross-origin requests.
require('dotenv').config(); // Load environment variables from .env file in development

const app = express(); // Create an Express application instance.
app.use(express.json()); // Middleware to parse incoming JSON request bodies.

// Enable CORS (Cross-Origin Resource Sharing) for all routes
app.use(cors());

// Get the RabbitMQ URL and the port from environment variables
const RABBITMQ_CONNECTION_STRING = process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost';  // Fallback to localhost if not defined
const PORT = process.env.PORT || 4000;  // Fallback to port 3000 if not defined

// Array to store received messages
let receivedMessages = [];

// Connect to RabbitMQ server to receive messages
amqp.connect(RABBITMQ_CONNECTION_STRING, (err, conn) => {
  if (err) {
    console.error('Error connecting to RabbitMQ:', err);
    return;
  }

  // Create a channel to receive messages
  conn.createChannel((err, channel) => {
    if (err) {
      console.error('Error creating channel:', err);
      return;
    }

    const queue = 'order_queue'; // Queue name

    // Assert (create) the queue if it doesn't already exist
    channel.assertQueue(queue, { durable: false });

    // Start consuming messages from the queue
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const order = JSON.parse(msg.content.toString()); // Parse message content
        receivedMessages.push(order); // Store message in the array
        console.log('Received order:', order); // Log the received message
      }
    }, { noAck: true }); // Automatically acknowledge the message
  });
});

// Define a GET route to return the stored messages
app.get('/orders', (req, res) => {
  res.json(receivedMessages); // Send the array of received messages as a response
});

// Start the server using the port from environment variables
app.listen(PORT, () => {
  console.log(`Order service is running on http://localhost:${PORT}`);
});
