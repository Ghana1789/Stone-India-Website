import express from 'express';
import Order from '../models/Order.js';
import Battery from '../models/Battery.js';
import WarrantyClaim from '../models/WarrantyClaim.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import Invoice from '../models/Invoice.js';
import Ticket from '../models/Ticket.js';
import Document from '../models/Document.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('client'));

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const clientId = req.user._id;
    
    // Fallback to empty calculations if models are empty during transition
    const [projectsCount, invoicesAgg, openTickets, docsCount, recentProjects, recentInvoices, recentTickets] = await Promise.all([
      Project.countDocuments({ client: clientId, status: { $nin: ['Completed', 'Cancelled'] } }),
      Invoice.aggregate([
        { $match: { client: clientId, status: 'Pending' } },
        { $group: { _id: null, totalString: { $sum: '$amount' } } }
      ]),
      Ticket.countDocuments({ client: clientId, status: 'Open' }),
      Document.countDocuments({ client: clientId }),
      Project.find({ client: clientId }).sort({ dueDate: 1 }).limit(3).lean(),
      Invoice.find({ client: clientId }).sort({ issueDate: -1 }).limit(3).lean(),
      Ticket.find({ client: clientId }).sort({ createdAt: -1 }).limit(2).lean()
    ]);

    const totalPendingInvoices = invoicesAgg[0]?.totalString || 0;

    res.json({
      success: true,
      data: {
        activeProjects: projectsCount,
        pendingInvoicesAmount: totalPendingInvoices,
        openTickets,
        documentsCount: docsCount,
        recentProjects,
        recentInvoices,
        recentTickets
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ORDERS ─────────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { client: req.user._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('items.battery', 'name image sku')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await Order.countDocuments(filter);

    res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, client: req.user._id })
      .populate('items.battery', 'name image sku specs')
      .populate('assignedBatch', 'batchId status qcStatus');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const { items, deliveryAddress, notes } = req.body;

    let subtotal = 0;
    let gstAmount = 0;
    const enrichedItems = [];

    for (const item of items) {
      const battery = await Battery.findById(item.battery);
      if (!battery) return res.status(404).json({ success: false, message: `Battery not found: ${item.battery}` });
      if (battery.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${battery.name}.` });
      }
      const itemTotal = battery.price * item.quantity;
      const itemGst = (itemTotal * battery.gstRate) / 100;
      subtotal += itemTotal;
      gstAmount += itemGst;
      enrichedItems.push({
        battery: battery._id,
        batteryName: battery.name,
        batterySku: battery.sku,
        quantity: item.quantity,
        unitPrice: battery.price,
        gstRate: battery.gstRate,
        totalPrice: itemTotal + itemGst
      });
    }

    const order = await Order.create({
      client: req.user._id,
      items: enrichedItems,
      subtotal,
      gstAmount,
      totalAmount: subtotal + gstAmount,
      deliveryAddress,
      notes,
      trackingHistory: [{ status: 'Pending', message: 'Order placed successfully.' }]
    });

    res.status(201).json({ success: true, data: order, message: 'Order placed successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── WARRANTY CLAIMS ────────────────────────────────────────────────────────
router.get('/warranty-claims', async (req, res) => {
  try {
    const claims = await WarrantyClaim.find({ client: req.user._id })
      .populate('order', 'orderId')
      .populate('battery', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/warranty-claims', async (req, res) => {
  try {
    const claim = await WarrantyClaim.create({ ...req.body, client: req.user._id });
    res.status(201).json({ success: true, data: claim, message: 'Warranty claim submitted.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── SUPPORT CHAT ───────────────────────────────────────────────────────────
router.get('/messages', async (req, res) => {
  try {
    const roomId = `client_${req.user._id}`;
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(100);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const roomId = `client_${req.user._id}`;
    const msg = await Message.create({
      roomId,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      content: req.body.content,
      type: req.body.type || 'text'
    });

    // Emit via socket
    const io = req.app.get('io');
    io.to(roomId).emit('receive_message', msg);

    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PROJECTS ──────────────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user._id }).sort({ dueDate: 1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── INVOICES ────────────────────────────────────────────────────────────────
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find({ client: req.user._id }).sort({ issueDate: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/invoices/:id/pay', async (req, res) => {
  try {
    // In a real app, verify Razorpay signature here.
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, client: req.user._id },
      { status: 'Paid', paymentId: req.body.paymentId },
      { new: true }
    ).populate('client', 'name email company');
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) io.emit('invoice_updated', invoice);

    res.json({ success: true, data: invoice, message: 'Payment successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TICKETS ─────────────────────────────────────────────────────────────────
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticket = await Ticket.create({
      ticketNumber,
      client: req.user._id,
      subject: req.body.subject,
      description: req.body.description,
      priority: req.body.priority || 'Medium',
      messages: [{
        senderId: req.user._id,
        senderName: req.user.name,
        senderRole: req.user.role,
        message: req.body.description
      }]
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, client: req.user._id },
      { 
        $push: { messages: {
          senderId: req.user._id,
          senderName: req.user.name,
          senderRole: req.user.role,
          message: req.body.message
        }},
        status: 'Open' // Reopen if they reply
      },
      { new: true }
    );
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const documents = await Document.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/documents', async (req, res) => {
  // Normally uses multer middleware. Simulating for now since UI might use Cloudinary direct upload.
  try {
    const doc = await Document.create({
      title: req.body.title,
      client: req.user._id,
      uploadedBy: req.user._id,
      uploaderRole: req.user.role,
      fileUrl: req.body.fileUrl,
      fileType: req.body.fileType,
      sizeBytes: req.body.sizeBytes
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── REPORTS ───────────────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const clientId = req.user._id;

    // 1. Production Data (Last 6 months of battery orders)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const orders = await Order.find({ client: clientId, createdAt: { $gte: sixMonthsAgo } });
    
    // Group by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const prodData = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      prodData[months[d.getMonth()]] = 0;
    }

    let pass = 0, review = 0, fail = 0;

    orders.forEach(o => {
      const m = months[o.createdAt.getMonth()];
      if (prodData[m] !== undefined) {
        prodData[m] += o.items.reduce((sum, item) => sum + item.quantity, 0);
      }

      if (['Packed', 'Shipped', 'Delivered'].includes(o.status)) pass++;
      else if (['Cancelled'].includes(o.status)) fail++;
      else review++;
    });

    const labels = Object.keys(prodData);
    const data = Object.values(prodData);

    // 2. Documents
    const documents = await Document.find({ client: clientId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        production: { labels, data },
        qc: { pass, fail, review },
        documents
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
