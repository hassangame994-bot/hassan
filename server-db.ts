import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, MenuItem, Order, OrderStatus, Category, CartItem } from './src/types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'abu-qura-super-secure-production-secret-999';

export function hashPassword(password: any): string {
  if (!password || typeof password !== 'string') return '';
  return bcrypt.hashSync(password, 12);
}

export function comparePassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compareSync(password, hash);
  }
  // Legacy PBKDF2 fallback comparison to prevent breaking existing logins during migration
  const legacyHash = crypto.pbkdf2Sync(password, 'abu-qura-salt-30yrs', 10000, 64, 'sha512').toString('hex');
  return legacyHash === hash;
}

export function generateToken(user: any): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, isSuperAdmin: !!user.isSuperAdmin },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Default delicious pre-seeded categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grills', nameAr: 'مشاوي أبو قورة', nameEn: 'Grills' },
  { id: 'pots', nameAr: 'طواجن الحمام واللحوم', nameEn: 'Claypots & Pigeon' },
  { id: 'pastries', nameAr: 'فطير ومخبوزات', nameEn: 'Feteer & Pastries' },
  { id: 'appetizers', nameAr: 'مقبلات وشوربة', nameEn: 'Appetizers' },
  { id: 'desserts', nameAr: 'الحلويات الشرقية', nameEn: 'Desserts' },
  { id: 'drinks', nameAr: 'المشروبات الباردة', nameEn: 'Refreshments' },
];

// Default delicious pre-seeded menu items
const DEFAULT_MENU: MenuItem[] = [
  {
    id: 'm1',
    nameAr: 'كباب وكفتة أبو قورة المميز',
    nameEn: 'Abu Qura Signature Kebab & Kofta',
    descriptionAr: 'سيخ كباب بلدي مع سيخ كفتة متبلة بخلطة أبو قورة السرية، مشوية على الفحم مع خضار مشوية وطحينة وخبز طازج.',
    descriptionEn: 'Grilled local kebab and minced meat skewers seasoned with Abu Qura secret blend, served with grilled vegetables, tahini, and fresh bread.',
    price: 320,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    category: 'grills'
  },
  {
    id: 'm2',
    nameAr: 'ريش ضأن مشوية على الفحم',
    nameEn: 'Charcoal Grilled Lamb Chops',
    descriptionAr: 'قطع ريش الغنم المتبلة بالأعشاب والبهارات الشرقية، مشوية على الفحم الساخن لتذوب في الفم، تقدم مع الأرز الأصفر والصلصة الحارة.',
    descriptionEn: 'Premium lamb chops marinated in oriental herbs and spices, coal grilled to perfection. Served with seasoned yellow rice and spicy dip.',
    price: 450,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'grills'
  },
  {
    id: 'm3',
    nameAr: 'طاجن بامية بلحم الضأن الموزة',
    nameEn: 'Lamb Shank Okra Claypot',
    descriptionAr: 'طاجن فخار بلدي يحتوي على بامية صغيرة طازجة مطبوخة مع قطع لحم الموزة الضأن في صلصة الطماطم الغنية بالثوم والكزبرة.',
    descriptionEn: 'Traditional claypot of fresh baby okra slow-cooked with tender lamb shank in a rich garlic, tomato, and coriander sauce.',
    price: 290,
    image: 'https://images.unsplash.com/photo-1547928576-a4a33237bea3?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm4',
    nameAr: 'طاجن ورق عنب بالكوارع',
    nameEn: 'Stuffed Grape Leaves with Trotters Claypot',
    descriptionAr: 'ورق عنب محشي بخلطة الأرز والأعشاب، مطبوخ في طاجن فخار ومغطى بقطع الكوارع المخلية المطهوة ببطء في مرقة غنية بالليمون.',
    descriptionEn: 'Claypot slow-cooked grape leaves stuffed with spiced rice, topped with tender boneless beef trotters in a tangy lemon broth.',
    price: 340,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm5',
    nameAr: 'فطير مشلتت فلاحي بالسمن البلدي',
    nameEn: 'Traditional Rural Feteer Meshaltet',
    descriptionAr: 'فطيرة فلاحي مورقة ومقرمشة ومحمرة بالسمن البلدي النقي، تقدم مع العسل الأبيض، القشطة الطازجة، والجبن القديم.',
    descriptionEn: 'Flaky layered golden pastry made with pure local ghee. Served with honey, fresh clotted cream, and traditional aged cheese.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80',
    category: 'pastries'
  },
  {
    id: 'm6',
    nameAr: 'حمام محشي أرز مميز',
    nameEn: 'Signature Stuffed Pigeon',
    descriptionAr: 'زوج من الحمام الفاخر محشي بالأرز المتبل بخلطة الكبد والقوانص والبهارات الخاصة، محمر ومقرمش بالسمن البلدي.',
    descriptionEn: 'A pair of pigeons stuffed with seasoned rice, giblets, and aromatic spices, roasted crispy in authentic clarified butter.',
    price: 380,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm7',
    nameAr: 'سلطة أبو قورة الخضراء المميزه',
    nameEn: 'Abu Qura Signature Green Salad',
    descriptionAr: 'مزيج منعش من الجرجير، الطماطم، الخيار، الفجل، والنعناع الأخضر، متبل بالليمون، زيت الزيتون ودبس الرمان والخبز المقرمش.',
    descriptionEn: 'Crisp arugula, tomatoes, cucumbers, radish, and fresh mint, tossed with lemon dressing, olive oil, sweet pomegranate molasses, and crispy bread.',
    price: 75,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    category: 'appetizers'
  },
  {
    id: 'm8',
    nameAr: 'شوربة لسان عصفور بلدي',
    nameEn: 'Traditional Orzo Soup',
    descriptionAr: 'مرقة الدجاج واللحم الغنية مع لسان العصفور المحمر بالسمن البلدي ولمسة ليمون منعشة.',
    descriptionEn: 'Rich, comforting bone broth soup with roasted orzo pasta and a fresh squeeze of lemon juice.',
    price: 60,
    image: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80',
    category: 'appetizers'
  },
  {
    id: 'm9',
    nameAr: 'أم علي بالمكسرات والقشطة والفرن',
    nameEn: 'Oven Baked Om Ali Dessert',
    descriptionAr: 'رقاق مخبوز بالفرن مغطى بالحليب الطازج المكثف، الكريمة الغنية، السمن البلدي، ومزيج الفستق واللوز والزبيب وجوز الهند.',
    descriptionEn: 'Traditional baked bread pudding layered with sweet whole milk, heavy cream, ghee, topped with roasted pistachios, almonds, and coconut.',
    price: 110,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
    category: 'desserts'
  },
  {
    id: 'm10',
    nameAr: 'عصير ليمون بالنعناع فريش',
    nameEn: 'Fresh Mint Lemonade',
    descriptionAr: 'ليمون طازج معسور بارد مع أوراق النعناع البري ومكعبات الثلج لانتعاش فوري.',
    descriptionEn: 'Freshly squeezed lemon juice cold-blended with organic mint leaves and crushed ice for instant refreshment.',
    price: 55,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    category: 'drinks'
  }
];

interface DataSchema {
  users: User[];
  orders: Order[];
  menu: MenuItem[];
  categories: Category[];
  settings?: {
    adminPhone: string;
  };
  deletedMenuItemIds?: string[];
  deletedCategoryIds?: string[];
  deletedOrderIds?: string[];
  deletedUserIds?: string[];
  dirtyMenuItemIds?: string[];
  dirtyCategoryIds?: string[];
  dirtyOrderIds?: string[];
}

// Ensure database file and directory exist for fallback
function initDB(): DataSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DataSchema = {
      users: [
        {
          id: 'admin-1',
          username: 'Abu-Qura',
          email: 'admin@abuqura.com',
          passwordHash: hashPassword('Abu-Qura123'),
          role: 'admin',
          createdAt: new Date().toISOString(),
          isSuperAdmin: true
        }
      ],
      orders: [],
      menu: DEFAULT_MENU,
      categories: DEFAULT_CATEGORIES,
      settings: {
        adminPhone: '01120751465'
      },
      deletedMenuItemIds: [],
      deletedCategoryIds: [],
      deletedOrderIds: [],
      deletedUserIds: [],
      dirtyMenuItemIds: [],
      dirtyCategoryIds: [],
      dirtyOrderIds: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) parsed.users = [];
    if (!parsed.orders) parsed.orders = [];
    if (!parsed.menu || parsed.menu.length === 0) parsed.menu = DEFAULT_MENU;
    if (!parsed.categories || parsed.categories.length === 0) parsed.categories = DEFAULT_CATEGORIES;
    if (!parsed.settings) {
      parsed.settings = {
        adminPhone: '01120751465'
      };
    }
    if (!parsed.deletedMenuItemIds) parsed.deletedMenuItemIds = [];
    if (!parsed.deletedCategoryIds) parsed.deletedCategoryIds = [];
    if (!parsed.deletedOrderIds) parsed.deletedOrderIds = [];
    if (!parsed.deletedUserIds) parsed.deletedUserIds = [];
    if (!parsed.dirtyMenuItemIds) parsed.dirtyMenuItemIds = [];
    if (!parsed.dirtyCategoryIds) parsed.dirtyCategoryIds = [];
    if (!parsed.dirtyOrderIds) parsed.dirtyOrderIds = [];

    const adminIndex = parsed.users.findIndex((u: any) => u.username === 'Abu-Qura');
    if (adminIndex === -1) {
      parsed.users.push({
        id: 'admin-1',
        username: 'Abu-Qura',
        email: 'admin@abuqura.com',
        passwordHash: hashPassword('Abu-Qura123'),
        role: 'admin',
        createdAt: new Date().toISOString(),
        isSuperAdmin: true
      });
    } else {
      const admin = parsed.users[adminIndex];
      if (!admin.email) admin.email = 'admin@abuqura.com';
      const corruptHash = "acf3929fbc02247b2645db3b038e867c7b2cd02cc9a2212475fad3724702c453691234437c226b4b735defa4ae352369c1897099c91bb9ee6d22a44165de329d";
      if (!admin.passwordHash || admin.passwordHash === corruptHash) {
        console.log('⚠️ [Database Repair] Detected corrupted/obsolete admin password hash in db.json. Restoring default Abu-Qura123 password hash.');
        admin.passwordHash = hashPassword('Abu-Qura123');
      }
      admin.isSuperAdmin = true;
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    return parsed;
  } catch (err) {
    const fallbackData: DataSchema = {
      users: [
        {
          id: 'admin-1',
          username: 'Abu-Qura',
          email: 'admin@abuqura.com',
          passwordHash: hashPassword('Abu-Qura123'),
          role: 'admin',
          createdAt: new Date().toISOString(),
          isSuperAdmin: true
        }
      ],
      orders: [],
      menu: DEFAULT_MENU,
      categories: DEFAULT_CATEGORIES,
      settings: {
        adminPhone: '01120751465'
      },
      deletedMenuItemIds: [],
      deletedCategoryIds: [],
      deletedOrderIds: [],
      deletedUserIds: [],
      dirtyMenuItemIds: [],
      dirtyCategoryIds: [],
      dirtyOrderIds: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallbackData, null, 2), 'utf-8');
    return fallbackData;
  }
}

// In-memory data copy synced to disk
let dbCache: DataSchema = initDB();

let isWriting = false;
let writePending = false;
let lastWriteTime = 0;
const THROTTLE_MS = 2000; // Throttle disk writes to at most once every 2 seconds under heavy load

async function saveToDiskAsync() {
  const now = Date.now();
  const timeSinceLastWrite = now - lastWriteTime;

  if (isWriting) {
    writePending = true;
    return;
  }

  if (timeSinceLastWrite < THROTTLE_MS) {
    if (writePending) return;
    writePending = true;
    setTimeout(() => {
      saveToDiskAsync();
    }, THROTTLE_MS - timeSinceLastWrite);
    return;
  }

  isWriting = true;
  writePending = false;
  lastWriteTime = Date.now();

  try {
    const tempFile = DB_FILE + '.tmp';
    const dataStr = JSON.stringify(dbCache); // Remove nested pretty-print formatting for maximum speed & disk space saving
    await fs.promises.writeFile(tempFile, dataStr, 'utf-8');
    await fs.promises.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving DB to disk asynchronously:', err);
  } finally {
    isWriting = false;
    if (writePending) {
      saveToDiskAsync();
    }
  }
}

function saveToDiskSync() {
  try {
    const dataStr = JSON.stringify(dbCache);
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, dataStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving DB to disk synchronously:', err);
  }
}

function saveToDisk() {
  saveToDiskAsync();
}

// ==========================================
// MONGODB SCHEMAS & CONFIG
// ==========================================
let MONGODB_URI = process.env.MONGODB_URI;

// 30-Year Veteran Resilience Fallback: If MONGODB_URI is not in process.env, 
// automatically look for a raw MongoDB connection string inside the .env file.
if (!MONGODB_URI) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      // Look for standard or SRV MongoDB URIs even if the user didn't write "MONGODB_URI="
      const match = envContent.match(/(mongodb(?:\+srv)?:\/\/[^\s"'`]+)/);
      if (match) {
        MONGODB_URI = match[1].trim();
        console.log('💡 [30-Yr Veteran Fallback] Found MongoDB connection string in .env without standard variable prefix. Using it automatically!');
      }
    }
  } catch (e) {
    // Ignore read errors
  }
}

// Check all process.env values in case it is named differently
if (!MONGODB_URI) {
  for (const key of Object.keys(process.env)) {
    const val = process.env[key];
    if (val && (val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'))) {
      MONGODB_URI = val;
      console.log(`💡 [30-Yr Veteran Fallback] Found MongoDB connection string under non-standard environment key: "${key}"!`);
      break;
    }
  }
}

let isMongoConnected = false;

// 1. User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, lowercase: true, trim: true, index: { unique: true, sparse: true } },
  passwordHash: { type: String },
  role: { type: String, required: true },
  createdAt: { type: String, required: true },
  phone: String,
  whatsapp: String,
  address: String,
  latitude: Number,
  longitude: Number,
  privacyEnabled: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false }
}, { id: false });
export const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as any;

// 1b. Admin Login Log Schema (for the admin_log_ins collection)
const AdminLoginSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  adminId: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, required: true }, // 'success' or 'failed'
  createdAt: { type: String, required: true, index: true }
}, { id: false, collection: 'admin_log_ins' });
export const AdminLoginModel = (mongoose.models.AdminLogin || mongoose.model('AdminLogin', AdminLoginSchema)) as any;

// 2. Category Schema
const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  nameAr: { type: String, required: true },
  nameEn: { type: String, required: true }
}, { id: false });
export const CategoryModel = (mongoose.models.Category || mongoose.model('Category', CategorySchema)) as any;

// 3. MenuItem Schema
const MenuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  nameAr: { type: String, required: true },
  nameEn: { type: String, required: true },
  descriptionAr: { type: String, default: '' },
  descriptionEn: { type: String, default: '' },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true, index: true },
  available: { type: Boolean, default: true }
}, { id: false });
export const MenuItemModel = (mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema)) as any;

// 4. Order Schema
const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  status: { type: String, required: true, index: true },
  notes: String,
  createdAt: { type: String, required: true, index: true },
  updatedAt: { type: String, required: true },
  phone: String,
  whatsapp: String,
  address: String,
  latitude: Number,
  longitude: Number
}, { id: false });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
export const OrderModel = (mongoose.models.Order || mongoose.model('Order', OrderSchema)) as any;

// 5. Settings Schema
const SettingsSchema = new mongoose.Schema({
  adminPhone: { type: String, default: '01120751465' }
});
export const SettingsModel = (mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)) as any;

// Seeding helper to guarantee default menu, categories, settings and admin on cloud dbs
async function seedMongoData() {
  try {
    const adminDoc = await UserModel.findOne({ username: 'Abu-Qura' });
    if (!adminDoc) {
      const localAdmins = dbCache.users.filter(u => u.role === 'admin');
      if (localAdmins.length > 0) {
        await UserModel.insertMany(localAdmins.map(u => ({ ...u, isSuperAdmin: u.username === 'Abu-Qura' })));
      } else {
        await UserModel.create({
          id: 'admin-1',
          username: 'Abu-Qura',
          email: 'admin@abuqura.com',
          passwordHash: hashPassword('Abu-Qura123'),
          role: 'admin',
          createdAt: new Date().toISOString(),
          isSuperAdmin: true
        });
      }
      console.log('Successfully pre-seeded primary Admin account inside MongoDB Cluster.');
    } else {
      // Always guarantee isSuperAdmin is true and correct role / email / password are set
      const corruptHash = "acf3929fbc02247b2645db3b038e867c7b2cd02cc9a2212475fad3724702c453691234437c226b4b735defa4ae352369c1897099c91bb9ee6d22a44165de329d";
      const hasCorrupt = !adminDoc.passwordHash || adminDoc.passwordHash === corruptHash;
      const targetHash = hasCorrupt ? hashPassword('Abu-Qura123') : adminDoc.passwordHash;
      
      if (hasCorrupt) {
        console.log('⚠️ [MongoDB Repair] Detected corrupted/obsolete admin password hash in MongoDB. Restoring default Abu-Qura123 password hash.');
      }

      await UserModel.updateOne(
        { username: 'Abu-Qura' },
        { 
          $set: { 
            id: 'admin-1',
            email: 'admin@abuqura.com', 
            passwordHash: targetHash,
            isSuperAdmin: true,
            role: 'admin'
          } 
        }
      );
      console.log('Successfully verified/upgraded primary Admin account inside MongoDB with email, password hash, and SuperAdmin flag.');
    }

    const catCount = await CategoryModel.countDocuments();
    if (catCount === 0) {
      const localCats = dbCache.categories.length > 0 ? dbCache.categories : DEFAULT_CATEGORIES;
      await CategoryModel.insertMany(localCats);
      console.log('Successfully pre-seeded Egyptian culinary categories inside MongoDB.');
    }

    const menuCount = await MenuItemModel.countDocuments();
    if (menuCount === 0) {
      const localMenu = dbCache.menu.length > 0 ? dbCache.menu : DEFAULT_MENU;
      await MenuItemModel.insertMany(localMenu.map(m => ({
        ...m,
        available: m.available !== false
      })));
      console.log('Successfully pre-seeded authentic rural menu items inside MongoDB.');
    }

    const settingsCount = await SettingsModel.countDocuments();
    if (settingsCount === 0) {
      const localSettings = dbCache.settings || { adminPhone: '01120751465' };
      await SettingsModel.create(localSettings);
      console.log('Successfully pre-seeded default general settings inside MongoDB.');
    }
  } catch (err) {
    console.error('Error pre-seeding MongoDB cluster default data:', err);
  }
}

mongoose.set('bufferCommands', false);

if (MONGODB_URI) {
  // Production-grade connection pooling and resilience configuration
  const connectionOptions = {
    maxPoolSize: 100,             // Support up to 100 concurrent DB socket connections under heavy load
    minPoolSize: 10,              // Keep 10 connections warm to avoid initial handshake latency spikes
    socketTimeoutMS: 45000,       // Terminate inactive sockets after 45 seconds
    serverSelectionTimeoutMS: 10000, // Timeout after 10s if the cluster is unreachable (prevents infinite hanging)
    heartbeatFrequencyMS: 10000,  // Check MongoDB cluster health every 10 seconds
    retryWrites: true,            // Automatically retry failed write operations
    retryReads: true,             // Automatically retry failed read operations
    bufferCommands: false,        // Explicitly disable buffering on this connection
  };

  // Configure connection lifecycle events for real-time visibility
  mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connection established to persistent cloud MongoDB Cluster.');
    isMongoConnected = true;
    // Immediate seeding and reconciliation upon establishing connection
    (async () => {
      await seedMongoData();
      await reconcileDatabases();
    })().catch(err => console.error('Initial database seeding or reconciliation failure:', err));
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error under heavy load:', err);
    isMongoConnected = mongoose.connection.readyState === 1;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Mongoose connection lost! Mongoose will automatically attempt reconnecting...');
    isMongoConnected = false;
  });

  mongoose.connect(MONGODB_URI, connectionOptions)
    .then(async () => {
      await seedMongoData();
    })
    .catch((err) => {
      console.error('❌ Failed to establish initial connection to MongoDB. Falling back to local filesystem:', err);
      isMongoConnected = false;
    });

  // Start periodic background bidirectional reconciliation interval (every 30 seconds)
  setInterval(() => {
    reconcileDatabases().catch(err => console.error('Background database sync iteration error:', err));
  }, 30000);
} else {
  console.log('⚠️ MONGODB_URI not found. Running under high-performance local file-system storage (data/db.json).');
}

// ==========================================
// 30-YEAR VETERAN AUTO-FALLBACK & SYNC ENGINES
// ==========================================

async function runMongo<T>(task: () => Promise<T>, fallback: () => Promise<T> | T): Promise<T> {
  const isCurrentlyConnected = mongoose.connection.readyState === 1;
  if (!MONGODB_URI || !isCurrentlyConnected) {
    return Promise.resolve(fallback());
  }

  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('MongoDB operation timed out after 10000ms under heavy load'));
    }, 10000);
  });

  try {
    const result = await Promise.race([
      task(),
      timeoutPromise
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId);
    console.warn('⚠️ [30-Yr Veteran Resilient Fallback] MongoDB query failed or timed out:', err.message || err);
    return Promise.resolve(fallback());
  }
}

// 30-YEAR VETERAN RESILIENT IDENTIFIER RESOLVER
// Resolves document matching by 'id' property or safely by '_id' if valid ObjectId
function getResilientQuery(id: string) {
  const safeId = typeof id === 'string' ? id : String(id);
  const orQueries: any[] = [{ id: safeId }];
  if (safeId && /^[0-9a-fA-F]{24}$/.test(safeId)) {
    try {
      orQueries.push({ _id: new mongoose.Types.ObjectId(safeId) });
    } catch (e) {
      // Ignore conversion failures
    }
  }
  return { $or: orQueries };
}

const lastMutatedTimestamps = new Map<string, number>();

function recordMutation(id: string) {
  lastMutatedTimestamps.set(id, Date.now());
}

let isReconciling = false;

export async function reconcileDatabases() {
  const isCurrentlyConnected = mongoose.connection.readyState === 1;
  if (!MONGODB_URI || !isCurrentlyConnected) return;
  if (isReconciling) return;
  isReconciling = true;

  const reconStartedAt = Date.now();

  try {
    console.log('🔄 [Reconciliation Engine] Starting periodic synchronization (MongoDB Source of Truth)...');

    // 1. Sync Settings
    try {
      const mongoSettings = await SettingsModel.findOne({}).lean();
      const localSettings = dbCache.settings || { adminPhone: '01120751465' };
      if (!mongoSettings) {
        await SettingsModel.create(localSettings);
      } else if (mongoSettings.adminPhone !== localSettings.adminPhone) {
        dbCache.settings = { adminPhone: mongoSettings.adminPhone };
        saveToDisk();
      }
    } catch (e) {
      console.error('Error syncing settings:', e);
    }

    // 2. Sync Categories
    try {
      const deletedIds = dbCache.deletedCategoryIds || [];
      const dirtyIds = dbCache.dirtyCategoryIds || [];
      
      // First, purge any pending deleted categories from MongoDB using deleteMany
      if (deletedIds.length > 0) {
        console.log(`🧹 [Reconciliation] Purging ${deletedIds.length} pending deleted categories from MongoDB:`, deletedIds);
        for (const delId of deletedIds) {
          try {
            await CategoryModel.deleteMany(getResilientQuery(delId));
            await CategoryModel.collection.deleteMany({ id: delId });
          } catch (e) {
            console.error(`❌ [Reconciliation] Failed to delete category ${delId} from MongoDB during sync:`, e);
          }
        }
      }

      // Fetch categories from MongoDB
      const mongoCategories = await CategoryModel.find({}).lean() as any[];
      
      // Now, filter out any category that is still in deletedIds (just in case they haven't been deleted yet)
      const activeMongoCategories = mongoCategories.map((doc: any) => ({
        id: doc.id || doc._id?.toString() || '',
        nameAr: doc.nameAr || '',
        nameEn: doc.nameEn || ''
      })).filter(cat => cat.id && !deletedIds.includes(cat.id));

      const localCategories = dbCache.categories || [];
      const updatedLocalCategories: Category[] = [];

      // Detect local-only categories that are not in MongoDB and not deleted
      for (const localCat of localCategories) {
        if (!deletedIds.includes(localCat.id)) {
          const existsInMongo = activeMongoCategories.some(c => c.id === localCat.id);
          if (!existsInMongo) {
            if (dirtyIds.includes(localCat.id)) {
              // Real local-only offline category, keep it
              updatedLocalCategories.push(localCat);
            } else {
              // Deleted from MongoDB, do not resurrect it
              console.log(`📌 [Reconciliation] Category ${localCat.id} is missing from MongoDB and not marked as dirty. Removing from local cache.`);
            }
          } else {
            updatedLocalCategories.push(localCat);
          }
        }
      }
      dbCache.categories = updatedLocalCategories;
      dbCache.dirtyCategoryIds = [...new Set(dirtyIds)];

      // Push local dirty categories to MongoDB
      const currentDirtyCategoryIds = dbCache.dirtyCategoryIds || [];
      for (const localCat of localCategories) {
        if (currentDirtyCategoryIds.includes(localCat.id)) {
          try {
            const mongoCat = activeMongoCategories.find(c => c.id === localCat.id);
            if (!mongoCat) {
              await CategoryModel.create(localCat);
              activeMongoCategories.push(localCat);
              console.log(`Synced Category ${localCat.id} from local cache to MongoDB (Offline Recovery).`);
            } else {
              await CategoryModel.updateOne(
                getResilientQuery(localCat.id),
                { $set: { nameAr: localCat.nameAr, nameEn: localCat.nameEn } }
              );
              Object.assign(mongoCat, localCat); // Update in-memory fetched list
              console.log(`Updated Category ${localCat.id} in MongoDB (Offline Sync).`);
            }
            // Clear dirty flag
            dbCache.dirtyCategoryIds = dbCache.dirtyCategoryIds.filter(x => x !== localCat.id);
            saveToDisk();
          } catch (itemErr) {
            console.error(`❌ [Reconciliation] Failed to sync dirty category item ${localCat.id} to MongoDB:`, itemErr);
          }
        }
      }

      // Now update local cache to match MongoDB, preserving local active items and newer mutations without race conditions
      const reconciledCategories: Category[] = [];
      const liveDeletedCategoryIds = dbCache.deletedCategoryIds || [];

      for (const mongoCat of activeMongoCategories) {
        const lastMutated = lastMutatedTimestamps.get(mongoCat.id) || 0;
        if (lastMutated >= reconStartedAt) {
          const liveCat = dbCache.categories.find(c => c.id === mongoCat.id);
          if (liveCat && !liveDeletedCategoryIds.includes(mongoCat.id)) {
            reconciledCategories.push(liveCat);
          }
          continue;
        }
        if (!liveDeletedCategoryIds.includes(mongoCat.id)) {
          reconciledCategories.push(mongoCat);
        }
      }
      for (const localCat of dbCache.categories) {
        if (!liveDeletedCategoryIds.includes(localCat.id) && !reconciledCategories.some(c => c.id === localCat.id)) {
          reconciledCategories.push(localCat);
        }
      }

      // Cleanup tombstone list dynamically without erasing concurrent live deletions
      if (deletedIds.length > 0) {
        const stillExistingIds = new Set<string>();
        try {
          const orQueries: any[] = [{ id: { $in: deletedIds } }];
          const objectIds: any[] = [];
          for (const delId of deletedIds) {
            if (delId && /^[0-9a-fA-F]{24}$/.test(delId)) {
              try {
                objectIds.push(new mongoose.Types.ObjectId(delId));
              } catch (e) {}
            }
          }
          if (objectIds.length > 0) {
            orQueries.push({ _id: { $in: objectIds } });
          }
          const existingDocs = await CategoryModel.find({ $or: orQueries }, { id: 1, _id: 1 }).lean();
          existingDocs.forEach((doc: any) => {
            if (doc.id) stillExistingIds.add(doc.id);
            if (doc._id) stillExistingIds.add(doc._id.toString());
          });
        } catch (e) {
          console.error('Error checking existing deleted categories in MongoDB:', e);
          deletedIds.forEach(id => stillExistingIds.add(id));
        }

        dbCache.deletedCategoryIds = (dbCache.deletedCategoryIds || []).filter(delId => {
          if (!deletedIds.includes(delId)) {
            return true;
          }
          const lastMutated = lastMutatedTimestamps.get(delId) || 0;
          if (Date.now() - lastMutated < 3600000) { // 1 hour safety retention buffer to eliminate replica set lag & quick refresh races
            return true;
          }
          return stillExistingIds.has(delId);
        });
      }

      dbCache.categories = reconciledCategories;
      saveToDisk();
    } catch (e) {
      console.error('Error syncing categories:', e);
    }

    // 3. Sync Menu Items
    try {
      const deletedIds = dbCache.deletedMenuItemIds || [];
      const dirtyIds = dbCache.dirtyMenuItemIds || [];

      // First, purge any pending deleted menu items from MongoDB using deleteMany
      if (deletedIds.length > 0) {
        console.log(`🧹 [Reconciliation] Purging ${deletedIds.length} pending deleted menu items from MongoDB:`, deletedIds);
        for (const delId of deletedIds) {
          try {
            await MenuItemModel.deleteMany(getResilientQuery(delId));
            await MenuItemModel.collection.deleteMany({ id: delId });
          } catch (e) {
            console.error(`❌ [Reconciliation] Failed to delete menu item ${delId} from MongoDB during sync:`, e);
          }
        }
      }

      // Fetch active menu items from MongoDB
      const mongoMenu = await MenuItemModel.find({}).lean() as any[];
      
      const activeMongoMenu = mongoMenu.map((doc: any) => ({
        id: doc.id || doc._id?.toString() || '',
        nameAr: doc.nameAr || '',
        nameEn: doc.nameEn || doc.nameAr || '',
        descriptionAr: doc.descriptionAr || '',
        descriptionEn: doc.descriptionEn || '',
        price: doc.price || 0,
        image: doc.image || '',
        category: doc.category || '',
        available: doc.available !== false
      })).filter(item => item.id && !deletedIds.includes(item.id)) as MenuItem[];

      const localMenu = dbCache.menu || [];
      const updatedLocalMenu: MenuItem[] = [];

      // Detect local-only menu items
      for (const localItem of localMenu) {
        if (!deletedIds.includes(localItem.id)) {
          const existsInMongo = activeMongoMenu.some(m => m.id === localItem.id);
          if (!existsInMongo) {
            if (dirtyIds.includes(localItem.id)) {
              // Real local-only offline menu item, keep it
              updatedLocalMenu.push(localItem);
            } else {
              // Deleted from MongoDB, do not resurrect it
              console.log(`📌 [Reconciliation] Menu item ${localItem.id} is missing from MongoDB and not marked as dirty. Removing from local cache.`);
            }
          } else {
            updatedLocalMenu.push(localItem);
          }
        }
      }
      dbCache.menu = updatedLocalMenu;
      dbCache.dirtyMenuItemIds = [...new Set(dirtyIds)];

      // Push local dirty menu items to MongoDB
      const currentDirtyMenuItemIds = dbCache.dirtyMenuItemIds || [];
      for (const localItem of localMenu) {
        if (currentDirtyMenuItemIds.includes(localItem.id)) {
          try {
            const mongoItem = activeMongoMenu.find(m => m.id === localItem.id);
            if (!mongoItem) {
              await MenuItemModel.create(localItem as any);
              activeMongoMenu.push(localItem);
              console.log(`Synced Menu Item ${localItem.id} from local cache to MongoDB (Offline Recovery).`);
            } else {
              await MenuItemModel.updateOne(
                getResilientQuery(localItem.id),
                {
                  $set: {
                    nameAr: localItem.nameAr,
                    nameEn: localItem.nameEn || localItem.nameAr,
                    descriptionAr: localItem.descriptionAr || '',
                    descriptionEn: localItem.descriptionEn || '',
                    price: localItem.price,
                    image: localItem.image,
                    category: localItem.category,
                    available: localItem.available !== false
                  }
                }
              );
              Object.assign(mongoItem, localItem); // Update in-memory fetched list
              console.log(`Updated Menu Item ${localItem.id} in MongoDB (Offline Sync).`);
            }
            // Clear dirty flag
            dbCache.dirtyMenuItemIds = dbCache.dirtyMenuItemIds.filter(x => x !== localItem.id);
            saveToDisk();
          } catch (itemErr) {
            console.error(`❌ [Reconciliation] Failed to sync dirty menu item ${localItem.id} to MongoDB:`, itemErr);
          }
        }
      }

      // Build reconciled menu items list, preserving active items and newer mutations without race conditions
      const reconciledMenu: MenuItem[] = [];
      const liveDeletedMenuItemIds = dbCache.deletedMenuItemIds || [];

      for (const item of activeMongoMenu) {
        const lastMutated = lastMutatedTimestamps.get(item.id) || 0;
        if (lastMutated >= reconStartedAt) {
          const liveItem = dbCache.menu.find(m => m.id === item.id);
          if (liveItem && !liveDeletedMenuItemIds.includes(item.id)) {
            reconciledMenu.push(liveItem);
          }
          continue;
        }
        if (!liveDeletedMenuItemIds.includes(item.id)) {
          reconciledMenu.push(item);
        }
      }
      for (const localItem of dbCache.menu) {
        if (!liveDeletedMenuItemIds.includes(localItem.id) && !reconciledMenu.some(m => m.id === localItem.id)) {
          reconciledMenu.push(localItem);
        }
      }

      // Cleanup tombstone list dynamically without erasing concurrent live deletions
      if (deletedIds.length > 0) {
        const stillExistingIds = new Set<string>();
        try {
          const orQueries: any[] = [{ id: { $in: deletedIds } }];
          const objectIds: any[] = [];
          for (const delId of deletedIds) {
            if (delId && /^[0-9a-fA-F]{24}$/.test(delId)) {
              try {
                objectIds.push(new mongoose.Types.ObjectId(delId));
              } catch (e) {}
            }
          }
          if (objectIds.length > 0) {
            orQueries.push({ _id: { $in: objectIds } });
          }
          const existingDocs = await MenuItemModel.find({ $or: orQueries }, { id: 1, _id: 1 }).lean();
          existingDocs.forEach((doc: any) => {
            if (doc.id) stillExistingIds.add(doc.id);
            if (doc._id) stillExistingIds.add(doc._id.toString());
          });
        } catch (e) {
          console.error('Error checking existing deleted menu items in MongoDB:', e);
          deletedIds.forEach(id => stillExistingIds.add(id));
        }

        dbCache.deletedMenuItemIds = (dbCache.deletedMenuItemIds || []).filter(delId => {
          if (!deletedIds.includes(delId)) {
            return true;
          }
          const lastMutated = lastMutatedTimestamps.get(delId) || 0;
          if (Date.now() - lastMutated < 3600000) { // 1 hour safety retention buffer to eliminate replica set lag & quick refresh races
            return true;
          }
          return stillExistingIds.has(delId);
        });
      }

      dbCache.menu = reconciledMenu;
      saveToDisk();
    } catch (e) {
      console.error('Error syncing menu:', e);
    }

    // 4. Sync Users
    try {
      const deletedUserIds = dbCache.deletedUserIds || [];

      // First, purge any pending deleted users from MongoDB
      if (deletedUserIds.length > 0) {
        console.log(`🧹 [Reconciliation] Purging ${deletedUserIds.length} pending deleted users from MongoDB:`, deletedUserIds);
        for (const delId of deletedUserIds) {
          try {
            await UserModel.deleteOne({ id: delId });
          } catch (e) {
            console.error(`❌ [Reconciliation] Failed to delete user ${delId} from MongoDB during sync:`, e);
          }
        }
      }

      const mongoUsers = await UserModel.find({}).lean() as any[];
      const activeMongoUsers = mongoUsers.filter(u => u.id && !deletedUserIds.includes(u.id));
      const localUsers = dbCache.users || [];

      // Sync any missing local users to MongoDB (excluding deleted ones)
      for (const localUser of localUsers) {
        if (!deletedUserIds.includes(localUser.id)) {
          const hasInMongo = activeMongoUsers.some(u => (u.id || u._id?.toString()) === localUser.id);
          if (!hasInMongo) {
            try {
              await UserModel.updateOne({ id: localUser.id }, { $set: localUser }, { upsert: true });
              console.log(`Synced User ${localUser.id} from local cache to MongoDB.`);
            } catch (uErr) {
              console.error(`Failed to sync user ${localUser.id} to MongoDB:`, uErr);
            }
          }
        }
      }

      // Pull refreshed list from MongoDB
      const updatedMongoUsers = await UserModel.find({}).lean() as any[];
      const reconciledUsers: User[] = [];

      for (const u of updatedMongoUsers) {
        if (!deletedUserIds.includes(u.id)) {
          reconciledUsers.push({
            id: u.id || u._id?.toString() || '',
            username: u.username || '',
            email: u.email || '',
            passwordHash: u.passwordHash || '',
            role: u.role || 'user',
            createdAt: u.createdAt || new Date().toISOString(),
            phone: u.phone,
            whatsapp: u.whatsapp,
            address: u.address,
            latitude: u.latitude,
            longitude: u.longitude,
            privacyEnabled: u.privacyEnabled !== undefined ? Boolean(u.privacyEnabled) : false
          });
        }
      }

      // Non-destructive fallback merge: keep any local-only users that failed to sync and are not deleted so they are never lost
      for (const localUser of localUsers) {
        if (!deletedUserIds.includes(localUser.id) && !reconciledUsers.some(u => u.id === localUser.id)) {
          reconciledUsers.push(localUser);
        }
      }

      // Cleanup tombstone list dynamically without erasing concurrent live deletions
      if (deletedUserIds.length > 0) {
        const stillExistingUserIds = new Set<string>();
        try {
          const existingDocs = await UserModel.find({ id: { $in: deletedUserIds } }, { id: 1 }).lean();
          existingDocs.forEach((doc: any) => {
            if (doc.id) stillExistingUserIds.add(doc.id);
          });
        } catch (e) {
          console.error('Error checking existing deleted users in MongoDB:', e);
          deletedUserIds.forEach(id => stillExistingUserIds.add(id));
        }

        dbCache.deletedUserIds = (dbCache.deletedUserIds || []).filter(delId => {
          if (!deletedUserIds.includes(delId)) {
            return true;
          }
          const lastMutated = lastMutatedTimestamps.get(delId) || 0;
          if (Date.now() - lastMutated < 3600000) { // 1 hour safety retention buffer
            return true;
          }
          return stillExistingUserIds.has(delId);
        });
      }

      dbCache.users = reconciledUsers;
      saveToDisk();
    } catch (e) {
      console.error('Error syncing users:', e);
    }

    // 5. Sync Orders
    try {
      const deletedIds = dbCache.deletedOrderIds || [];
      const dirtyIds = dbCache.dirtyOrderIds || [];

      // First, purge any pending deleted orders from MongoDB using deleteMany
      if (deletedIds.length > 0) {
        console.log(`🧹 [Reconciliation] Purging ${deletedIds.length} pending deleted orders from MongoDB:`, deletedIds);
        for (const delId of deletedIds) {
          try {
            await OrderModel.deleteMany(getResilientQuery(delId));
            await OrderModel.collection.deleteMany({ id: delId });
          } catch (e) {
            console.error(`❌ [Reconciliation] Failed to delete order ${delId} from MongoDB during sync:`, e);
          }
        }
      }

      // Fetch active orders from MongoDB (limited to recent 1000 for high-performance memory preservation)
      const mongoOrders = await OrderModel.find({}).sort({ createdAt: -1 }).limit(1000).lean() as any[];
      
      const activeMongoOrders = mongoOrders.map((doc: any) => ({
        id: doc.id || doc._id?.toString() || '',
        userId: doc.userId || '',
        username: doc.username || '',
        items: doc.items || [],
        total: doc.total || 0,
        status: doc.status || 'pending',
        notes: doc.notes || '',
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: doc.updatedAt || new Date().toISOString(),
        phone: doc.phone || '',
        whatsapp: doc.whatsapp || '',
        address: doc.address || '',
        latitude: doc.latitude,
        longitude: doc.longitude
      })).filter(o => o.id && !deletedIds.includes(o.id)) as Order[];

      const localOrders = dbCache.orders || [];
      const updatedLocalOrders: Order[] = [];

      // Reconcile and push offline-created orders or purge stale orders
      for (const localOrder of localOrders) {
        if (!deletedIds.includes(localOrder.id)) {
          const existsInMongo = activeMongoOrders.some(o => o.id === localOrder.id);
          if (!existsInMongo) {
            if (dirtyIds.includes(localOrder.id)) {
              // This is a verified offline-created order waiting to be synced to MongoDB
              try {
                await OrderModel.create(localOrder);
                console.log(`✅ [Reconciliation] Successfully synchronized offline-created order ${localOrder.id} to MongoDB.`);
                updatedLocalOrders.push(localOrder);
              } catch (oErr) {
                console.error(`❌ [Reconciliation] Failed to create offline order ${localOrder.id} in MongoDB:`, oErr);
                // Retain in local cache to retry on the next reconciliation interval
                updatedLocalOrders.push(localOrder);
              }
            } else {
              console.log(`📌 [Reconciliation] Order ${localOrder.id} is missing from MongoDB and not marked dirty. Purging from local cache to prevent stale data.`);
            }
          } else {
            updatedLocalOrders.push(localOrder);
          }
        }
      }
      dbCache.orders = updatedLocalOrders;
      dbCache.dirtyOrderIds = [...new Set(dirtyIds)];

      // Push status modifications of existing orders to MongoDB and clean dirty list
      const currentDirtyOrderIds = dbCache.dirtyOrderIds || [];
      for (const localOrder of dbCache.orders) {
        if (currentDirtyOrderIds.includes(localOrder.id)) {
          try {
            const mongoOrder = activeMongoOrders.find(o => o.id === localOrder.id);
            if (!mongoOrder) {
              // If it's a newly synced offline order, it was already created in the loop above.
              // Let's verify if it's now in activeMongoOrders, or if we can safely skip the status update since it's already updated.
              const newlySynced = await OrderModel.findOne(getResilientQuery(localOrder.id)).lean();
              if (newlySynced) {
                await OrderModel.updateOne(
                  getResilientQuery(localOrder.id),
                  { $set: { status: localOrder.status, updatedAt: localOrder.updatedAt } }
                );
                console.log(`✅ [Reconciliation] Updated status of newly synchronized order ${localOrder.id} in MongoDB.`);
              } else {
                console.warn(`⚠️ [Reconciliation] Order ${localOrder.id} does not exist in MongoDB. Skipping status modification.`);
              }
            } else {
              await OrderModel.updateOne(
                getResilientQuery(localOrder.id),
                { $set: { status: localOrder.status, updatedAt: localOrder.updatedAt } }
              );
              Object.assign(mongoOrder, localOrder); // Update in-memory fetched list
              console.log(`✅ [Reconciliation] Updated Order ${localOrder.id} status to ${localOrder.status} in MongoDB (Offline Sync)`);
            }
            // Clear dirty flag for this order
            dbCache.dirtyOrderIds = dbCache.dirtyOrderIds.filter(x => x !== localOrder.id);
            saveToDisk();
          } catch (orderErr) {
            console.error(`❌ [Reconciliation] Failed to sync dirty order ${localOrder.id} to MongoDB:`, orderErr);
          }
        }
      }

      // Build reconciled orders list, preserving active items and newer mutations without race conditions
      const reconciledOrders: Order[] = [];
      const liveDeletedOrderIds = dbCache.deletedOrderIds || [];

      for (const order of activeMongoOrders) {
        const lastMutated = lastMutatedTimestamps.get(order.id) || 0;
        if (lastMutated >= reconStartedAt) {
          const liveOrder = dbCache.orders.find(o => o.id === order.id);
          if (liveOrder && !liveDeletedOrderIds.includes(order.id)) {
            reconciledOrders.push(liveOrder);
          }
          continue;
        }
        if (!liveDeletedOrderIds.includes(order.id)) {
          reconciledOrders.push(order);
        }
      }
      for (const localOrder of dbCache.orders) {
        if (!liveDeletedOrderIds.includes(localOrder.id) && !reconciledOrders.some(o => o.id === localOrder.id)) {
          reconciledOrders.push(localOrder);
        }
      }

      // Sort by createdAt descending
      reconciledOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Cleanup tombstone list dynamically without erasing concurrent live deletions
      if (deletedIds.length > 0) {
        const stillExistingIds = new Set<string>();
        try {
          const orQueries: any[] = [{ id: { $in: deletedIds } }];
          const objectIds: any[] = [];
          for (const delId of deletedIds) {
            if (delId && /^[0-9a-fA-F]{24}$/.test(delId)) {
              try {
                objectIds.push(new mongoose.Types.ObjectId(delId));
              } catch (e) {}
            }
          }
          if (objectIds.length > 0) {
            orQueries.push({ _id: { $in: objectIds } });
          }
          const existingDocs = await OrderModel.find({ $or: orQueries }, { id: 1, _id: 1 }).lean();
          existingDocs.forEach((doc: any) => {
            if (doc.id) stillExistingIds.add(doc.id);
            if (doc._id) stillExistingIds.add(doc._id.toString());
          });
        } catch (e) {
          console.error('Error checking existing deleted orders in MongoDB:', e);
          deletedIds.forEach(id => stillExistingIds.add(id));
        }

        dbCache.deletedOrderIds = (dbCache.deletedOrderIds || []).filter(delId => {
          if (!deletedIds.includes(delId)) {
            return true;
          }
          const lastMutated = lastMutatedTimestamps.get(delId) || 0;
          if (Date.now() - lastMutated < 3600000) { // 1 hour safety retention buffer to eliminate replica set lag & quick refresh races
            return true;
          }
          return stillExistingIds.has(delId);
        });
      }

      dbCache.orders = reconciledOrders;
      saveToDisk();
    } catch (e) {
      console.error('Error syncing orders:', e);
    }

    console.log('✅ [Reconciliation Engine] Periodic synchronization completed successfully.');
  } catch (err) {
    console.error('❌ [Reconciliation Engine] Synchronization error:', err);
  } finally {
    isReconciling = false;
  }
}

// ==========================================
// UNIFIED DYNAMIC DATABASE CONTROLLER WITH 30-YR VETERAN SWR CACHING
// ==========================================

// SWR Cache Configurations
const CACHE_TTL_MS = 3000; // 3 seconds TTL for lists to eliminate MongoDB pressure under 2000 RPS
const STATS_CACHE_TTL_MS = 5000; // 5 seconds TTL for heavy aggregation dashboard stats

interface CacheContainer<T> {
  data: T;
  timestamp: number;
}

let menuCache: CacheContainer<MenuItem[]> | null = null;
let categoriesCache: CacheContainer<Category[]> | null = null;
let settingsCache: CacheContainer<{ adminPhone: string }> | null = null;
let ordersCache: CacheContainer<Order[]> | null = null;
let statsCache: CacheContainer<{ totalOrders: number; totalRevenue: number; pendingOrders: number; completedOrders: number }> | null = null;

// Production-grade Simple LRU Cache class to prevent unbounded memory growth under heavy production loads
class SimpleLRUCache<K, V> {
  private max: number;
  private cache: Map<K, V>;

  constructor(max = 200) {
    this.max = max;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // Refresh the key by moving it to the end
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // Evict the oldest entry (first key in iteration)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// User-specific orders cache using SimpleLRUCache to keep client retrieval under 1ms with automatic memory boundary enforcement
const userOrdersCache = new SimpleLRUCache<string, CacheContainer<Order[]>>(500);

// Cache Invalidation Helpers
function invalidateMenuCache() { menuCache = null; }
function invalidateCategoriesCache() { categoriesCache = null; }
function invalidateSettingsCache() { settingsCache = null; }
function invalidateOrdersCache() {
  ordersCache = null;
  statsCache = null;
  userOrdersCache.clear();
}

let localAdminLoginLogs: any[] = [];

export const DatabaseService = {
  // --- USERS ---
  async getUsers(): Promise<User[]> {
    return runMongo(
      async () => {
        const docs = await UserModel.find({}).lean();
        return docs as unknown as User[];
      },
      async () => dbCache.users
    );
  },

  async findUserByEmail(email: string): Promise<User | undefined> {
    if (!email || typeof email !== 'string') return undefined;
    const cleanEmail = email.trim().toLowerCase();
    const cachedUser = dbCache.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (cachedUser) {
      return cachedUser;
    }
    return runMongo(
      async () => {
        let doc = await UserModel.findOne({ email: cleanEmail }).lean();
        if (doc) {
          const u = doc as unknown as User;
          if (!dbCache.users.some(existing => existing.id === u.id)) {
            dbCache.users.push(u);
            saveToDisk();
          }
          return u;
        }
        return undefined;
      },
      async () => undefined
    );
  },

  async findUserByName(username: string): Promise<User | undefined> {
    if (!username || typeof username !== 'string') return undefined;
    const cachedUser = dbCache.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (cachedUser) {
      return cachedUser;
    }
    return runMongo(
      async () => {
        let doc = await UserModel.findOne({ username }).lean();
        if (!doc) {
          const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          doc = await UserModel.findOne({ username: { $regex: new RegExp(`^${escaped}$`, 'i') } }).lean();
        }
        if (doc) {
          const u = doc as unknown as User;
          if (!dbCache.users.some(existing => existing.id === u.id)) {
            dbCache.users.push(u);
            saveToDisk();
          }
          return u;
        }
        return undefined;
      },
      async () => undefined
    );
  },

  async findUserById(id: string): Promise<User | undefined> {
    const cachedUser = dbCache.users.find(u => u.id === id);
    if (cachedUser) {
      return cachedUser;
    }
    return runMongo(
      async () => {
        const doc = await UserModel.findOne(getResilientQuery(id)).lean();
        if (doc) {
          const u = doc as unknown as User;
          if (!dbCache.users.some(existing => existing.id === u.id)) {
            dbCache.users.push(u);
            saveToDisk();
          }
          return u;
        }
        return undefined;
      },
      async () => undefined
    );
  },

  async createUser(username: string, email?: string, passwordPlain?: string, isSystemCreated = false): Promise<User> {
    const trimmed = typeof username === 'string' ? username.trim() : '';
    if (trimmed.length === 0) {
      throw new Error('اسم المستخدم مطلوب ولا يمكن أن يكون فارغاً');
    }
    if (trimmed.length > 30) {
      throw new Error('اسم المستخدم طويل جداً (الحد الأقصى 30 حرف)');
    }
    
    const sanitizedUsername = trimmed.replace(/<\/?[^>]+(>|$)/g, "");
    if (sanitizedUsername.length === 0) {
      throw new Error('اسم مستخدم غير صالح');
    }

    // Enterprise-grade Similarity & Spoofing check:
    // Strip non-alphanumeric characters and compare case-insensitively
    const normalizedInput = sanitizedUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedAdmin = 'abuqura';
    
    // If not a secure, designated system recreation/initialization, block any administrative spoofing/homograph names
    if (!isSystemCreated) {
      if (normalizedInput === normalizedAdmin || normalizedInput === 'admin' || normalizedInput === 'administrator') {
        throw new Error('غير مسموح بإنشاء حساب باسم مستخدم يشابه اسم المسؤول لتجنب أي تداخل أو انتحال شخصية.');
      }
    }

    const existingName = await this.findUserByName(sanitizedUsername);
    if (existingName) {
      throw new Error('اسم المستخدم موجود بالفعل لمستخدم آخر');
    }

    let finalEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    let finalPasswordHash = '';

    const isPrimaryAdmin = sanitizedUsername === 'Abu-Qura';

    if (isPrimaryAdmin) {
      // Direct protection: Ensure isPrimaryAdmin can ONLY be true if explicitly allowed via isSystemCreated flag
      if (!isSystemCreated) {
        throw new Error('غير مسموح بإنشاء حساب المسؤول الرئيسي يدوياً خارج النظام.');
      }
      finalEmail = 'admin@abuqura.com';
      finalPasswordHash = hashPassword('Abu-Qura123');
    } else {
      if (!email || !passwordPlain) {
        throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان لإنشاء حساب جديد');
      }

      if (typeof email !== 'string' || typeof passwordPlain !== 'string') {
        throw new Error('البريد الإلكتروني وكلمة المرور يجب أن يكونا نصوصاً صالحة');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalEmail)) {
        throw new Error('البريد الإلكتروني المدخل غير صالح');
      }

      const existingEmail = await this.findUserByEmail(finalEmail);
      if (existingEmail) {
        throw new Error('البريد الإلكتروني مسجل بالفعل لمستخدم آخر');
      }

      if (passwordPlain.length < 8) {
        throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      }
      if (!/[A-Z]/.test(passwordPlain)) {
        throw new Error('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)');
      }
      if (!/[a-z]/.test(passwordPlain)) {
        throw new Error('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل (a-z)');
      }
      if (!/[0-9]/.test(passwordPlain)) {
        throw new Error('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل (0-9)');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordPlain)) {
        throw new Error('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل مثل (!@#$%^&*)');
      }

      finalPasswordHash = hashPassword(passwordPlain);
    }

    const newUser: User = {
      id: isPrimaryAdmin ? 'admin-1' : 'usr_' + crypto.randomBytes(5).toString('hex'),
      username: sanitizedUsername,
      email: finalEmail,
      passwordHash: finalPasswordHash,
      role: isPrimaryAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      isSuperAdmin: isPrimaryAdmin
    };

    dbCache.users.push(newUser);
    saveToDisk();

    await runMongo(
      async () => {
        await UserModel.create(newUser);
      },
      async () => {}
    );

    return newUser;
  },

  // --- MENU ---
  async getMenu(): Promise<MenuItem[]> {
    const now = Date.now();
    const deletedIds = dbCache.deletedMenuItemIds || [];

    if (menuCache && (now - menuCache.timestamp < CACHE_TTL_MS)) {
      return menuCache.data.filter(item => item.id && !deletedIds.includes(item.id));
    }

    if (menuCache) {
      this.refreshMenuBackground().catch(err => console.error('Background menu refresh error:', err));
      return menuCache.data.filter(item => item.id && !deletedIds.includes(item.id));
    }

    const items = await this.refreshMenuBackground();
    return items.filter(item => item.id && !deletedIds.includes(item.id));
  },

  async refreshMenuBackground(): Promise<MenuItem[]> {
    const taskStartedAt = Date.now();
    const items = await runMongo(
      async () => {
        const docs = await MenuItemModel.find({}).lean();
        return docs.map((doc: any) => ({
          id: doc.id || doc._id?.toString() || '',
          nameAr: doc.nameAr || '',
          nameEn: doc.nameEn || doc.nameAr || '',
          descriptionAr: doc.descriptionAr || '',
          descriptionEn: doc.descriptionEn || '',
          price: doc.price || 0,
          image: doc.image || '',
          category: doc.category || '',
          available: doc.available !== false
        })) as MenuItem[];
      },
      async () => dbCache.menu
    );

    const deletedIds = dbCache.deletedMenuItemIds || [];
    const dirtyIds = dbCache.dirtyMenuItemIds || [];

    // Safe merge to prevent overwriting local un-reconciled or pending edits
    const mergedMenu: MenuItem[] = [];
    for (const item of items) {
      const lastMutated = lastMutatedTimestamps.get(item.id) || 0;
      if (lastMutated >= taskStartedAt) {
        const localItem = dbCache.menu.find(m => m.id === item.id);
        if (localItem && !deletedIds.includes(item.id)) {
          mergedMenu.push(localItem);
        }
        continue;
      }

      if (deletedIds.includes(item.id)) continue;
      if (dirtyIds.includes(item.id)) {
        const localItem = dbCache.menu.find(m => m.id === item.id);
        if (localItem) {
          mergedMenu.push(localItem);
          continue;
        }
      }
      mergedMenu.push(item);
    }
    const localDirtyOnly = dbCache.menu.filter(
      localItem => dirtyIds.includes(localItem.id) && !items.some(m => m.id === localItem.id)
    );
    for (const localItem of localDirtyOnly) {
      const lastMutated = lastMutatedTimestamps.get(localItem.id) || 0;
      if (lastMutated >= taskStartedAt || !deletedIds.includes(localItem.id)) {
        mergedMenu.push(localItem);
      }
    }

    dbCache.menu = mergedMenu;
    saveToDisk();

    menuCache = { data: mergedMenu, timestamp: Date.now() };
    return mergedMenu;
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: 'm_' + crypto.randomBytes(5).toString('hex')
    };

    recordMutation(newItem.id);
    dbCache.menu.push(newItem);
    if (!dbCache.dirtyMenuItemIds) dbCache.dirtyMenuItemIds = [];
    dbCache.dirtyMenuItemIds.push(newItem.id);
    saveToDisk();
    invalidateMenuCache();

    await runMongo(
      async () => {
        await MenuItemModel.create(newItem);
        dbCache.dirtyMenuItemIds = (dbCache.dirtyMenuItemIds || []).filter(x => x !== newItem.id);
        saveToDisk();
        reconcileDatabases().catch(err => console.error('Post-create menu item reconciliation error:', err));
      },
      async () => {}
    );

    return newItem;
  },

  async updateMenuItem(id: string, updated: Partial<MenuItem>): Promise<MenuItem> {
    const index = dbCache.menu.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('الصنف غير موجود');
    }
    recordMutation(id);
    dbCache.menu[index] = {
      ...dbCache.menu[index],
      ...updated,
      id
    };
    if (!dbCache.dirtyMenuItemIds) dbCache.dirtyMenuItemIds = [];
    if (!dbCache.dirtyMenuItemIds.includes(id)) {
      dbCache.dirtyMenuItemIds.push(id);
    }
    saveToDisk();
    invalidateMenuCache();

    await runMongo(
      async () => {
        const result = await MenuItemModel.findOneAndUpdate(
          getResilientQuery(id),
          { $set: updated },
          { new: true, runValidators: true }
        ).lean();
        if (result) {
          dbCache.dirtyMenuItemIds = (dbCache.dirtyMenuItemIds || []).filter(x => x !== id);
          saveToDisk();
          reconcileDatabases().catch(err => console.error('Post-update menu item reconciliation error:', err));
        } else {
          console.warn(`⚠️ [updateMenuItem] Document with ID ${id} not found in MongoDB. Keeping dirty flag.`);
        }
      },
      async () => {}
    );

    return dbCache.menu[index];
  },

  async deleteMenuItem(id: string): Promise<void> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('معرف طبق الطعام غير صالح أو فارغ');
    }
    const safeId = id.trim();
    if (!dbCache.deletedMenuItemIds) {
      dbCache.deletedMenuItemIds = [];
    }
    if (!dbCache.deletedMenuItemIds.includes(safeId)) {
      dbCache.deletedMenuItemIds.push(safeId);
    }
    recordMutation(safeId);
    dbCache.menu = dbCache.menu.filter(item => item.id !== safeId);
    dbCache.dirtyMenuItemIds = (dbCache.dirtyMenuItemIds || []).filter(x => x !== safeId);
    saveToDiskSync();
    invalidateMenuCache();

    await runMongo(
      async () => {
        await MenuItemModel.deleteMany(getResilientQuery(safeId));
        await MenuItemModel.collection.deleteMany({ id: safeId });
        if (safeId && typeof safeId === 'string' && /^[0-9a-fA-F]{24}$/.test(safeId)) {
          try {
            await MenuItemModel.collection.deleteMany({ _id: new mongoose.Types.ObjectId(safeId) });
          } catch (e) {}
        }
        reconcileDatabases().catch(err => console.error('Post-delete menu item reconciliation error:', err));
      },
      async () => {}
    );
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    const now = Date.now();
    const deletedIds = dbCache.deletedCategoryIds || [];

    if (categoriesCache && (now - categoriesCache.timestamp < CACHE_TTL_MS)) {
      return categoriesCache.data.filter(cat => cat.id && !deletedIds.includes(cat.id));
    }

    if (categoriesCache) {
      this.refreshCategoriesBackground().catch(err => console.error('Background categories refresh error:', err));
      return categoriesCache.data.filter(cat => cat.id && !deletedIds.includes(cat.id));
    }

    const cats = await this.refreshCategoriesBackground();
    return cats.filter(cat => cat.id && !deletedIds.includes(cat.id));
  },

  async refreshCategoriesBackground(): Promise<Category[]> {
    const taskStartedAt = Date.now();
    const cats = await runMongo(
      async () => {
        const docs = await CategoryModel.find({}).lean();
        return docs.map((doc: any) => ({
          id: doc.id || doc._id?.toString() || '',
          nameAr: doc.nameAr || '',
          nameEn: doc.nameEn || ''
        })) as Category[];
      },
      async () => {
        if (!dbCache.categories) {
          dbCache.categories = [...DEFAULT_CATEGORIES];
        }
        return dbCache.categories;
      }
    );

    const deletedIds = dbCache.deletedCategoryIds || [];
    const dirtyIds = dbCache.dirtyCategoryIds || [];

    const mergedCategories: Category[] = [];
    for (const cat of cats) {
      const lastMutated = lastMutatedTimestamps.get(cat.id) || 0;
      if (lastMutated >= taskStartedAt) {
        const localCat = dbCache.categories?.find(c => c.id === cat.id);
        if (localCat && !deletedIds.includes(cat.id)) {
          mergedCategories.push(localCat);
        }
        continue;
      }

      if (deletedIds.includes(cat.id)) continue;
      if (dirtyIds.includes(cat.id)) {
        const localCat = dbCache.categories?.find(c => c.id === cat.id);
        if (localCat) {
          mergedCategories.push(localCat);
          continue;
        }
      }
      mergedCategories.push(cat);
    }
    const localDirtyOnly = (dbCache.categories || []).filter(
      localCat => dirtyIds.includes(localCat.id) && !cats.some(c => c.id === localCat.id)
    );
    for (const localCat of localDirtyOnly) {
      const lastMutated = lastMutatedTimestamps.get(localCat.id) || 0;
      if (lastMutated >= taskStartedAt || !deletedIds.includes(localCat.id)) {
        mergedCategories.push(localCat);
      }
    }

    dbCache.categories = mergedCategories;
    saveToDisk();

    categoriesCache = { data: mergedCategories, timestamp: Date.now() };
    return mergedCategories;
  },

  async createCategory(nameAr: string, nameEn: string): Promise<Category> {
    const id = 'cat_' + crypto.randomBytes(5).toString('hex');
    const newCategory: Category = { id, nameAr, nameEn };

    recordMutation(id);
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    dbCache.categories.push(newCategory);
    if (!dbCache.dirtyCategoryIds) dbCache.dirtyCategoryIds = [];
    dbCache.dirtyCategoryIds.push(id);
    saveToDisk();
    invalidateCategoriesCache();

    await runMongo(
      async () => {
        await CategoryModel.create(newCategory);
        dbCache.dirtyCategoryIds = (dbCache.dirtyCategoryIds || []).filter(x => x !== id);
        saveToDisk();
        reconcileDatabases().catch(err => console.error('Post-create category reconciliation error:', err));
      },
      async () => {}
    );

    return newCategory;
  },

  async updateCategory(id: string, nameAr: string, nameEn: string): Promise<Category> {
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    const index = dbCache.categories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new Error('القسم غير موجود');
    }
    recordMutation(id);
    dbCache.categories[index] = { id, nameAr, nameEn };
    if (!dbCache.dirtyCategoryIds) dbCache.dirtyCategoryIds = [];
    if (!dbCache.dirtyCategoryIds.includes(id)) {
      dbCache.dirtyCategoryIds.push(id);
    }
    saveToDisk();
    invalidateCategoriesCache();

    await runMongo(
      async () => {
        const result = await CategoryModel.findOneAndUpdate(
          getResilientQuery(id),
          { $set: { nameAr, nameEn } },
          { new: true, runValidators: true }
        ).lean();
        if (result) {
          dbCache.dirtyCategoryIds = (dbCache.dirtyCategoryIds || []).filter(x => x !== id);
          saveToDisk();
          reconcileDatabases().catch(err => console.error('Post-update category reconciliation error:', err));
        } else {
          console.warn(`⚠️ [updateCategory] Document with ID ${id} not found in MongoDB. Keeping dirty flag.`);
        }
      },
      async () => {}
    );

    return dbCache.categories[index];
  },

  async deleteCategory(id: string): Promise<void> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('معرف القسم غير صالح أو فارغ');
    }
    const safeId = id.trim();
    if (!dbCache.deletedCategoryIds) {
      dbCache.deletedCategoryIds = [];
    }
    if (!dbCache.deletedCategoryIds.includes(safeId)) {
      dbCache.deletedCategoryIds.push(safeId);
    }
    recordMutation(safeId);
    if (dbCache.categories) {
      dbCache.categories = dbCache.categories.filter(cat => cat.id !== safeId);
    }
    dbCache.dirtyCategoryIds = (dbCache.dirtyCategoryIds || []).filter(x => x !== safeId);
    saveToDiskSync();
    invalidateCategoriesCache();

    await runMongo(
      async () => {
        await CategoryModel.deleteMany(getResilientQuery(safeId));
        await CategoryModel.collection.deleteMany({ id: safeId });
        if (safeId && typeof safeId === 'string' && /^[0-9a-fA-F]{24}$/.test(safeId)) {
          try {
            await CategoryModel.collection.deleteMany({ _id: new mongoose.Types.ObjectId(safeId) });
          } catch (e) {}
        }
        reconcileDatabases().catch(err => console.error('Post-delete category reconciliation error:', err));
      },
      async () => {}
    );
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    const now = Date.now();
    const deletedIds = dbCache.deletedOrderIds || [];

    if (ordersCache && (now - ordersCache.timestamp < CACHE_TTL_MS)) {
      return ordersCache.data.filter(o => o.id && !deletedIds.includes(o.id));
    }

    if (ordersCache) {
      this.refreshOrdersBackground().catch(err => console.error('Background orders refresh error:', err));
      return ordersCache.data.filter(o => o.id && !deletedIds.includes(o.id));
    }

    const orders = await this.refreshOrdersBackground();
    return orders.filter(o => o.id && !deletedIds.includes(o.id));
  },

  async refreshOrdersBackground(): Promise<Order[]> {
    const taskStartedAt = Date.now();
    const orders = await runMongo(
      async () => {
        const docs = await OrderModel.find({}).sort({ createdAt: -1 }).limit(1000).lean();
        return docs.map((doc: any) => ({
          id: doc.id || doc._id?.toString() || '',
          userId: doc.userId || '',
          username: doc.username || '',
          items: doc.items || [],
          total: doc.total || 0,
          status: doc.status || 'pending',
          notes: doc.notes || '',
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updatedAt || new Date().toISOString(),
          phone: doc.phone || '',
          whatsapp: doc.whatsapp || '',
          address: doc.address || '',
          latitude: doc.latitude,
          longitude: doc.longitude
        })) as Order[];
      },
      async () => dbCache.orders.slice(0, 1000)
    );

    const deletedIds = dbCache.deletedOrderIds || [];
    const dirtyIds = dbCache.dirtyOrderIds || [];

    const mergedOrders: Order[] = [];
    for (const order of orders) {
      const lastMutated = lastMutatedTimestamps.get(order.id) || 0;
      if (lastMutated >= taskStartedAt) {
        const localOrder = dbCache.orders.find(o => o.id === order.id);
        if (localOrder && !deletedIds.includes(order.id)) {
          mergedOrders.push(localOrder);
        }
        continue;
      }

      if (deletedIds.includes(order.id)) continue;
      if (dirtyIds.includes(order.id)) {
        const localOrder = dbCache.orders.find(o => o.id === order.id);
        if (localOrder) {
          mergedOrders.push(localOrder);
          continue;
        }
      }
      mergedOrders.push(order);
    }
    const localDirtyOnly = dbCache.orders.filter(
      localOrder => dirtyIds.includes(localOrder.id) && !orders.some(o => o.id === localOrder.id)
    );
    for (const localOrder of localDirtyOnly) {
      const lastMutated = lastMutatedTimestamps.get(localOrder.id) || 0;
      if (lastMutated >= taskStartedAt || !deletedIds.includes(localOrder.id)) {
        mergedOrders.push(localOrder);
      }
    }

    mergedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    dbCache.orders = mergedOrders;
    saveToDisk();

    ordersCache = { data: mergedOrders, timestamp: Date.now() };
    return mergedOrders;
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const now = Date.now();
    const deletedIds = dbCache.deletedOrderIds || [];
    const cached = userOrdersCache.get(userId);

    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data.filter(o => o.id && !deletedIds.includes(o.id));
    }

    if (cached) {
      this.refreshUserOrdersBackground(userId).catch(err => console.error('Background user orders refresh error:', err));
      return cached.data.filter(o => o.id && !deletedIds.includes(o.id));
    }

    const orders = await this.refreshUserOrdersBackground(userId);
    return orders.filter(o => o.id && !deletedIds.includes(o.id));
  },

  async refreshUserOrdersBackground(userId: string): Promise<Order[]> {
    const taskStartedAt = Date.now();
    const orders = await runMongo(
      async () => {
        const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
        return docs.map((doc: any) => ({
          id: doc.id || doc._id?.toString() || '',
          userId: doc.userId || '',
          username: doc.username || '',
          items: doc.items || [],
          total: doc.total || 0,
          status: doc.status || 'pending',
          notes: doc.notes || '',
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updatedAt || new Date().toISOString(),
          phone: doc.phone || '',
          whatsapp: doc.whatsapp || '',
          address: doc.address || '',
          latitude: doc.latitude,
          longitude: doc.longitude
        })) as Order[];
      },
      async () => dbCache.orders.filter(o => o.userId === userId).slice(0, 100)
    );

    const deletedIds = dbCache.deletedOrderIds || [];
    const dirtyIds = dbCache.dirtyOrderIds || [];

    const mergedOrders: Order[] = [];
    for (const order of orders) {
      const lastMutated = lastMutatedTimestamps.get(order.id) || 0;
      if (lastMutated >= taskStartedAt) {
        const localOrder = dbCache.orders.find(o => o.id === order.id);
        if (localOrder && !deletedIds.includes(order.id)) {
          mergedOrders.push(localOrder);
        }
        continue;
      }

      if (deletedIds.includes(order.id)) continue;
      if (dirtyIds.includes(order.id)) {
        const localOrder = dbCache.orders.find(o => o.id === order.id);
        if (localOrder) {
          mergedOrders.push(localOrder);
          continue;
        }
      }
      mergedOrders.push(order);
    }

    const localDirtyOnly = dbCache.orders.filter(
      o => o.userId === userId && dirtyIds.includes(o.id) && !orders.some(mo => mo.id === o.id)
    );
    for (const localOrder of localDirtyOnly) {
      const lastMutated = lastMutatedTimestamps.get(localOrder.id) || 0;
      if (lastMutated >= taskStartedAt || !deletedIds.includes(localOrder.id)) {
        mergedOrders.push(localOrder);
      }
    }

    mergedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    userOrdersCache.set(userId, { data: mergedOrders, timestamp: Date.now() });
    return mergedOrders;
  },

  async createOrder(
    userId: string, 
    username: string, 
    items: CartItem[], 
    notes?: string,
    phone?: string,
    whatsapp?: string,
    address?: string,
    latitude?: number,
    longitude?: number
  ): Promise<Order> {
    if (!userId || !username || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('بيانات الطلب غير كاملة أو غير صالحة');
    }

    const currentMenu = await this.getMenu();
    const verifiedItems: CartItem[] = [];
    let total = 0;

    for (const item of items) {
      if (!item || !item.menuItem || !item.menuItem.id) {
        continue;
      }

      const dbItem = currentMenu.find(m => m.id === item.menuItem.id);
      if (!dbItem) {
        continue;
      }

      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? Math.floor(item.quantity) : 1;
      const itemPrice = dbItem.price;
      
      const extrasPrice = Array.isArray(item.extras)
        ? item.extras.reduce((sum, extra) => {
            if (extra && typeof extra.price === 'number') {
              return sum + extra.price;
            }
            return sum;
          }, 0)
        : 0;

      total += (itemPrice + extrasPrice) * quantity;

      verifiedItems.push({
        ...item,
        quantity,
        menuItem: {
          ...item.menuItem,
          price: itemPrice
        }
      });
    }

    if (verifiedItems.length === 0) {
      throw new Error('الطلب لا يحتوي على مأكولات صالحة');
    }

    const cleanUsername = typeof username === 'string' ? username.replace(/<\/?[^>]+(>|$)/g, "").trim() : 'عميل';
    const cleanNotes = typeof notes === 'string' ? notes.replace(/<\/?[^>]+(>|$)/g, "").trim() : undefined;
    const cleanPhone = typeof phone === 'string' ? phone.replace(/<\/?[^>]+(>|$)/g, "").trim() : undefined;
    const cleanWhatsapp = typeof whatsapp === 'string' ? whatsapp.replace(/<\/?[^>]+(>|$)/g, "").trim() : undefined;
    const cleanAddress = typeof address === 'string' ? address.replace(/<\/?[^>]+(>|$)/g, "").trim() : undefined;

    const newOrder: Order = {
      id: 'ORD_' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      userId,
      username: cleanUsername,
      items: verifiedItems,
      total,
      status: 'pending',
      notes: cleanNotes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phone: cleanPhone || undefined,
      whatsapp: cleanWhatsapp || undefined,
      address: cleanAddress || undefined,
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined
    };

    recordMutation(newOrder.id);
    dbCache.orders.unshift(newOrder);
    if (!dbCache.dirtyOrderIds) dbCache.dirtyOrderIds = [];
    dbCache.dirtyOrderIds.push(newOrder.id);
    const user = dbCache.users.find(u => u.id === userId);
    if (user) {
      if (cleanPhone) user.phone = cleanPhone;
      if (cleanWhatsapp) user.whatsapp = cleanWhatsapp;
      if (cleanAddress) user.address = cleanAddress;
      if (latitude !== undefined) user.latitude = latitude;
      if (longitude !== undefined) user.longitude = longitude;
    }
    saveToDiskSync();
    invalidateOrdersCache();

    await runMongo(
      async () => {
        await OrderModel.create(newOrder);
        dbCache.dirtyOrderIds = (dbCache.dirtyOrderIds || []).filter(x => x !== newOrder.id);
        await UserModel.findOneAndUpdate(
          getResilientQuery(userId),
          { 
            $set: {
              ...(cleanPhone && { phone: cleanPhone }),
              ...(cleanWhatsapp && { whatsapp: cleanWhatsapp }),
              ...(cleanAddress && { address: cleanAddress }),
              ...(latitude !== undefined && { latitude }),
              ...(longitude !== undefined && { longitude })
            }
          },
          { runValidators: true }
        );
        saveToDiskSync();
        reconcileDatabases().catch(err => console.error('Post-create order reconciliation error:', err));
      },
      async () => {}
    );

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = dbCache.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('الطلب غير موجود');
    }
    recordMutation(orderId);
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (!dbCache.dirtyOrderIds) dbCache.dirtyOrderIds = [];
    if (!dbCache.dirtyOrderIds.includes(orderId)) {
      dbCache.dirtyOrderIds.push(orderId);
    }
    saveToDiskSync();
    invalidateOrdersCache();

    await runMongo(
      async () => {
        const result = await OrderModel.findOneAndUpdate(
          getResilientQuery(orderId),
          { $set: { status, updatedAt: order.updatedAt } },
          { new: true, runValidators: true }
        ).lean();
        if (result) {
          dbCache.dirtyOrderIds = (dbCache.dirtyOrderIds || []).filter(x => x !== orderId);
          saveToDiskSync();
          reconcileDatabases().catch(err => console.error('Post-update order status reconciliation error:', err));
        } else {
          console.warn(`⚠️ [updateOrderStatus] Document with ID ${orderId} not found in MongoDB. Keeping dirty flag.`);
        }
      },
      async () => {}
    );

    return order;
  },

  async deleteOrder(orderId: string): Promise<void> {
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      throw new Error('معرف الطلب غير صالح أو فارغ');
    }
    const safeOrderId = orderId.trim();
    if (!dbCache.deletedOrderIds) {
      dbCache.deletedOrderIds = [];
    }
    if (!dbCache.deletedOrderIds.includes(safeOrderId)) {
      dbCache.deletedOrderIds.push(safeOrderId);
    }
    recordMutation(safeOrderId);
    dbCache.orders = dbCache.orders.filter(o => o.id !== safeOrderId);
    dbCache.dirtyOrderIds = (dbCache.dirtyOrderIds || []).filter(x => x !== safeOrderId);
    saveToDiskSync();
    invalidateOrdersCache();

    await runMongo(
      async () => {
        await OrderModel.deleteMany(getResilientQuery(safeOrderId));
        await OrderModel.collection.deleteMany({ id: safeOrderId });
        if (safeOrderId && typeof safeOrderId === 'string' && /^[0-9a-fA-F]{24}$/.test(safeOrderId)) {
          try {
            await OrderModel.collection.deleteMany({ _id: new mongoose.Types.ObjectId(safeOrderId) });
          } catch (e) {}
        }
        reconcileDatabases().catch(err => console.error('Post-delete order reconciliation error:', err));
      },
      async () => {}
    );
  },

  // --- SETTINGS ---
  async getSettings(): Promise<{ adminPhone: string }> {
    const now = Date.now();

    if (settingsCache && (now - settingsCache.timestamp < CACHE_TTL_MS)) {
      return settingsCache.data;
    }

    if (settingsCache) {
      this.refreshSettingsBackground().catch(err => console.error('Background settings refresh error:', err));
      return settingsCache.data;
    }

    return this.refreshSettingsBackground();
  },

  async refreshSettingsBackground(): Promise<{ adminPhone: string }> {
    const data = await runMongo(
      async () => {
        let doc = await SettingsModel.findOne({}).lean();
        if (!doc) {
          doc = await SettingsModel.create({ adminPhone: '01120751465' });
        }
        return { adminPhone: doc.adminPhone };
      },
      async () => {
        if (!dbCache.settings) {
          dbCache.settings = { adminPhone: '01120751465' };
        }
        return dbCache.settings;
      }
    );

    dbCache.settings = data;
    saveToDisk();

    settingsCache = { data, timestamp: Date.now() };
    return data;
  },

  async updateSettings(adminPhone: string): Promise<{ adminPhone: string }> {
    dbCache.settings = { adminPhone };
    saveToDisk();
    invalidateSettingsCache();

    await runMongo(
      async () => {
        await SettingsModel.findOneAndUpdate(
          {},
          { $set: { adminPhone } },
          { new: true, upsert: true, runValidators: true }
        ).lean();
      },
      async () => {}
    );

    return dbCache.settings;
  },

  async updateUserProfile(
    userId: string,
    phone: string,
    whatsapp: string,
    address: string,
    latitude?: number,
    longitude?: number
  ): Promise<User> {
    const cleanPhone = typeof phone === 'string' ? phone.replace(/<\/?[^>]+(>|$)/g, "").trim() : '';
    const cleanWhatsapp = typeof whatsapp === 'string' ? whatsapp.replace(/<\/?[^>]+(>|$)/g, "").trim() : '';
    const cleanAddress = typeof address === 'string' ? address.replace(/<\/?[^>]+(>|$)/g, "").trim() : '';

    const user = dbCache.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }
    user.phone = cleanPhone;
    user.whatsapp = cleanWhatsapp;
    user.address = cleanAddress;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    saveToDisk();

    await runMongo(
      async () => {
        await UserModel.findOneAndUpdate(
          getResilientQuery(userId),
          {
            $set: {
              phone: cleanPhone,
              whatsapp: cleanWhatsapp,
              address: cleanAddress,
              ...(latitude !== undefined && { latitude }),
              ...(longitude !== undefined && { longitude })
            }
          },
          { new: true, runValidators: true }
        ).lean();
      },
      async () => {}
    );

    return user;
  },

  async updateUserCredentials(
    userId: string,
    username: string,
    passwordHash?: string,
    privacyEnabled?: boolean
  ): Promise<User> {
    const user = dbCache.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    user.username = username;
    if (passwordHash) {
      user.passwordHash = passwordHash;
    }
    if (privacyEnabled !== undefined) {
      user.privacyEnabled = privacyEnabled;
    }

    saveToDisk();

    await runMongo(
      async () => {
        await UserModel.findOneAndUpdate(
          getResilientQuery(userId),
          {
            $set: {
              username,
              ...(passwordHash && { passwordHash }),
              ...(privacyEnabled !== undefined && { privacyEnabled })
            }
          },
          { runValidators: true }
        );
        saveToDisk();
      },
      async () => {}
    );

    return user;
  },

  async getStats(): Promise<{ totalOrders: number; totalRevenue: number; pendingOrders: number; completedOrders: number }> {
    const now = Date.now();

    if (statsCache && (now - statsCache.timestamp < STATS_CACHE_TTL_MS)) {
      return statsCache.data;
    }

    if (statsCache) {
      this.refreshStatsBackground().catch(err => console.error('Background stats refresh error:', err));
      return statsCache.data;
    }

    return this.refreshStatsBackground();
  },

  async refreshStatsBackground(): Promise<{ totalOrders: number; totalRevenue: number; pendingOrders: number; completedOrders: number }> {
    const data = await runMongo(
      async () => {
        // High-performance single-pass aggregation query to prevent loading documents into memory
        const stats = await OrderModel.aggregate([
          {
            $facet: {
              total: [{ $count: "count" }],
              delivered: [
                { $match: { status: "delivered" } },
                { $group: { _id: null, totalRevenue: { $sum: "$total" }, count: { $sum: 1 } } }
              ],
              pending: [
                { $match: { status: { $in: ["pending", "preparing"] } } },
                { $count: "count" }
              ]
            }
          }
        ]).lean();

        const totalOrders = stats[0]?.total[0]?.count || 0;
        const totalRevenue = stats[0]?.delivered[0]?.totalRevenue || 0;
        const pendingOrders = stats[0]?.pending[0]?.count || 0;
        const completedOrders = stats[0]?.delivered[0]?.count || 0;

        return {
          totalOrders,
          totalRevenue,
          pendingOrders,
          completedOrders
        };
      },
      async () => {
        const totalOrders = dbCache.orders.length;
        const totalRevenue = dbCache.orders
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + o.total, 0);
        const pendingOrders = dbCache.orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
        const completedOrders = dbCache.orders.filter(o => o.status === 'delivered').length;

        return {
          totalOrders,
          totalRevenue,
          pendingOrders,
          completedOrders
        };
      }
    );

    statsCache = { data, timestamp: Date.now() };
    return data;
  },

  async recordAdminLogin(
    adminId: string,
    username: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    status: 'success' | 'failed'
  ): Promise<void> {
    const now = new Date();
    const duplicateIntervalMs = 3000;

    // Check memory cache first to suppress instant multi-click duplicates
    const isInMemoryDuplicate = localAdminLoginLogs.some(log => {
      const logTime = new Date(log.createdAt).getTime();
      const diff = now.getTime() - logTime;
      return log.username === username &&
             log.status === status &&
             log.ipAddress === (ipAddress || 'unknown') &&
             diff < duplicateIntervalMs;
    });

    if (isInMemoryDuplicate) {
      console.log(`[Admin Login Tracker] Suppressed duplicate login log for ${username} in memory (within 3s window).`);
      return;
    }

    const logEntry = {
      id: 'log_' + crypto.randomBytes(8).toString('hex'),
      adminId,
      username,
      email: email || '',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      status,
      createdAt: now.toISOString()
    };

    // Always insert into memory cache to ensure maximum offline/hybrid availability
    localAdminLoginLogs.unshift(logEntry);
    if (localAdminLoginLogs.length > 100) {
      localAdminLoginLogs.pop();
    }

    await runMongo(
      async () => {
        // Double check in MongoDB for absolute safety
        const dbDuplicate = await AdminLoginModel.findOne({
          username,
          status,
          ipAddress: ipAddress || 'unknown',
          createdAt: { $gte: new Date(now.getTime() - duplicateIntervalMs).toISOString() }
        });
        if (dbDuplicate) {
          console.log(`[Admin Login Tracker] Suppressed duplicate login log for ${username} in MongoDB.`);
          return;
        }

        await AdminLoginModel.create(logEntry);
        console.log(`[Admin Login Tracker] Recorded login for ${username} in MongoDB.`);
      },
      async () => {
        console.log(`[Admin Login Tracker] Local fallback recorded login for ${username}.`);
      }
    );
  },

  async getAdminLoginLogs(): Promise<any[]> {
    return runMongo(
      async () => {
        const logs = await AdminLoginModel.find({}).sort({ createdAt: -1 }).limit(100).lean();
        return logs as any[];
      },
      async () => {
        return localAdminLoginLogs;
      }
    );
  },

  async ensureUserInMongo(user: User): Promise<void> {
    await runMongo(
      async () => {
        const exists = await UserModel.findOne({ id: user.id });
        if (!exists) {
          await UserModel.create(user);
          console.log(`[Sync] Synced user ${user.username} to MongoDB.`);
        }
      },
      async () => {}
    );
  },

  async getAllUsersForAdmin(): Promise<User[]> {
    return runMongo(
      async () => {
        const docs = await UserModel.find({}).lean();
        const mongoUsers = docs as unknown as User[];
        const deletedUserIds = dbCache.deletedUserIds || [];

        // Prune deleted users from dbCache
        dbCache.users = dbCache.users.filter(u => !deletedUserIds.includes(u.id));

        for (const mu of mongoUsers) {
          if (!deletedUserIds.includes(mu.id)) {
            const cacheIdx = dbCache.users.findIndex(u => u.id === mu.id);
            if (cacheIdx === -1) {
              dbCache.users.push(mu);
            } else {
              dbCache.users[cacheIdx] = { ...dbCache.users[cacheIdx], ...mu };
            }
          }
        }
        saveToDisk();
        return dbCache.users;
      },
      async () => {
        const deletedUserIds = dbCache.deletedUserIds || [];
        dbCache.users = dbCache.users.filter(u => !deletedUserIds.includes(u.id));
        return dbCache.users;
      }
    );
  },

  async deleteUserByAdmin(userId: string): Promise<void> {
    const user = dbCache.users.find(u => u.id === userId);
    if (userId === 'admin-1' || (user && user.username === 'Abu-Qura')) {
      throw new Error('لا يمكن حذف الحساب الأدمن الأصلي');
    }
    const idx = dbCache.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      dbCache.users.splice(idx, 1);
    }

    if (!dbCache.deletedUserIds) {
      dbCache.deletedUserIds = [];
    }
    if (!dbCache.deletedUserIds.includes(userId)) {
      dbCache.deletedUserIds.push(userId);
    }

    recordMutation(userId);
    saveToDiskSync(); // Guarantee immediate sync write to disk to prevent reboot loss

    await runMongo(
      async () => {
        await UserModel.deleteOne({ id: userId });
      },
      async () => {}
    );
  },

  async updateUserByAdmin(userId: string, updateData: { username?: string; passwordPlain?: string; role?: 'admin' | 'user' }): Promise<User> {
    const user = dbCache.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    if (updateData.username) {
      const trimmedName = updateData.username.trim().replace(/<\/?[^>]+(>|$)/g, "");
      if (trimmedName.length === 0) {
        throw new Error('اسم مستخدم غير صالح');
      }
      if (userId === 'admin-1' && trimmedName !== 'Abu-Qura') {
        throw new Error('لا يمكن تغيير اسم المستخدم الخاص بالحساب المسؤول الأصلي (Abu-Qura) للمحافظة على استقرار النظام والتحققات الأمنية.');
      }
      if (trimmedName !== user.username) {
        const existing = dbCache.users.find(u => u.username.toLowerCase() === trimmedName.toLowerCase() && u.id !== userId);
        if (existing) {
          throw new Error('اسم المستخدم موجود بالفعل لمستخدم آخر');
        }
        user.username = trimmedName;
      }
    }

    if (updateData.passwordPlain) {
      if (updateData.passwordPlain.length < 8) {
        throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      }
      user.passwordHash = hashPassword(updateData.passwordPlain);
    }

    if (updateData.role) {
      if (updateData.role !== 'admin' && updateData.role !== 'user') {
        throw new Error('الصلاحية المحددة غير صالحة، يجب أن تكون مسؤول (admin) أو مستخدم (user)');
      }
      if (userId === 'admin-1' && updateData.role !== 'admin') {
        throw new Error('لا يمكن تغيير صلاحيات الحساب الأدمن الأصلي');
      }
      user.role = updateData.role;
    }

    saveToDisk();

    await runMongo(
      async () => {
        await UserModel.findOneAndUpdate(
          { id: userId },
          {
            $set: {
              username: user.username,
              passwordHash: user.passwordHash,
              role: user.role
            }
          },
          { runValidators: true }
        );
      },
      async () => {}
    );

    return user;
  }
};

// Graceful shutdown flush to guarantee zero data loss of throttled in-memory mutations
const flushOnShutdown = () => {
  console.log('📡 [DatabaseService] Graceful shutdown detected. Flushing dirty in-memory cache to disk synchronously...');
  try {
    saveToDiskSync();
    console.log('✅ [DatabaseService] Synchronous flush completed successfully.');
  } catch (err: any) {
    console.error('❌ [DatabaseService] Error during synchronous flush:', err.message || err);
  }
};

process.on('SIGTERM', flushOnShutdown);
process.on('SIGINT', flushOnShutdown);
