import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { config } from './config.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import { Course } from './models/Course.js';
import { Quiz } from './models/Quiz.js';
import { Enrollment } from './models/Enrollment.js';
import { Order } from './models/Order.js';
import { Wishlist } from './models/Wishlist.js';

const categories = [
  { name: 'Development', slug: 'development', icon: 'code', courseCount: 0 },
  { name: 'Design', slug: 'design', icon: 'palette', courseCount: 0 },
  { name: 'Business', slug: 'business', icon: 'briefcase', courseCount: 0 },
  { name: 'Marketing', slug: 'marketing', icon: 'marketing', courseCount: 0 },
  { name: 'Photography', slug: 'photography', icon: 'camera', courseCount: 0 },
  { name: 'Music', slug: 'music', icon: 'music', courseCount: 0 },
];

export async function runSeed() {
  console.log('Seeding LearnHub...');

  await User.deleteMany({});
  await Category.deleteMany({});
  await Course.deleteMany({});
  await Quiz.deleteMany({});
  await Enrollment.deleteMany({});
  await Order.deleteMany({});
  await Wishlist.deleteMany({});

  const adminHash = await bcrypt.hash(config.adminPassword, 12);
  const admin = await User.create({
    name: 'Admin',
    email: config.adminEmail,
    passwordHash: adminHash,
    role: 'admin',
    instructorStatus: 'approved',
  });

  const instructorHash = await bcrypt.hash('Instructor@123', 12);
  const instructor = await User.create({
    name: 'John Instructor',
    email: 'instructor@learnhub.com',
    passwordHash: instructorHash,
    role: 'instructor',
    instructorStatus: 'approved',
  });

  const studentHash = await bcrypt.hash('Student@123', 12);
  const student = await User.create({
    name: 'Demo Student',
    email: 'student@learnhub.com',
    passwordHash: studentHash,
    role: 'student',
  });

  const cats = await Category.insertMany(categories);
  const devCat = cats[0];

  const courses = [
    {
      title: 'Complete React Masterclass',
      slug: 'react-masterclass',
      description: 'Learn React from scratch to advanced patterns including hooks, context, and performance.',
      shortDescription: 'Master React for modern web apps',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      price: 999,
      originalPrice: 1999,
      isFree: false,
      status: 'published',
      instructorId: instructor._id,
      categoryId: devCat._id,
      level: 'Intermediate',
      whatYouLearn: ['React Hooks', 'State management', 'API integration', 'Deployment'],
      requirements: ['Basic HTML/CSS', 'JavaScript fundamentals'],
      rating: 4.8,
      studentCount: 1250,
      sections: [
        {
          title: 'Getting Started',
          order: 0,
          lessons: [
            { title: 'Welcome', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 5, isPreview: true },
            { title: 'Setup Environment', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 12, isPreview: false },
          ],
        },
        {
          title: 'Core Concepts',
          order: 1,
          lessons: [
            { title: 'Components & Props', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 18, isPreview: false },
            { title: 'Hooks Deep Dive', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 25, isPreview: false },
          ],
        },
      ],
    },
    {
      title: 'Node.js API Development',
      slug: 'nodejs-api',
      description: 'Build REST APIs with Express, MongoDB, and JWT authentication.',
      price: 0,
      isFree: true,
      status: 'published',
      instructorId: instructor._id,
      categoryId: devCat._id,
      level: 'Beginner',
      whatYouLearn: ['Express routing', 'MongoDB', 'JWT auth'],
      requirements: ['JavaScript basics'],
      rating: 4.9,
      studentCount: 2100,
      sections: [
        {
          title: 'Intro',
          order: 0,
          lessons: [
            { title: 'What is Node.js?', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 8, isPreview: true },
          ],
        },
      ],
    },
    {
      title: 'UI/UX Design Fundamentals',
      slug: 'ui-design-basics',
      description: 'Design beautiful interfaces with Figma and modern design principles.',
      price: 799,
      originalPrice: 1299,
      isFree: false,
      status: 'published',
      instructorId: instructor._id,
      categoryId: cats[1]._id,
      level: 'Beginner',
      whatYouLearn: ['Figma basics', 'Color theory', 'Typography'],
      requirements: ['None'],
      rating: 4.6,
      studentCount: 890,
      sections: [
        {
          title: 'Design Basics',
          order: 0,
          lessons: [
            { title: 'Introduction to UI', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 10, isPreview: true },
          ],
        },
      ],
    },
  ];

  const createdCourses = [];
  for (const data of courses) {
    const lectureCount = data.sections.reduce((s, sec) => s + sec.lessons.length, 0);
    const totalDuration = data.sections.reduce(
      (s, sec) => s + sec.lessons.reduce((ls, l) => ls + l.duration, 0),
      0
    );
    const course = await Course.create({ ...data, lectureCount, totalDuration });
    createdCourses.push(course);
    await Quiz.create({
      courseId: course._id,
      title: `${course.title} - Final Quiz`,
      passingScore: 70,
      timeLimitMinutes: 15,
      questions: [
        {
          text: 'What is the main topic of this course?',
          options: ['Design', 'Development', 'Marketing', 'Music'],
          correctIndex: 1,
        },
        {
          text: 'How do you mark a lesson complete?',
          options: ['Skip video', 'Watch until end', 'Email admin', 'Pay extra'],
          correctIndex: 1,
        },
        {
          text: 'LearnHub uses which database?',
          options: ['MySQL', 'MongoDB', 'SQLite', 'Redis'],
          correctIndex: 1,
        },
      ],
    });
  }

  await Category.updateMany({}, { courseCount: 1 });

  const freeCourse = createdCourses.find((c) => c.isFree);
  const paidCourse = createdCourses.find((c) => !c.isFree);
  if (freeCourse) {
    await Enrollment.create({ userId: student._id, courseId: freeCourse._id, progressPercent: 25 });
    await Course.findByIdAndUpdate(freeCourse._id, { $inc: { studentCount: 1 } });
  }
  if (paidCourse) {
    await Order.create({
      userId: student._id,
      courseIds: [paidCourse._id],
      amount: paidCourse.price,
      status: 'paid',
    });
    await Enrollment.create({ userId: student._id, courseId: paidCourse._id, progressPercent: 10 });
    await Course.findByIdAndUpdate(paidCourse._id, { $inc: { studentCount: 1 } });
  }
  await Wishlist.create({
    userId: student._id,
    courseIds: createdCourses.filter((c) => c.slug === 'ui-design-basics').map((c) => c._id),
  });

  console.log('Seed complete!');
  console.log('Admin:', config.adminEmail, '/', config.adminPassword);
  console.log('Instructor: instructor@learnhub.com / Instructor@123');
  console.log('Student: student@learnhub.com / Student@123');
}

async function main() {
  await connectDB();
  await runSeed();
  await mongoose.disconnect();
  process.exit(0);
}

const isCli = process.argv[1]?.includes('seed.js');
if (isCli) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
