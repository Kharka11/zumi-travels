require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB_FILE    = path.join(__dirname, 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'zumi-travels-secret-change-in-production';

// Stripe (optional — only active when key is provided)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('REPLACE')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Package prices in USD cents (authoritative server-side copy)
const PACKAGE_PRICES = {
  'Bhutan Highlights (5 Days)':        185000,
  'Western Bhutan Explorer (8 Days)':  295000,
  'Bhutan Grand Circuit (12 Days)':    440000,
  'Luxury Bhutan Escape (10 Days)':    620000,
};

// ══════════════════════════════════════════════════
//  JSON file DB
// ══════════════════════════════════════════════════
function readDB() {
  let data = { admins: [], bookings: [], inquiries: [], subscribers: [], nextId: 1 };
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    data = { ...data, ...raw };
    if (!Array.isArray(data.admins))      data.admins      = [];
    if (!Array.isArray(data.bookings))    data.bookings    = [];
    if (!Array.isArray(data.inquiries))   data.inquiries   = [];
    if (!Array.isArray(data.subscribers)) data.subscribers = [];
    if (!data.nextId) data.nextId = 1;
  } catch {}
  return data;
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ══════════════════════════════════════════════════
//  Seed default admin
// ══════════════════════════════════════════════════
function seedAdmin() {
  const db = readDB();
  if (db.admins.length === 0) {
    db.admins.push({
      id: db.nextId++,
      name: 'Admin',
      email: 'admin@zumitravels.bt',
      password: bcrypt.hashSync('Admin@123', 10),
      created_at: new Date().toISOString()
    });
    writeDB(db);
    console.log('\n  ✅ Default admin created');
    console.log('  Email:    admin@zumitravels.bt');
    console.log('  Password: Admin@123');
    console.log('  ⚠️  Change this password after first login!\n');
  }
}

// ══════════════════════════════════════════════════
//  Email helper
// ══════════════════════════════════════════════════
function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER.includes('your@gmail')) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

async function sendNotification(subject, html) {
  const transporter = createTransporter();
  if (!transporter || !process.env.NOTIFY_EMAIL) return;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.NOTIFY_EMAIL,
      subject, html
    });
  } catch (err) { console.error('Email error:', err.message); }
}

// ══════════════════════════════════════════════════
//  Middleware
// ══════════════════════════════════════════════════
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.admin = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ══════════════════════════════════════════════════
//  Auth routes
// ══════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const db = readDB();
  const admin = db.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!admin || !(await bcrypt.compare(password, admin.password)))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name },
    JWT_SECRET, { expiresIn: '8h' }
  );
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => res.json(req.admin));

// ══════════════════════════════════════════════════
//  Config
// ══════════════════════════════════════════════════
app.get('/api/config', (req, res) => {
  res.json({
    stripeEnabled: !!stripe,
    stripePublishableKey: stripe ? process.env.STRIPE_PUBLISHABLE_KEY : null,
    whatsappNumber: process.env.WHATSAPP_NUMBER || null
  });
});

// ══════════════════════════════════════════════════
//  Admin stats
// ══════════════════════════════════════════════════
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  const db = readDB();
  const paidBookings = db.bookings.filter(b => b.payment_status === 'paid');
  const totalRevenue = paidBookings.reduce((s, b) => s + (b.total_amount || 0), 0);
  res.json({
    totalBookings:     db.bookings.length,
    pendingBookings:   db.bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: db.bookings.filter(b => b.status === 'confirmed').length,
    cancelledBookings: db.bookings.filter(b => b.status === 'cancelled').length,
    totalInquiries:    db.inquiries.length,
    unreadInquiries:   db.inquiries.filter(i => !i.read).length,
    totalSubscribers:  db.subscribers.length,
    totalRevenue
  });
});

// ══════════════════════════════════════════════════
//  Admin — Bookings
// ══════════════════════════════════════════════════
app.get('/api/admin/bookings', authMiddleware, (req, res) => {
  res.json(readDB().bookings.slice().reverse());
});

app.patch('/api/admin/bookings/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  ['status', 'notes'].forEach(k => {
    if (req.body[k] !== undefined) db.bookings[idx][k] = req.body[k];
  });
  db.bookings[idx].updated_at = new Date().toISOString();
  writeDB(db);
  res.json(db.bookings[idx]);
});

app.delete('/api/admin/bookings/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  db.bookings.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════
//  Admin — Inquiries
// ══════════════════════════════════════════════════
app.get('/api/admin/inquiries', authMiddleware, (req, res) => {
  res.json(readDB().inquiries.slice().reverse());
});

app.patch('/api/admin/inquiries/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.inquiries.findIndex(i => i.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Inquiry not found' });
  ['read', 'notes'].forEach(k => {
    if (req.body[k] !== undefined) db.inquiries[idx][k] = req.body[k];
  });
  db.inquiries[idx].updated_at = new Date().toISOString();
  writeDB(db);
  res.json(db.inquiries[idx]);
});

app.delete('/api/admin/inquiries/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.inquiries.findIndex(i => i.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Inquiry not found' });
  db.inquiries.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/inquiries/:id/reply', authMiddleware, async (req, res) => {
  const { subject, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const db = readDB();
  const idx = db.inquiries.findIndex(i => i.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Inquiry not found' });

  const inquiry = db.inquiries[idx];
  const replySubject = subject || `Re: ${inquiry.subject || 'Your enquiry | ZUMI Travels'}`;

  let emailSent = false;
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: inquiry.email,
        subject: replySubject,
        html: `<p>Dear ${inquiry.name},</p><p>${message.replace(/\n/g, '<br>')}</p><p style="margin-top:2rem">Warm regards,<br><strong>ZUMI Travels</strong><br>Kingdom of Bhutan</p>`
      });
      emailSent = true;
    } catch (err) { console.error('Reply email error:', err.message); }
  }

  db.inquiries[idx].replied_at      = new Date().toISOString();
  db.inquiries[idx].reply_subject   = replySubject;
  db.inquiries[idx].reply_text      = message;
  db.inquiries[idx].read            = true;
  db.inquiries[idx].updated_at      = new Date().toISOString();
  writeDB(db);

  res.json({ ...db.inquiries[idx], emailSent });
});

// ══════════════════════════════════════════════════
//  Admin — Admin accounts
// ══════════════════════════════════════════════════
app.get('/api/admin/admins', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.admins.map(({ password, ...rest }) => rest));
});

app.post('/api/admin/admins', authMiddleware, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password required' });

  const db = readDB();
  if (db.admins.find(a => a.email.toLowerCase() === email.toLowerCase()))
    return res.status(400).json({ error: 'Email already exists' });

  const admin = {
    id: db.nextId++, name, email,
    password: await bcrypt.hash(password, 10),
    created_at: new Date().toISOString()
  };
  db.admins.push(admin);
  writeDB(db);
  const { password: _, ...safe } = admin;
  res.status(201).json(safe);
});

app.patch('/api/admin/admins/:id', authMiddleware, async (req, res) => {
  const db = readDB();
  const idx = db.admins.findIndex(a => a.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Admin not found' });

  if (req.body.name)     db.admins[idx].name = req.body.name;
  if (req.body.password) db.admins[idx].password = await bcrypt.hash(req.body.password, 10);
  writeDB(db);
  const { password: _, ...safe } = db.admins[idx];
  res.json(safe);
});

app.delete('/api/admin/admins/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.admins.findIndex(a => a.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Admin not found' });
  if (db.admins[idx].id === req.admin.id)
    return res.status(400).json({ error: 'Cannot delete your own account' });
  if (db.admins.length === 1)
    return res.status(400).json({ error: 'Cannot delete the last admin account' });
  db.admins.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both fields required' });

  const db = readDB();
  const idx = db.admins.findIndex(a => a.id === req.admin.id);
  if (idx === -1) return res.status(404).json({ error: 'Admin not found' });
  if (!(await bcrypt.compare(currentPassword, db.admins[idx].password)))
    return res.status(400).json({ error: 'Current password is incorrect' });

  db.admins[idx].password = await bcrypt.hash(newPassword, 10);
  writeDB(db);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════
//  Payment — Stripe
// ══════════════════════════════════════════════════
app.post('/api/payment/create-intent', async (req, res) => {
  if (!stripe)
    return res.status(503).json({ error: 'Payments not configured. Add your Stripe keys to .env' });

  const { package_name, num_travelers, name, email, phone, travel_date, message } = req.body;
  const pricePerPerson = PACKAGE_PRICES[package_name];
  if (!pricePerPerson) return res.status(400).json({ error: 'Invalid package name' });

  const travelers  = Math.max(1, parseInt(num_travelers) || 1);
  const totalCents = pricePerPerson * travelers;

  try {
    const db = readDB();
    const booking = {
      id: db.nextId++, name, email,
      phone: phone || null, package_name, travel_date,
      num_travelers: travelers,
      message: message || null,
      status: 'pending',
      payment_status: 'awaiting_payment',
      total_amount: totalCents / 100,
      created_at: new Date().toISOString()
    };
    db.bookings.push(booking);
    writeDB(db);

    const intent = await stripe.paymentIntents.create({
      amount: totalCents, currency: 'usd',
      metadata: { booking_id: String(booking.id), package_name, email }
    });

    res.json({ clientSecret: intent.client_secret, bookingId: booking.id, totalAmount: totalCents / 100 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payment/confirm', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured' });
  const { bookingId, paymentIntentId } = req.body;
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded')
      return res.status(400).json({ error: 'Payment not completed yet' });

    const db  = readDB();
    const idx = db.bookings.findIndex(b => b.id === +bookingId);
    if (idx !== -1) {
      db.bookings[idx].payment_status    = 'paid';
      db.bookings[idx].payment_intent_id = paymentIntentId;
      db.bookings[idx].status            = 'confirmed';
      db.bookings[idx].updated_at        = new Date().toISOString();
      writeDB(db);
      const b = db.bookings[idx];
      await sendNotification(
        `💰 Payment Received — ${b.package_name}`,
        `<h2>New Paid Booking!</h2>
         <p><b>Guest:</b> ${b.name} (${b.email})</p>
         <p><b>Package:</b> ${b.package_name}</p>
         <p><b>Travelers:</b> ${b.num_travelers}</p>
         <p><b>Travel Date:</b> ${b.travel_date}</p>
         <p><b>Amount Paid:</b> $${b.total_amount.toLocaleString()}</p>`
      );
    }
    res.json({ success: true, message: 'Booking confirmed and payment received!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════
//  Public — Booking (without payment)
// ══════════════════════════════════════════════════
app.post('/api/bookings', async (req, res) => {
  const { name, email, phone, package_name, travel_date, num_travelers, message } = req.body;
  if (!name || !email || !package_name || !travel_date || !num_travelers)
    return res.status(400).json({ error: 'Please fill in all required fields.' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Please enter a valid email address.' });

  const travelers      = parseInt(num_travelers);
  const pricePerPerson = PACKAGE_PRICES[package_name] || 0;

  const db = readDB();
  const booking = {
    id: db.nextId++, name, email,
    phone: phone || null, package_name, travel_date,
    num_travelers: travelers,
    message: message || null,
    status: 'pending',
    payment_status: 'unpaid',
    total_amount: (pricePerPerson / 100) * travelers,
    created_at: new Date().toISOString()
  };
  db.bookings.push(booking);
  writeDB(db);

  await sendNotification(
    `📅 New Booking Request — ${package_name}`,
    `<h2>New Booking Request</h2>
     <p><b>Guest:</b> ${name} (${email})</p>
     <p><b>Package:</b> ${package_name}</p>
     <p><b>Travelers:</b> ${travelers}</p>
     <p><b>Travel Date:</b> ${travel_date}</p>
     <p><b>Phone:</b> ${phone || 'N/A'}</p>
     <p><b>Message:</b> ${message || 'N/A'}</p>`
  );

  res.status(201).json({
    success: true,
    message: 'Booking submitted! We will contact you within 24 hours.',
    booking_id: booking.id
  });
});

// ══════════════════════════════════════════════════
//  Public — Inquiries
// ══════════════════════════════════════════════════
app.post('/api/inquiries', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'Name, email, and message are required.' });

  const db = readDB();
  const inquiry = {
    id: db.nextId++, name, email,
    phone: phone || null,
    subject: subject || null,
    message, read: false,
    created_at: new Date().toISOString()
  };
  db.inquiries.push(inquiry);
  writeDB(db);

  await sendNotification(
    `✉️ New Inquiry — ${subject || 'General'}`,
    `<h2>New Contact Inquiry</h2>
     <p><b>From:</b> ${name} (${email})</p>
     <p><b>Subject:</b> ${subject || 'N/A'}</p>
     <p><b>Phone:</b> ${phone || 'N/A'}</p>
     <p><b>Message:</b></p><p>${message}</p>`
  );

  res.status(201).json({ success: true, message: 'Thank you for reaching out! We will get back to you soon.' });
});

// ══════════════════════════════════════════════════
//  Newsletter — The Dispatch
// ══════════════════════════════════════════════════
app.post('/api/newsletter', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'A valid email address is required.' });

  const db = readDB();
  if (db.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase()))
    return res.json({ success: true, message: "You're already on the list. Welcome back." });

  db.subscribers.push({
    id: db.nextId++, email,
    name: name || null,
    subscribed_at: new Date().toISOString()
  });
  writeDB(db);

  await sendNotification(
    '📬 New Subscriber — The Dispatch',
    `<h2>New Newsletter Subscriber</h2><p><b>Email:</b> ${email}</p><p><b>Name:</b> ${name || 'N/A'}</p>`
  );

  res.json({ success: true, message: "You're on the list. Welcome to the Dispatch." });
});

app.get('/api/admin/subscribers', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.subscribers.slice().reverse());
});

app.delete('/api/admin/subscribers/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.subscribers.findIndex(s => s.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Subscriber not found' });
  db.subscribers.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/subscribers/send-dispatch', authMiddleware, async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

  const transporter = createTransporter();
  if (!transporter) return res.status(503).json({
    error: 'Email is not configured. Add EMAIL_USER and EMAIL_PASS to your .env file to send the Dispatch.'
  });

  const db = readDB();
  if (!db.subscribers.length) return res.status(400).json({ error: 'No subscribers on the list yet.' });

  let sent = 0, failed = 0;
  for (const sub of db.subscribers) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: sub.email,
        subject,
        html: `${message.replace(/\n/g, '<br>')}
               <hr style="margin:2rem 0;border:none;border-top:1px solid #eee">
               <p style="font-size:12px;color:#999">You received this because you subscribed to the ZUMI Travels Dispatch.</p>`
      });
      sent++;
    } catch (err) {
      console.error(`Dispatch failed for ${sub.email}:`, err.message);
      failed++;
    }
  }

  res.json({ success: true, sent, failed, total: db.subscribers.length });
});

// ══════════════════════════════════════════════════
//  Serve pages
// ══════════════════════════════════════════════════
app.get('/admin*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
);
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

// ══════════════════════════════════════════════════
//  Start
// ══════════════════════════════════════════════════
seedAdmin();
app.listen(PORT, () => {
  console.log(`\n  ZUMI Travels  →  http://localhost:${PORT}`);
  console.log(`  Admin         →  http://localhost:${PORT}/admin\n`);
});
