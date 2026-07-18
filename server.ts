import 'dotenv/config';
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';
import { DatabaseService, hashPassword, comparePassword, generateToken, verifyToken } from './server-db.js';
import { OrderStatus } from './src/types.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { 
  globalLimiter, 
  loginLimiter, 
  registerLimiter, 
  orderLimiter, 
  profileLimiter, 
  menuLimiter, 
  adminLimiter,
  trackOrderLimiter,
  notFoundLimiter
} from './src/utils/rateLimiters.js';

const app = express();
const PORT = 3000;

// Enable trust proxy securely so express-rate-limit correctly identifies behind the container reverse proxy
app.set('trust proxy', 1);

// Wrap Express app with HTTP server to attach Socket.io
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.io connection and room clustering logic with JWT authorization verification
io.on('connection', (socket) => {
  // Enforce zero-trust query parsing. Do not trust client-supplied raw query values for security sensitive rooms.
  let userId = '';
  let isAdmin = false;
  const token = socket.handshake.query.token as string;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      userId = decoded.id;
      isAdmin = decoded.role === 'admin';
    } else {
      console.warn(`⚠️ [Socket.io] Invalid JWT token supplied by client: ${socket.id}. Denying secure room access.`);
    }
  } else {
    // If no token is supplied, clients are treated as anonymous visitors. 
    // They can still connect to receive public events like menu-updated, but cannot access user or admin rooms.
    console.log(`📡 [Socket.io] Anonymous visitor client connected: ID ${socket.id}`);
  }

  if (isAdmin) {
    socket.join('admin');
    console.log(`📡 [Socket.io] Admin client connected: ID ${socket.id}`);
  }

  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`📡 [Socket.io] User client connected: ID ${socket.id} (Room: user:${userId})`);
  }

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.io] Client disconnected: ID ${socket.id}`);
  });
});

app.use(express.json({ limit: '50kb' }));

// Apply our enterprise-grade global rate limiter to protect the server from general floods and DDoS
app.use(globalLimiter);


// Robust HTML tag sanitization helper to prevent XSS across the entire system
function sanitizeInput(val: any): string {
  if (typeof val !== 'string') return '';
  return val.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

// Simple in-memory storage of connected SSE clients for real-time notifications
interface SSEClient {
  id: string;
  res: any;
  userId?: string;
  isAdmin: boolean;
}

const sseClients = new Map<string, SSEClient>();

// Periodic Keep-Alive heartbeat (every 15 seconds) to prevent proxy connection drops
// and automatically clean up stale/broken sockets to prevent memory leaks under load.
setInterval(() => {
  if (sseClients.size === 0) return;
  
  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(': keep-alive\n\n');
    } catch (err) {
      console.log(`Pruning stale SSE client ${clientId} due to write error`);
      try {
        client.res.end();
      } catch (_) {}
      sseClients.delete(clientId);
    }
  }
}, 15000);

// SSE Registration Endpoint for live order updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Disable buffering for instant message delivery under load (crucial for Nginx/Cloud Run proxies)
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = 'c_' + Math.random().toString(36).substr(2, 9);
  let userId = req.query.userId as string;
  let isAdmin = req.query.isAdmin === 'true';
  const token = req.query.token as string;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      userId = decoded.id;
      isAdmin = decoded.role === 'admin';
    }
  }

  const newClient: SSEClient = {
    id: clientId,
    res,
    userId,
    isAdmin
  };

  sseClients.set(clientId, newClient);

  // Send initial keep-alive connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  const cleanUp = () => {
    sseClients.delete(clientId);
    try {
      res.end();
    } catch (_) {}
  };

  req.on('close', cleanUp);
  req.on('error', cleanUp);
});

// Helper to notify admin clients of a new order
function notifyAdminOfNewOrder(order: any) {
  for (const client of sseClients.values()) {
    if (client.isAdmin) {
      try {
        client.res.write(`event: new-order\ndata: ${JSON.stringify(order)}\n\n`);
      } catch (err) {
        console.error('Error writing to admin SSE client:', err);
      }
    }
  }
}

// Helper to notify a specific user of a status change
function notifyUserOfOrderStatus(userId: string, order: any) {
  for (const client of sseClients.values()) {
    if (client.userId === userId) {
      try {
        client.res.write(`event: order-status-updated\ndata: ${JSON.stringify(order)}\n\n`);
      } catch (err) {
        console.error('Error writing to user SSE client:', err);
      }
    }
  }
}

// Professional real-time Socket.io & SSE broadcast engines
function broadcastNewOrder(order: any) {
  // 1. Fallback SSE
  notifyAdminOfNewOrder(order);
  
  // 2. Performance-grade Socket.io
  io.to('admin').emit('new-order', order);
  io.to(`user:${order.userId}`).emit('order-status-updated', order);
}

function broadcastOrderStatusUpdate(userId: string, order: any) {
  // 1. Fallback SSE
  notifyUserOfOrderStatus(userId, order);
  
  // 2. Performance-grade Socket.io (To user & admin for immediate sync across views)
  io.to(`user:${userId}`).emit('order-status-updated', order);
  io.to('admin').emit('order-status-updated', order);
}

function broadcastMenuUpdate() {
  io.emit('menu-updated');
}

function broadcastCategoriesUpdate() {
  io.emit('categories-updated');
}

function broadcastSettingsUpdate(settings: any) {
  io.emit('settings-updated', settings);
}

function broadcastOrderDeletion(orderId: string) {
  io.to('admin').emit('order-deleted', orderId);
  io.emit('order-deleted', orderId);
}

// --- SECURITY & AUTHORIZATION MIDDLEWARES WITH SECURE JWT ---

// Middleware to require standard authenticated user context via secure JWT access tokens
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  // 1. Resolve token from standard Authorization header or fallback options
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Check fallback headers/params to maintain smooth client compatibility
    token = (req.headers['x-user-id'] || req.query.token || req.body.token || '') as string;
  }

  if (!token || token.trim() === '') {
    return res.status(401).json({ error: 'غير مصرح: رمز التحقق مطلوب (Unauthorized: Verification token required)' });
  }

  // 2. Verify token signature and expiration
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'غير مصرح: رمز التحقق منتهي الصلاحية أو غير صالح (Unauthorized: Invalid or expired token)' });
  }

  try {
    const user = await DatabaseService.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'غير مصرح: الحساب المرتبط بالرمز غير موجود (Unauthorized: Account not found)' });
    }
    // Attach verified user context to request
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error('requireAuth middleware error:', err);
    res.status(500).json({ error: 'خطأ داخلي في الخادم أثناء التحقق من الهوية' });
  }
}

// Middleware to require admin permissions via secure JWT verification
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = (req.headers['x-user-id'] || req.query.token || req.body.token || '') as string;
  }

  if (!token || token.trim() === '') {
    return res.status(401).json({ error: 'غير مصرح: رمز التحقق مطلوب (Unauthorized: Verification token required)' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'غير مصرح: رمز التحقق غير صالح أو منتهي (Unauthorized: Invalid or expired token)' });
  }

  try {
    const user = await DatabaseService.findUserById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح: هذه العملية تتطلب صلاحيات المدير (Forbidden: Admin privileges required)' });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error('requireAdmin middleware error:', err);
    res.status(500).json({ error: 'خطأ داخلي في الخادم أثناء التحقق من الصلاحيات' });
  }
}

// Middleware to require Super Admin privileges via secure JWT verification
async function requireSuperAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = (req.headers['x-user-id'] || req.query.token || req.body.token || '') as string;
  }

  if (!token || token.trim() === '') {
    return res.status(401).json({ error: 'غير مصرح: رمز التحقق مطلوب (Unauthorized: Verification token required)' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'غير مصرح: رمز التحقق غير صالح أو منتهي (Unauthorized: Invalid or expired token)' });
  }

  try {
    const user = await DatabaseService.findUserById(decoded.id);
    if (!user || (!user.isSuperAdmin && user.id !== 'admin-1')) {
      return res.status(403).json({ error: 'غير مصرح: هذه العملية تتطلب صلاحيات المدير الأصلي (المالك) (Forbidden: Owner privileges required)' });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error('requireSuperAdmin middleware error:', err);
    res.status(500).json({ error: 'خطأ داخلي في الخادم أثناء التحقق من الهوية والصلاحيات' });
  }
}

// --- API ENDPOINTS ---

// 1. Authentication
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, username, password, isAdminLogin } = req.body;

    if (isAdminLogin) {
      const rawEmail = typeof email === 'string' ? email : '';
      const rawUsername = typeof username === 'string' ? username : '';
      const loginIdentifier = (rawEmail || rawUsername).trim();
      if (!loginIdentifier || typeof password !== 'string') {
        return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور مطلوبة لتسجيل دخول الإدارة' });
      }

      // Look up admin by username or email
      let adminUser = await DatabaseService.findUserByName(loginIdentifier);
      if (!adminUser && loginIdentifier.toLowerCase() === 'admin@abuqura.com') {
        adminUser = await DatabaseService.findUserByEmail(loginIdentifier);
      }

      // Fallback: if no admin exists at all, auto-recreate the initial one
      if (!adminUser && (loginIdentifier === 'Abu-Qura' || loginIdentifier.toLowerCase() === 'admin@abuqura.com')) {
        let existingAdminCheck = await DatabaseService.findUserByName('Abu-Qura');
        if (!existingAdminCheck) {
          console.log('⚠️ Admin user not found. Auto-recreating default admin...');
          adminUser = await DatabaseService.createUser('Abu-Qura', undefined, undefined, true);
        } else {
          adminUser = existingAdminCheck;
        }
      }

      if (adminUser && adminUser.role === 'admin') {
        // If privacy is active/enabled for the admin, block any new login attempts
        if (adminUser.privacyEnabled) {
          await DatabaseService.recordAdminLogin(
            adminUser.id,
            adminUser.username,
            adminUser.email || '',
            req.ip || 'unknown',
            (req.headers['user-agent'] as string) || 'unknown',
            'failed'
          );
          return res.status(403).json({ 
            error: 'لا يمكنك تسجيل الدخول كمسؤول حالياً لأن وضع الخصوصية مفعل والحساب مؤمن تماماً ضد الدخول الجديد.' 
          });
        }

        if (comparePassword(password, adminUser.passwordHash)) {
          // Dynamic migration of legacy PBKDF2 hashes to high-performance bcrypt hashes
          let migratedAdmin = adminUser;
          if (!adminUser.passwordHash.startsWith('$2')) {
            const secureHash = hashPassword(password);
            migratedAdmin = await DatabaseService.updateUserCredentials(adminUser.id, adminUser.username, secureHash);
          }

          // Ensure admin user exists in MongoDB users collection!
          await DatabaseService.ensureUserInMongo(migratedAdmin);

          // Record successful login in MongoDB admin_log_ins!
          await DatabaseService.recordAdminLogin(
            migratedAdmin.id,
            migratedAdmin.username,
            migratedAdmin.email || '',
            req.ip || 'unknown',
            (req.headers['user-agent'] as string) || 'unknown',
            'success'
          );

          // Issue standard JWT access token for admin
          const token = generateToken(migratedAdmin);
          return res.json({ success: true, user: { ...migratedAdmin, token } });
        } else {
          await DatabaseService.recordAdminLogin(
            adminUser.id,
            adminUser.username,
            adminUser.email || '',
            req.ip || 'unknown',
            (req.headers['user-agent'] as string) || 'unknown',
            'failed'
          );
        }
      } else {
        if (loginIdentifier) {
          await DatabaseService.recordAdminLogin(
            'unknown',
            loginIdentifier,
            '',
            req.ip || 'unknown',
            (req.headers['user-agent'] as string) || 'unknown',
            'failed'
          );
        }
      }

      return res.status(401).json({ error: 'اسم مستخدم أو كلمة مرور المدير غير صحيحة' });
    } else {
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!cleanEmail || typeof password !== 'string') {
        return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
      }

      const user = await DatabaseService.findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ error: 'عذراً، هذا البريد الإلكتروني غير مسجل لدينا. يرجى إنشاء حساب جديد.' });
      }

      if (comparePassword(password, user.passwordHash)) {
        // Dynamic migration of legacy PBKDF2 hashes to high-performance bcrypt hashes
        let migratedUser = user;
        if (!user.passwordHash.startsWith('$2')) {
          const secureHash = hashPassword(password);
          migratedUser = await DatabaseService.updateUserCredentials(user.id, user.username, secureHash);
        }

        // Issue standard JWT access token for user
        const token = generateToken(migratedUser);
        return res.json({ success: true, user: { ...migratedUser, token } });
      } else {
        return res.status(401).json({ error: 'كلمة المرور التي أدخلتها غير صحيحة، يرجى المحاولة مرة أخرى.' });
      }
    }
  } catch (err: any) {
    console.error('Login endpoint error:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة لإنشاء حساب جديد' });
    }

    const cleanUsername = sanitizeInput(username);
    if (cleanUsername.length === 0) {
      return res.status(400).json({ error: 'اسم المستخدم المدخل غير صالح' });
    }

    if (cleanUsername.toLowerCase() === 'abu-qura' || cleanUsername.toLowerCase() === 'admin') {
      return res.status(403).json({ error: 'غير مسموح باستخدام هذا الاسم لتسجيل حساب العميل' });
    }

    const newUser = await DatabaseService.createUser(cleanUsername, email, password);
    
    // Issue standard JWT access token upon successful registration
    const token = generateToken(newUser);
    return res.json({ success: true, user: { ...newUser, token } });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

// Endpoint to fetch admin privacy status for frontend guard
app.get('/api/auth/admin-privacy-status', async (req, res) => {
  try {
    const admin = await DatabaseService.findUserByName('Abu-Qura');
    res.json({ privacyEnabled: admin ? !!admin.privacyEnabled : false });
  } catch (err) {
    res.json({ privacyEnabled: false });
  }
});

// 2. Fetch Menu Items & Menu management
app.get('/api/menu', menuLimiter, async (req, res) => {
  try {
    const menu = await DatabaseService.getMenu();
    res.json(menu);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب المنيو' });
  }
});

app.post('/api/menu', adminLimiter, requireAdmin, async (req, res) => {
  try {
    const { nameAr, nameEn, descriptionAr, descriptionEn, price, image, category, available } = req.body;
    const cleanNameAr = sanitizeInput(nameAr);
    const cleanCategory = sanitizeInput(category);
    
    if (!cleanNameAr || price === undefined || !cleanCategory) {
      return res.status(400).json({ error: 'الاسم بالعربية والسعر والجروب مطلوبين وصالحين' });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'السعر يجب أن يكون رقماً موجباً' });
    }

    const newItem = await DatabaseService.createMenuItem({
      nameAr: cleanNameAr,
      nameEn: sanitizeInput(nameEn || nameAr),
      descriptionAr: sanitizeInput(descriptionAr || ''),
      descriptionEn: sanitizeInput(descriptionEn || ''),
      price: numPrice,
      image: sanitizeInput(image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'),
      category: cleanCategory,
      available: available !== undefined ? Boolean(available) : true
    });
    broadcastMenuUpdate();
    res.json({ success: true, item: newItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', adminLimiter, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn, descriptionAr, descriptionEn, price, image, category, available } = req.body;
    
    if (nameAr !== undefined && sanitizeInput(nameAr) === '') {
      return res.status(400).json({ error: 'الاسم بالعربية غير صالح أو فارغ' });
    }
    if (category !== undefined && sanitizeInput(category) === '') {
      return res.status(400).json({ error: 'الجروب غير صالح أو فارغ' });
    }

    let validatedPrice: number | undefined = undefined;
    if (price !== undefined) {
      validatedPrice = Number(price);
      if (isNaN(validatedPrice) || validatedPrice <= 0) {
        return res.status(400).json({ error: 'السعر يجب أن يكون رقماً موجباً' });
      }
    }

    const updated = await DatabaseService.updateMenuItem(id, {
      nameAr: nameAr !== undefined ? sanitizeInput(nameAr) : undefined,
      nameEn: nameEn !== undefined ? sanitizeInput(nameEn) : undefined,
      descriptionAr: descriptionAr !== undefined ? sanitizeInput(descriptionAr) : undefined,
      descriptionEn: descriptionEn !== undefined ? sanitizeInput(descriptionEn) : undefined,
      price: validatedPrice,
      image: image !== undefined ? sanitizeInput(image) : undefined,
      category: category !== undefined ? sanitizeInput(category) : undefined,
      available: available !== undefined ? Boolean(available) : undefined
    });
    broadcastMenuUpdate();
    res.json({ success: true, item: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', adminLimiter, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteMenuItem(id);
    broadcastMenuUpdate();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Categories Endpoints
app.get('/api/categories', menuLimiter, async (req, res) => {
  try {
    const cats = await DatabaseService.getCategories();
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', adminLimiter, requireAdmin, async (req, res) => {
  try {
    const { nameAr, nameEn } = req.body;
    if (!nameAr || !nameEn) {
      return res.status(400).json({ error: 'الاسم بالعربية والإنجليزية مطلوبين' });
    }
    const cleanAr = sanitizeInput(nameAr);
    const cleanEn = sanitizeInput(nameEn);
    if (!cleanAr || !cleanEn) {
      return res.status(400).json({ error: 'الاسم بالعربية والإنجليزية مطلوبين وصالحين' });
    }
    const newCat = await DatabaseService.createCategory(cleanAr, cleanEn);
    broadcastCategoriesUpdate();
    res.json({ success: true, category: newCat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', adminLimiter, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn } = req.body;
    if (!nameAr || !nameEn) {
      return res.status(400).json({ error: 'الاسم بالعربية والإنجليزية مطلوبين' });
    }
    const cleanAr = sanitizeInput(nameAr);
    const cleanEn = sanitizeInput(nameEn);
    if (!cleanAr || !cleanEn) {
      return res.status(400).json({ error: 'الاسم بالعربية والإنجليزية مطلوبين وصالحين' });
    }
    const updatedCat = await DatabaseService.updateCategory(id, cleanAr, cleanEn);
    broadcastCategoriesUpdate();
    res.json({ success: true, category: updatedCat });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', adminLimiter, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteCategory(id);
    broadcastCategoriesUpdate();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Fetch Orders (For Admin or specific User)
app.get('/api/orders', trackOrderLimiter, requireAuth, async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;
    const requestingUser = (req as any).user;

    if (isAdmin === 'true') {
      if (requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'غير مصرح: صلاحيات المدير مطلوبة' });
      }
      const orders = await DatabaseService.getOrders();
      return res.json(orders);
    }

    if (userId) {
      if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
        return res.status(403).json({ error: 'غير مصرح: لا يمكنك جلب طلبات مستخدم آخر' });
      }
      const orders = await DatabaseService.getUserOrders(userId as string);
      return res.json(orders);
    }

    res.status(400).json({ error: 'معلمات طلب غير صحيحة' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب الطلبات' });
  }
});

// 4. Create New Order
app.post('/api/orders', orderLimiter, requireAuth, async (req, res) => {
  const { userId, username, items, notes, phone, whatsapp, address, latitude, longitude } = req.body;
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
    return res.status(403).json({ error: 'غير مصرح: لا يمكنك إنشاء طلب باسم مستخدم آخر' });
  }

  if (!userId || !username || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'بيانات الطلب غير مكتملة' });
  }

  try {
    const newOrder = await DatabaseService.createOrder(
      userId, 
      username, 
      items, 
      notes,
      phone,
      whatsapp,
      address,
      latitude,
      longitude
    );
    
    // Broadcast to Admin & User clients instantly via Socket.io & SSE
    broadcastNewOrder(newOrder);

    res.json({ success: true, order: newOrder });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تسجيل الطلب' });
  }
});

// 5. Update Order Status (Admin Only)
app.patch('/api/orders/:id/status', adminLimiter, requireAdmin, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'الحالة مطلوبة' });
  }

  try {
    const updatedOrder = await DatabaseService.updateOrderStatus(orderId, status as OrderStatus);

    // Notify the user who placed this order and admins via Socket.io & SSE
    broadcastOrderStatusUpdate(updatedOrder.userId, updatedOrder);

    res.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'الطلب غير موجود' });
  }
});

// Delete Order (Admin Only)
app.delete('/api/orders/:id', adminLimiter, requireAdmin, async (req, res) => {
  const orderId = req.params.id;
  try {
    await DatabaseService.deleteOrder(orderId);
    broadcastOrderDeletion(orderId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء حذف الطلب' });
  }
});

// Helper wrapper to handle Express routing compatibility safely
function patchRoute(routePath: string, handler: express.RequestHandler) {
  app.patch(routePath, handler);
}

// 6. Fetch Dashboard Stats (Admin Only)
app.get('/api/stats', adminLimiter, requireAdmin, async (req, res) => {
  try {
    const stats = await DatabaseService.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب الإحصائيات' });
  }
});

// 7. Get General Restaurant Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await DatabaseService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب الإعدادات' });
  }
});

// 8. Update General Restaurant Settings (Admin Only)
app.post('/api/settings', adminLimiter, requireAdmin, async (req, res) => {
  const { adminPhone } = req.body;
  if (!adminPhone || adminPhone.trim() === '') {
    return res.status(400).json({ error: 'رقم هاتف المدير مطلوب' });
  }
  try {
    const settings = await DatabaseService.updateSettings(adminPhone.trim());
    broadcastSettingsUpdate(settings);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تحديث الإعدادات' });
  }
});

// 9. Update User Profile Defaults
app.post('/api/user/profile', profileLimiter, requireAuth, async (req, res) => {
  const { userId, phone, whatsapp, address, latitude, longitude } = req.body;
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
    return res.status(403).json({ error: 'غير مصرح: لا يمكنك تحديث بيانات حساب آخر' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
  }
  try {
    const updatedUser = await DatabaseService.updateUserProfile(userId, phone, whatsapp, address, latitude, longitude);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تحديث بيانات الحساب' });
  }
});

// 10. Update User Credentials (Username, Password, Privacy setting)
app.post('/api/user/credentials', profileLimiter, requireAuth, async (req, res) => {
  const { userId, newUsername, currentPassword, newPassword, privacyEnabled } = req.body;
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
    return res.status(403).json({ error: 'غير مصرح: لا يمكنك تحديث بيانات حساب آخر' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
  }

  try {
    const user = await DatabaseService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // Strict Owner/SuperAdmin enforcement:
    // Only the Original/Super Admin (id: 'admin-1' or isSuperAdmin: true) is allowed to modify credentials of ANY admin account (role === 'admin').
    // Secondary/sub-admins are strictly forbidden from altering administrative credentials (their own or others).
    const isTargetAdmin = user.role === 'admin' || user.id === 'admin-1' || user.isSuperAdmin;
    const isRequesterSuperAdmin = requestingUser.isSuperAdmin || requestingUser.id === 'admin-1';

    if (isTargetAdmin && !isRequesterSuperAdmin) {
      return res.status(403).json({ error: 'غير مصرح: وحدها الإدارة العليا (المدير الأصلي) تمتلك الصلاحية لتغيير اسم المستخدم أو كلمة مرور حسابات الإدارة.' });
    }

    // Check current password if changing username or password (bypass for Super Admin)
    const isSuperAdminEditing = requestingUser && (requestingUser.isSuperAdmin || requestingUser.id === 'admin-1');
    if ((newUsername || newPassword) && !isSuperAdminEditing) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'يجب إدخال كلمة المرور الحالية لتحديث اسم المستخدم أو كلمة المرور' });
      }
      if (!comparePassword(currentPassword, user.passwordHash)) {
        return res.status(401).json({ error: 'كلمة المرور الحالية التي أدخلتها غير صحيحة' });
      }
    }

    // Process username update
    let updatedUsername = user.username;
    if (newUsername && newUsername.trim() !== user.username) {
      const cleanUsername = sanitizeInput(newUsername);
      if (cleanUsername.length === 0) {
        return res.status(400).json({ error: 'اسم المستخدم المدخل غير صالح' });
      }
      if (cleanUsername.length > 30) {
        return res.status(400).json({ error: 'اسم المستخدم طويل جداً (الحد الأقصى 30 حرف)' });
      }
      // Enterprise-grade Similarity & Spoofing check:
      const normalizedInput = cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedAdmin = 'abuqura';
      if (normalizedInput === normalizedAdmin || normalizedInput === 'admin' || normalizedInput === 'administrator') {
        return res.status(403).json({ error: 'غير مسموح بإنشاء حساب باسم مستخدم يشابه اسم المسؤول لتجنب أي تداخل أو انتحال شخصية.' });
      }
      // Check duplicate
      const existingUser = await DatabaseService.findUserByName(cleanUsername);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل لمستخدم آخر' });
      }
      updatedUsername = cleanUsername;
    }

    // Process password update with robust strength rules (Eastern & Western safe)
    let updatedPasswordHash = user.passwordHash;
    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)' });
      }
      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تحتوي على حرف صغير واحد على الأقل (a-z)' });
      }
      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تحتوي على رقم واحد على الأقل (0-9)' });
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تحتوي على رمز خاص واحد على الأقل مثل (!@#$%^&*)' });
      }
      updatedPasswordHash = hashPassword(newPassword);
    }

    // Update the user in database
    const updatedUser = await DatabaseService.updateUserCredentials(
      userId,
      updatedUsername,
      updatedPasswordHash,
      privacyEnabled !== undefined ? Boolean(privacyEnabled) : undefined
    );

    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('Credentials update error:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تحديث بيانات الحساب' });
  }
});

// 11. Super Admin Accounts Management (Owner Only)
app.get('/api/admin/login-logs', requireSuperAdmin, async (req, res) => {
  try {
    const logs = await DatabaseService.getAdminLoginLogs();
    res.json(logs);
  } catch (err: any) {
    console.error('SuperAdmin get login logs error:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب سجلات تسجيل الدخول' });
  }
});

app.get('/api/admin/users', requireSuperAdmin, async (req, res) => {
  try {
    const users = await DatabaseService.getAllUsersForAdmin();
    res.json(users);
  } catch (err: any) {
    console.error('SuperAdmin get users error:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب قائمة الحسابات' });
  }
});

app.post('/api/admin/users', requireSuperAdmin, async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة لإنشاء حساب' });
  }
  try {
    const newUser = await DatabaseService.createUser(username.trim(), email.trim(), password);
    if (role === 'admin') {
      await DatabaseService.updateUserByAdmin(newUser.id, { role: 'admin' });
      newUser.role = 'admin';
    }
    res.status(201).json({ success: true, user: newUser });
  } catch (err: any) {
    console.error('SuperAdmin create user error:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

app.put('/api/admin/users/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  try {
    const updated = await DatabaseService.updateUserByAdmin(id, {
      username: username ? username.trim() : undefined,
      passwordPlain: password ? password : undefined,
      role: role
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('SuperAdmin update user error:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تحديث بيانات الحساب' });
  }
});

app.delete('/api/admin/users/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await DatabaseService.deleteUserByAdmin(id);
    res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } catch (err: any) {
    console.error('SuperAdmin delete user error:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء حذف الحساب' });
  }
});

// Catch-all route for any undefined API endpoints to prevent 404 Flooding & route scanning
app.all('/api/*', notFoundLimiter, (req, res) => {
  res.status(404).json({
    success: false,
    message: 'خطأ 404: الرابط المطلوب غير موجود داخل واجهة برمجة التطبيقات (404 Not Found: API endpoint does not exist)'
  });
});

// Vite middleware integration for Hot Reloads in Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Abu Qura Server running on http://localhost:${PORT}`);
  });
}

startServer();

// --- GRACEFUL SHUTDOWN SEQUENCING ---
function handleGracefulShutdown(signal: string) {
  console.log(`📡 [Shutdown] Received ${signal}. Initializing enterprise graceful shutdown...`);

  // 1. Force close active SSE client stream connections
  console.log(`🔌 [Shutdown] Closing ${sseClients.size} active SSE stream connections...`);
  for (const client of sseClients.values()) {
    try {
      client.res.write('event: shutdown\ndata: {"message":"Server is shutting down"}\n\n');
      client.res.end();
    } catch (_) {}
  }
  sseClients.clear();

  // 2. Stop accepting new HTTP requests and terminate active connections via httpServer
  httpServer.close(() => {
    console.log('✅ [Shutdown] HTTP & Socket.io server closed.');

    // 3. Disconnect from MongoDB securely
    if (mongoose.connection.readyState === 1) {
      console.log('🔌 [Shutdown] Closing MongoDB connection pool...');
      mongoose.disconnect()
        .then(() => {
          console.log('✅ [Shutdown] MongoDB connection closed safely.');
          process.exit(0);
        })
        .catch((err) => {
          console.error('❌ [Shutdown] Error during MongoDB disconnection:', err);
          process.exit(1);
        });
    } else {
      process.exit(0);
    }
  });

  // Force shutdown as safety barrier after 10s if graceful steps get stuck
  setTimeout(() => {
    console.error('⚠️ [Shutdown] Graceful shutdown sequence exceeded limit (10s). Forcing termination.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
