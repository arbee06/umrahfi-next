const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkRecentOrders() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('Checking recent orders...\n');

    const [orders] = await connection.execute(`
      SELECT 
        id,
        orderNumber,
        paymentMethod,
        paymentStatus,
        status,
        totalAmount,
        stripePaymentIntentId,
        createdAt
      FROM orders 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);

    if (orders.length === 0) {
      console.log('No orders found');
    } else {
      orders.forEach(order => {
        console.log(`Order ID: ${order.id}`);
        console.log(`Order Number: ${order.orderNumber}`);
        console.log(`Payment Method: ${order.paymentMethod}`);
        console.log(`Payment Status: ${order.paymentStatus}`);
        console.log(`Order Status: ${order.status}`);
        console.log(`Total: $${order.totalAmount}`);
        console.log(`Stripe Payment Intent ID: ${order.stripePaymentIntentId || 'Not set'}`);
        console.log(`Created: ${order.createdAt}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRecentOrders();