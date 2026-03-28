require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const connectDB = require('./config/mongo');
const seedData = require('./config/seedMongo');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Salon Management System API',
      version: '1.0.0',
      description: 'Multi-Branch Salon Management System API with geo-fencing'
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 5000}` }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

let connectedClients = [];

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  connectedClients.push(socket.id);

  socket.on('join-branch', (branchId) => {
    socket.join(`branch-${branchId}`);
    console.log(`Socket ${socket.id} joined branch-${branchId}`);
  });

  socket.on('leave-branch', (branchId) => {
    socket.leave(`branch-${branchId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedClients = connectedClients.filter(id => id !== socket.id);
  });
});

const emitToBranch = (branchId, event, data) => {
  io.to(`branch-${branchId}`).emit(event, data);
};

const emitToAll = (event, data) => {
  io.emit(event, data);
};

const startServer = async () => {
  try {
    await connectDB();
    await seedData();
    console.log('✅ MongoDB Connected and Seeded');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📄 API Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io, emitToBranch, emitToAll };
