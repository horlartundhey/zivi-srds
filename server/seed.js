require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Class = require('./models/Class');
const Student = require('./models/Student');

const classes = [
  { name: 'JSS 1A' },
  { name: 'JSS 2B' },
  { name: 'SS 1C' },
];

// Two students with your real emails, others act as filler
const studentTemplates = (classId, className) => [
  {
    name: 'Orlatan Hundeyin',
    parentEmail: 'horlartundhey@gmail.com',
    classId,
    emailStatus: 'pending',
  },
  {
    name: 'Hybrid Traders',
    parentEmail: 'hybridtradersfx@gmail.com',
    classId,
    emailStatus: 'pending',
  },
  {
    name: 'Amaka Okonkwo',
    parentEmail: 'amaka.okonkwo.test@mailinator.com',
    classId,
    emailStatus: 'pending',
  },
  {
    name: 'Chukwuemeka Nwosu',
    parentEmail: 'c.nwosu.test@mailinator.com',
    classId,
    emailStatus: 'pending',
  },
  {
    name: 'Fatima Bello',
    parentEmail: 'fatima.bello.test@mailinator.com',
    classId,
    emailStatus: 'pending',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  // Wipe existing data
  await Student.deleteMany({});
  await Class.deleteMany({});
  console.log('Cleared existing classes and students');

  // Insert classes
  const insertedClasses = await Class.insertMany(classes);
  console.log(`Inserted ${insertedClasses.length} classes`);

  // Insert students for each class
  let totalStudents = 0;
  for (const cls of insertedClasses) {
    const students = studentTemplates(cls._id, cls.name);
    await Student.insertMany(students);
    totalStudents += students.length;
    console.log(`  → ${cls.name}: ${students.length} students`);
  }

  console.log(`\nSeed complete: ${insertedClasses.length} classes, ${totalStudents} students`);
  console.log('\nYour test emails are seeded into EVERY class:');
  console.log('  horlartundhey@gmail.com  → Orlatan Hundeyin');
  console.log('  hybridtradersfx@gmail.com → Hybrid Traders');
  console.log('\nNext steps:');
  console.log('  1. Open http://localhost:5173');
  console.log('  2. Go to Classes → pick a class → upload PDFs per student');
  console.log('  3. Click "Send All" (Mode A) to queue & send');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
