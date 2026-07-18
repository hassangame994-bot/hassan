import 'dotenv/config';
import { DatabaseService } from './server-db';
import mongoose from 'mongoose';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    return;
  }
  
  // Wait for mongoose connection if DatabaseService is connecting
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once('open', resolve));
  }
  const db = mongoose.connection.db;
  if (!db) {
    console.error('No db instance after waiting');
    return;
  }
  
  console.log('🔍 Initial Inspection - Checking if order ORD_F5C85500 exists in MongoDB...');
  const initialOrder = await db.collection('orders').findOne({ id: 'ORD_F5C85500' });
  if (initialOrder) {
    console.log('✅ Found order in MongoDB:', initialOrder.id, 'with status:', initialOrder.status);
    
    console.log('🧹 Calling DatabaseService.deleteOrder("ORD_F5C85500")...');
    await DatabaseService.deleteOrder('ORD_F5C85500');
    console.log('✅ deleteOrder execution completed.');
    
    console.log('⏱️ Verifying MongoDB deletion immediately...');
    const deletedOrder = await db.collection('orders').findOne({ id: 'ORD_F5C85500' });
    if (!deletedOrder) {
      console.log('🎉 Confirmed: Order deleted from MongoDB immediately!');
    } else {
      console.warn('⚠️ Warning: Order still exists in MongoDB after deleteOrder.');
    }
  } else {
    console.log('📝 Order ORD_F5C85500 does not exist in MongoDB. Creating a new test order first...');
    const testOrder = {
      id: 'ORD_TEST1234',
      userId: 'usr_758bcc0b3b',
      username: 'hr',
      items: [],
      total: 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.collection('orders').insertOne(testOrder);
    console.log('✅ Created test order ORD_TEST1234 in MongoDB.');
    
    console.log('🧹 Calling DatabaseService.deleteOrder("ORD_TEST1234")...');
    await DatabaseService.deleteOrder('ORD_TEST1234');
    
    console.log('⏱️ Verifying MongoDB deletion immediately...');
    const deletedOrder = await db.collection('orders').findOne({ id: 'ORD_TEST1234' });
    if (!deletedOrder) {
      console.log('🎉 Confirmed: Test order deleted from MongoDB immediately!');
    } else {
      console.warn('⚠️ Warning: Test order still exists in MongoDB after deleteOrder.');
    }
  }
  
  await mongoose.disconnect();
  process.exit(0);
}
run().catch(err => console.error('Error during test execution:', err));
