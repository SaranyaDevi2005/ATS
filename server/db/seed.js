import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import { initDb } from './schema.js';

const candidatesData = [
  // 1. HIRED
  {
    name: 'Alexandra Chen',
    email: 'alexandra.chen@techmail.com',
    phone: '+1-415-555-0101',
    position: 'Senior Full Stack Engineer',
    skills: 'TypeScript, React, Node.js, PostgreSQL, Docker, AWS',
    experience_years: 7,
    source: 'LinkedIn',
    resume_url: 'https://storage.example.com/resumes/alexandra-chen.pdf',
    stage: 'HIRED',
    created_offset_days: 16,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 16 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 13 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 9 },
      { from: 'INTERVIEW', to: 'OFFER', daysAgo: 4 },
      { from: 'OFFER', to: 'HIRED', daysAgo: 1 },
    ],
    notes: [
      'Top tier candidate. Excellent code review feedback during system design round.',
      'Offer accepted at $165k base + equity package.',
    ],
  },
  // 2. HIRED
  {
    name: 'Marcus Vance',
    email: 'marcus.vance@devpro.io',
    phone: '+1-206-555-0142',
    position: 'Lead DevOps Engineer',
    skills: 'Kubernetes, Terraform, AWS, CI/CD, Go, Linux, Prometheus',
    experience_years: 9,
    source: 'Referral',
    resume_url: 'https://storage.example.com/resumes/marcus-vance.pdf',
    stage: 'HIRED',
    created_offset_days: 20,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 20 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 17 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 11 },
      { from: 'INTERVIEW', to: 'OFFER', daysAgo: 6 },
      { from: 'OFFER', to: 'HIRED', daysAgo: 2 },
    ],
    notes: [
      'Referred by VP of Infrastructure. Stellar track record managing multi-region clusters.',
      'Completed security and background verification.',
    ],
  },
  // 3. HIRED
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@datasphere.net',
    phone: '+1-650-555-0189',
    position: 'Senior Data Scientist',
    skills: 'Python, PyTorch, SQL, Pandas, Scikit-learn, MLflow, BigQuery',
    experience_years: 6,
    source: 'GitHub',
    resume_url: 'https://storage.example.com/resumes/elena-rostova.pdf',
    stage: 'HIRED',
    created_offset_days: 22,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 22 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 18 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 12 },
      { from: 'INTERVIEW', to: 'OFFER', daysAgo: 5 },
      { from: 'OFFER', to: 'HIRED', daysAgo: 3 },
    ],
    notes: [
      'Published author on LLM retrieval pipelines. Passed coding interview in record time.',
    ],
  },
  // 4. HIRED
  {
    name: 'David Kim',
    email: 'david.kim@frontendcraft.org',
    phone: '+1-408-555-0112',
    position: 'Frontend React Engineer',
    skills: 'React, Next.js, Redux, Tailwind CSS, Webpack, Jest',
    experience_years: 5,
    source: 'Company Website',
    resume_url: 'https://storage.example.com/resumes/david-kim.pdf',
    stage: 'HIRED',
    created_offset_days: 14,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 14 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 11 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 7 },
      { from: 'INTERVIEW', to: 'OFFER', daysAgo: 3 },
      { from: 'OFFER', to: 'HIRED', daysAgo: 1 },
    ],
    notes: [
      'UI/UX demo was breathtaking. Ready to start in 2 weeks.',
    ],
  },
  // 5. OFFER
  {
    name: 'Sophia Patel',
    email: 'sophia.patel@englead.com',
    phone: '+1-512-555-0199',
    position: 'Engineering Manager',
    skills: 'Engineering Leadership, Agile, System Architecture, Mentorship, hiring',
    experience_years: 11,
    source: 'LinkedIn',
    resume_url: 'https://storage.example.com/resumes/sophia-patel.pdf',
    stage: 'OFFER',
    created_offset_days: 12,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 12 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 9 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 5 },
      { from: 'INTERVIEW', to: 'OFFER', daysAgo: 2 },
    ],
    notes: [
      'Executive team unanimously voted in favor. Offer letter sent on Monday.',
      'Awaiting candidate signature by Friday.',
    ],
  },
  // 6. OFFER
  {
    name: 'Lucas Morales',
    email: 'lucas.morales@cloudarch.dev',
    phone: '+1-737-555-0164',
    position: 'Cloud Infrastructure Architect',
    skills: 'AWS, GCP, Terraform, Microservices, Kafka, Distributed Systems',
    experience_years: 10,
    source: 'Referral',
    resume_url: 'https://storage.example.com/resumes/lucas-morales.pdf',
    stage: 'OFFER',
    created_offset_days: 15,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 15 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 11 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 6 },
      { from: 'INTERVIEW', to: 'OFFER', daysAgo: 1 },
    ],
    notes: [
      'Counter-offering competitor; revised compensation package approved by CFO.',
    ],
  },
  // 7. OFFER
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@uxlab.co',
    phone: '+1-646-555-0177',
    position: 'Product Designer (UI/UX)',
    skills: 'Figma, Design Systems, User Research, Prototyping, Usability Testing',
    experience_years: 6,
    source: 'AngelList',
    resume_url: 'https://storage.example.com/resumes/priya-sharma.pdf',
    stage: 'OFFER',
    created_offset_days: 10,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 10 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 7 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 4 },
      { from: 'INTERVIEW', to: 'OFFER', daysAgo: 1 },
    ],
    notes: [
      'Exceptional portfolio presentation. Strong candidate for product redesign initiative.',
    ],
  },
  // 8. INTERVIEW
  {
    name: 'James Wilson',
    email: 'james.wilson@backendsystems.org',
    phone: '+1-312-555-0133',
    position: 'Senior Backend Engineer',
    skills: 'Node.js, Go, Redis, PostgreSQL, gRPC, RabbitMQ',
    experience_years: 8,
    source: 'LinkedIn',
    resume_url: 'https://storage.example.com/resumes/james-wilson.pdf',
    stage: 'INTERVIEW',
    created_offset_days: 8,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 8 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 6 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 2 },
    ],
    notes: [
      'Technical assessment completed with 98% score. Final loop scheduled with VP.',
    ],
  },
  // 9. INTERVIEW
  {
    name: 'Chloe Dubois',
    email: 'chloe.dubois@mobiledev.io',
    phone: '+1-347-555-0158',
    position: 'Mobile App Developer (iOS/Android)',
    skills: 'React Native, Swift, Kotlin, GraphQL, Redux, Firebase',
    experience_years: 5,
    source: 'Company Website',
    resume_url: 'https://storage.example.com/resumes/chloe-dubois.pdf',
    stage: 'INTERVIEW',
    created_offset_days: 6,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 6 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 4 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 2 },
    ],
    notes: [
      'App architecture round passed. Pair programming interview tomorrow afternoon.',
    ],
  },
  // 10. INTERVIEW
  {
    name: 'Ethan Gallagher',
    email: 'ethan.gallagher@qaquality.org',
    phone: '+1-202-555-0182',
    position: 'QA Automation Engineer',
    skills: 'Playwright, Cypress, Selenium, TypeScript, Jest, CI/CD',
    experience_years: 4,
    source: 'Indeed',
    resume_url: 'https://storage.example.com/resumes/ethan-gallagher.pdf',
    stage: 'INTERVIEW',
    created_offset_days: 7,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 7 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 5 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 1 },
    ],
    notes: [
      'Demonstrated high automated test coverage strategies for micro-frontends.',
    ],
  },
  // 11. INTERVIEW
  {
    name: 'Aisha Al-Mansoor',
    email: 'aisha.mansoor@fullstackcode.com',
    phone: '+1-972-555-0145',
    position: 'Senior Full Stack Engineer',
    skills: 'Next.js, Node.js, Express, Tailwind, MongoDB, Docker',
    experience_years: 6,
    source: 'Referral',
    resume_url: 'https://storage.example.com/resumes/aisha-mansoor.pdf',
    stage: 'INTERVIEW',
    created_offset_days: 5,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 5 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 3 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 1 },
    ],
    notes: [
      'Very clear communication and good problem decomposition.',
    ],
  },
  // 12. INTERVIEW
  {
    name: 'Oliver Thorne',
    email: 'oliver.thorne@datasciencehub.org',
    phone: '+1-617-555-0128',
    position: 'Senior Data Scientist',
    skills: 'Python, TensorFlow, NLP, Transformers, HuggingFace, AWS SageMaker',
    experience_years: 7,
    source: 'GitHub',
    resume_url: 'https://storage.example.com/resumes/oliver-thorne.pdf',
    stage: 'INTERVIEW',
    created_offset_days: 6,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 6 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 4 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 1 },
    ],
    notes: [
      'Live model fine-tuning challenge presented convincingly.',
    ],
  },
  // 13. INTERVIEW
  {
    name: 'Zoe Katsaros',
    email: 'zoe.katsaros@designtrail.io',
    phone: '+1-206-555-0193',
    position: 'Product Designer (UI/UX)',
    skills: 'Figma, Design Thinking, Wireframing, User Journey Mapping, Accessibility',
    experience_years: 4,
    source: 'AngelList',
    resume_url: 'https://storage.example.com/resumes/zoe-katsaros.pdf',
    stage: 'INTERVIEW',
    created_offset_days: 5,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 5 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 3 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 1 },
    ],
    notes: [
      'Whiteboard challenge completed with flying colors.',
    ],
  },
  // 14. SCREENING
  {
    name: 'Daniel Brooks',
    email: 'daniel.brooks@techtalent.net',
    phone: '+1-303-555-0167',
    position: 'Senior Backend Engineer',
    skills: 'Java, Spring Boot, PostgreSQL, Kafka, Redis, Kubernetes',
    experience_years: 6,
    source: 'LinkedIn',
    resume_url: 'https://storage.example.com/resumes/daniel-brooks.pdf',
    stage: 'SCREENING',
    created_offset_days: 4,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 4 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 2 },
    ],
    notes: [
      'Initial 30-min recruiter screening call conducted. Strong interest in remote work.',
    ],
  },
  // 15. SCREENING
  {
    name: 'Maya Lin',
    email: 'maya.lin@reactdevs.com',
    phone: '+1-415-555-0174',
    position: 'Frontend React Engineer',
    skills: 'React, Vue.js, JavaScript, CSS3, Vite, Storybook',
    experience_years: 3,
    source: 'Website',
    resume_url: 'https://storage.example.com/resumes/maya-lin.pdf',
    stage: 'SCREENING',
    created_offset_days: 3,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 3 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 1 },
    ],
    notes: [
      'Reviewing take-home assignment submission.',
    ],
  },
  // 16. SCREENING
  {
    name: 'Carlos Mendez',
    email: 'carlos.mendez@devopscloud.org',
    phone: '+1-512-555-0155',
    position: 'Lead DevOps Engineer',
    skills: 'Docker, Ansible, GCP, Kubernetes, CI/CD, Python',
    experience_years: 8,
    source: 'Indeed',
    resume_url: 'https://storage.example.com/resumes/carlos-mendez.pdf',
    stage: 'SCREENING',
    created_offset_days: 3,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 3 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 1 },
    ],
    notes: [
      'Screening interview scheduled with Hiring Manager for Thursday.',
    ],
  },
  // 17. SCREENING
  {
    name: 'Nadia Kowalski',
    email: 'nadia.kowalski@qacraft.io',
    phone: '+1-773-555-0186',
    position: 'QA Automation Engineer',
    skills: 'Python, Pytest, Appium, Postman, Jenkins, Docker',
    experience_years: 4,
    source: 'LinkedIn',
    resume_url: 'https://storage.example.com/resumes/nadia-kowalski.pdf',
    stage: 'SCREENING',
    created_offset_days: 2,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 2 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 1 },
    ],
    notes: [
      'Phone screen cleared; moving to technical test stage.',
    ],
  },
  // 18. APPLIED
  {
    name: 'Brandon Wright',
    email: 'brandon.wright@fullstackdev.net',
    phone: '+1-619-555-0123',
    position: 'Senior Full Stack Engineer',
    skills: 'Node.js, React, GraphQL, SQLite, TypeScript, AWS',
    experience_years: 5,
    source: 'LinkedIn',
    resume_url: 'https://storage.example.com/resumes/brandon-wright.pdf',
    stage: 'APPLIED',
    created_offset_days: 2,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 2 },
    ],
    notes: [
      'Applied via 1-click LinkedIn easy apply. Resume queued for recruiter review.',
    ],
  },
  // 19. APPLIED
  {
    name: 'Ananya Roy',
    email: 'ananya.roy@aimodels.io',
    phone: '+1-408-555-0136',
    position: 'Senior Data Scientist',
    skills: 'Python, R, Deep Learning, SQL, Tableau, Statistics',
    experience_years: 4,
    source: 'Website',
    resume_url: 'https://storage.example.com/resumes/ananya-roy.pdf',
    stage: 'APPLIED',
    created_offset_days: 1,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 1 },
    ],
    notes: [],
  },
  // 20. APPLIED
  {
    name: 'Liam O’Connor',
    email: 'liam.oconnor@infraarchitect.com',
    phone: '+1-617-555-0195',
    position: 'Cloud Infrastructure Architect',
    skills: 'Azure, Kubernetes, Bicep, Terraform, Linux, PowerShell',
    experience_years: 8,
    source: 'Referral',
    resume_url: 'https://storage.example.com/resumes/liam-oconnor.pdf',
    stage: 'APPLIED',
    created_offset_days: 1,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 1 },
    ],
    notes: [
      'Referred by David Kim.',
    ],
  },
  // 21. APPLIED
  {
    name: 'Jessica Taylor',
    email: 'jessica.taylor@frontendguild.org',
    phone: '+1-212-555-0109',
    position: 'Frontend React Engineer',
    skills: 'JavaScript, React, CSS Modules, HTML5, Web Components',
    experience_years: 2,
    source: 'Indeed',
    resume_url: 'https://storage.example.com/resumes/jessica-taylor.pdf',
    stage: 'APPLIED',
    created_offset_days: 0,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 0 },
    ],
    notes: [],
  },
  // 22. APPLIED
  {
    name: 'Tariq Hassan',
    email: 'tariq.hassan@mobiledevs.net',
    phone: '+1-415-555-0149',
    position: 'Mobile App Developer (iOS/Android)',
    skills: 'Flutter, Dart, Firebase, SQLite, REST APIs, Git',
    experience_years: 3,
    source: 'GitHub',
    resume_url: 'https://storage.example.com/resumes/tariq-hassan.pdf',
    stage: 'APPLIED',
    created_offset_days: 0,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 0 },
    ],
    notes: [],
  },
  // 23. REJECTED
  {
    name: 'Kevin Zhao',
    email: 'kevin.zhao@badfit.io',
    phone: '+1-510-555-0163',
    position: 'Senior Backend Engineer',
    skills: 'PHP, Laravel, MySQL, Apache',
    experience_years: 2,
    source: 'Website',
    resume_url: 'https://storage.example.com/resumes/kevin-zhao.pdf',
    stage: 'REJECTED',
    created_offset_days: 15,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 15 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 12 },
      { from: 'SCREENING', to: 'REJECTED', daysAgo: 10 },
    ],
    notes: [
      'Role requires 5+ years with distributed Go/Node microservices. Position profile mismatch.',
      'Rejection email sent.',
    ],
  },
  // 24. REJECTED
  {
    name: 'Rachel Green',
    email: 'rachel.green@fashionlead.com',
    phone: '+1-212-555-0118',
    position: 'Product Designer (UI/UX)',
    skills: 'Photoshop, Illustrator, InDesign, Graphic Design',
    experience_years: 4,
    source: 'LinkedIn',
    resume_url: 'https://storage.example.com/resumes/rachel-green.pdf',
    stage: 'REJECTED',
    created_offset_days: 11,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 11 },
      { from: 'APPLIED', to: 'REJECTED', daysAgo: 9 },
    ],
    notes: [
      'Strong graphic design background, but lacks product UI/UX and Figma system experience.',
    ],
  },
  // 25. REJECTED
  {
    name: 'Suresh Menon',
    email: 'suresh.menon@techcorp.in',
    phone: '+1-408-555-0171',
    position: 'Engineering Manager',
    skills: 'Project Management, Scrum, Jira, Waterfall',
    experience_years: 12,
    source: 'Indeed',
    resume_url: 'https://storage.example.com/resumes/suresh-menon.pdf',
    stage: 'REJECTED',
    created_offset_days: 18,
    history: [
      { from: null, to: 'APPLIED', daysAgo: 18 },
      { from: 'APPLIED', to: 'SCREENING', daysAgo: 14 },
      { from: 'SCREENING', to: 'INTERVIEW', daysAgo: 9 },
      { from: 'INTERVIEW', to: 'REJECTED', daysAgo: 6 },
    ],
    notes: [
      'Did not pass technical architecture round for hands-on engineering manager expectation.',
    ],
  },
];

export function seed() {
  console.log('🌱 Starting database seeding...');

  const seedTransaction = db.transaction(() => {
    // Clear existing data cleanly
    db.prepare('DELETE FROM notes').run();
    db.prepare('DELETE FROM stage_history').run();
    db.prepare('DELETE FROM candidates').run();

    // Reset autoincrement sequence
    db.prepare(`DELETE FROM sqlite_sequence WHERE name IN ('candidates', 'notes', 'stage_history')`).run();

    let candidateCount = 0;
    let noteCount = 0;
    let historyCount = 0;

    const insertCandidateStmt = db.prepare(`
      INSERT INTO candidates (
        name, email, phone, position, skills, experience_years, source, resume_url, stage, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
    `);

    const insertNoteStmt = db.prepare(`
      INSERT INTO notes (candidate_id, content, created_at)
      VALUES (?, ?, datetime('now', ?))
    `);

    const insertHistoryStmt = db.prepare(`
      INSERT INTO stage_history (candidate_id, from_stage, to_stage, changed_at)
      VALUES (?, ?, ?, datetime('now', ?))
    `);

    for (const c of candidatesData) {
      const createdModifier = `-${c.created_offset_days} days`;
      const result = insertCandidateStmt.run(
        c.name,
        c.email,
        c.phone,
        c.position,
        c.skills,
        c.experience_years,
        c.source,
        c.resume_url,
        c.stage,
        createdModifier,
        createdModifier
      );

      const candidateId = Number(result.lastInsertRowid);
      candidateCount++;

      // Seed stage history
      if (c.history && c.history.length > 0) {
        for (const h of c.history) {
          const changedModifier = `-${h.daysAgo} days`;
          insertHistoryStmt.run(candidateId, h.from, h.to, changedModifier);
          historyCount++;
        }
      }

      // Seed notes
      if (c.notes && c.notes.length > 0) {
        for (let i = 0; i < c.notes.length; i++) {
          const noteDaysAgo = Math.max(0, c.created_offset_days - (i + 1) * 2);
          const noteModifier = `-${noteDaysAgo} days`;
          insertNoteStmt.run(candidateId, c.notes[i], noteModifier);
          noteCount++;
        }
      }
    }

    return { candidateCount, noteCount, historyCount };
  });

  const { candidateCount, noteCount, historyCount } = seedTransaction();
  console.log(`✅ Seeding complete!`);
  console.log(`   - Candidates: ${candidateCount}`);
  console.log(`   - Notes: ${noteCount}`);
  console.log(`   - Stage History: ${historyCount}`);
}

// Run seed if executed directly
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  initDb();
  seed();
}

export default seed;
