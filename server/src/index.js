import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

import { config } from './config.js';
import { connectDB } from './db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import homeRoutes from './routes/home.js';
import userRoutes from './routes/user.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import orderRoutes from './routes/orders.js';
import quizRoutes from './routes/quiz.js';
import certificateRoutes from './routes/certificates.js';
import instructorRoutes from './routes/instructor.js';
import adminRoutes from './routes/admin.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import studentRoutes from './routes/student.js';
import mediaRoutes from './routes/media.js';
import questionRoutes from './routes/questions.js';
import announcementRoutes from './routes/announcements.js';
import contactRoutes from './routes/contact.js';
import sitePageRoutes from './routes/sitePages.js';

import { User } from './models/User.js';
import { SitePage } from './models/SitePage.js';

import { runSeed } from './seed.js';
import { ensureDefaultSitePages } from './services/defaultSitePages.js';
import { ensureAdminAccount } from './services/ensureAdminAccount.js';
import { uploadsRoot } from './services/localUpload.js';


const app = express();
const server = http.createServer(app);


// =============================
// Allowed Frontend Origins
// =============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://learnhub-client-74wgupk45-udaydhakad.vercel.app"
];



// =============================
// Socket.io Setup
// =============================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);



io.use((socket, next) => {

  const token = socket.handshake.auth?.token;

  if (!token) {
    return next();
  }

  try {

    const decoded = jwt.verify(
      token,
      config.jwt.accessSecret
    );

    socket.userId = decoded.userId;

    socket.join(decoded.userId);

    next();

  } catch {

    next();

  }

});



io.on('connection', (socket) => {

  console.log(
    'Socket connected:',
    socket.id
  );

});



// =============================
// Middlewares
// =============================


app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);



app.use(
  helmet({
    crossOriginResourcePolicy:{
      policy:'cross-origin'
    }
  })
);



app.use(cookieParser());



app.use(
  '/uploads',
  express.static(
    uploadsRoot,
    {
      setHeaders(res){

        res.set(
          'Cross-Origin-Resource-Policy',
          'cross-origin'
        );

        res.set(
          'Access-Control-Allow-Origin',
          'https://learnhub-client-74wgupk45-udaydhakad.vercel.app'
        );

      }
    }
  )
);



app.use(
  express.json({
    limit:'10mb'
  })
);



app.use(
  express.urlencoded({
    extended:true
  })
);




// =============================
// Rate Limit
// =============================


const authLimiter = rateLimit({

  windowMs:15 * 60 * 1000,

  max:50

});


app.use(
  '/api/v1/auth',
  authLimiter
);




// =============================
// Routes
// =============================


const api = express.Router();


api.use('/auth', authRoutes);

api.use(homeRoutes);

api.use(userRoutes);

api.use(announcementRoutes);

api.use(contactRoutes);

api.use(sitePageRoutes);

api.use(courseRoutes);

api.use(enrollmentRoutes);

api.use(orderRoutes);

api.use(quizRoutes);

api.use(certificateRoutes);

api.use(instructorRoutes);

api.use(mediaRoutes);

api.use(questionRoutes);

api.use(notificationRoutes);

api.use(messageRoutes);

api.use(studentRoutes);

api.use(adminRoutes);



app.use(
  '/api/v1',
  api
);



app.get(
  '/api/health',
  (_req,res)=>{

    res.json({
      ok:true
    });

  }
);



// Error Handler

app.use(errorHandler);




// =============================
// Database Connection
// =============================


try {

  await connectDB();


  await ensureDefaultSitePages(
    SitePage
  );


  const admin =
    await ensureAdminAccount();


  console.log(
    `Admin login: ${admin.email} / ${config.adminPassword}`
  );


  if(config.nodeEnv === 'development'){

    const userCount =
      await User.countDocuments();


    if(userCount === 0){

      console.log(
        'Database empty — loading demo data...'
      );


      await runSeed();

    }

  }


}
catch(error){

  console.log(error);

  process.exit(1);

}




// =============================
// Server Start
// =============================


server.on(
  'error',
  (err)=>{

    if(err.code === 'EADDRINUSE'){

      console.error(
        `\nPort ${config.port} is already in use.`
      );

      console.error(
        `Windows: npx kill-port ${config.port}\n`
      );

    }
    else{

      console.error(err);

    }


    process.exit(1);

  }
);



server.listen(
  config.port,
  ()=>{

    console.log(
      `LearnHub API http://localhost:${config.port}`
    );

  }
);