import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

const services = [
  {
    name: 'Website Design & Development',
    category: 'Web Design',
    description: 'Professional responsive website design and development tailored to your business needs.',
    basePrice: 50000,
    packages: JSON.stringify([
      { name: 'Basic', price: 25000, description: 'Up to 5 pages, responsive design' },
      { name: 'Standard', price: 50000, description: 'Up to 10 pages, CMS, contact form' },
      { name: 'Premium', price: 100000, description: 'Unlimited pages, e-commerce, SEO' },
    ]),
  },
  {
    name: 'Custom Software Development',
    category: 'Software Development',
    description: 'Bespoke software solutions built to automate and streamline your business processes.',
    basePrice: 150000,
    packages: JSON.stringify([
      { name: 'Basic', price: 80000, description: 'Simple CRUD application' },
      { name: 'Standard', price: 200000, description: 'Multi-user system with roles & permissions' },
      { name: 'Premium', price: 500000, description: 'Enterprise-grade solution with integrations' },
    ]),
  },
  {
    name: 'School Management System (SaaS)',
    category: 'Software Development',
    description: 'Complete school management system covering students, fees, academics, staff and more.',
    basePrice: 120000,
    packages: JSON.stringify([
      { name: 'Basic', price: 80000, description: 'Student registration, fees, reports' },
      { name: 'Standard', price: 150000, description: 'Full academic management + SMS alerts' },
      { name: 'Premium', price: 250000, description: 'All modules + mobile app + 1yr support' },
    ]),
  },
  {
    name: 'CCTV Camera Installation',
    category: 'CCTV Installation',
    description: 'Professional CCTV camera installation and configuration for homes and businesses.',
    basePrice: 30000,
    packages: JSON.stringify([
      { name: 'Basic', price: 15000, description: '2 cameras, basic DVR' },
      { name: 'Standard', price: 35000, description: '4 cameras, HD DVR, remote view' },
      { name: 'Premium', price: 80000, description: '8+ cameras, NVR, motion alerts, cloud backup' },
    ]),
  },
  {
    name: 'WiFi & Network Installation',
    category: 'Network & WiFi',
    description: 'Enterprise-grade WiFi and network infrastructure setup and configuration.',
    basePrice: 25000,
    packages: JSON.stringify([
      { name: 'Basic', price: 10000, description: 'Single router setup, basic config' },
      { name: 'Standard', price: 30000, description: 'Multi-point WiFi, structured cabling' },
      { name: 'Premium', price: 80000, description: 'Full network infrastructure, firewall, VLAN' },
    ]),
  },
  {
    name: 'Cybersecurity Services',
    category: 'Cybersecurity',
    description: 'Comprehensive cybersecurity solutions to protect your business from digital threats.',
    basePrice: 50000,
    packages: JSON.stringify([
      { name: 'Basic', price: 20000, description: 'Security audit + recommendations report' },
      { name: 'Standard', price: 60000, description: 'Audit + implementation + 3-month monitoring' },
      { name: 'Premium', price: 150000, description: 'Full managed security service (annual)' },
    ]),
  },
  {
    name: 'IT Consultancy',
    category: 'IT Consultancy',
    description: 'Expert IT advisory services to help you make the right technology decisions.',
    basePrice: 5000,
    packages: JSON.stringify([
      { name: 'Hourly', price: 5000, description: 'Per hour on-site or remote consultation' },
      { name: 'Half Day', price: 15000, description: '4 hours on-site consultation' },
      { name: 'Full Day', price: 25000, description: 'Full day on-site consultation + written report' },
    ]),
  },
  {
    name: 'IT Support Contract',
    category: 'IT Support',
    description: 'Ongoing IT support and maintenance to keep your systems running smoothly.',
    basePrice: 15000,
    packages: JSON.stringify([
      { name: 'Basic', price: 10000, description: 'Remote support, 8x5, 4hr response (monthly)' },
      { name: 'Standard', price: 20000, description: 'Remote + on-site, 8x5, 2hr response (monthly)' },
      { name: 'Premium', price: 40000, description: '24/7 support, 1hr response, dedicated engineer (monthly)' },
    ]),
  },
  {
    name: 'Website Hosting',
    category: 'Hosting & Maintenance',
    description: 'Reliable and fast web hosting with 99.9% uptime guarantee.',
    basePrice: 5000,
    packages: JSON.stringify([
      { name: 'Starter', price: 3000, description: '5GB storage, 1 domain, SSL (annual)' },
      { name: 'Business', price: 8000, description: '20GB storage, unlimited domains, backups (annual)' },
      { name: 'Enterprise', price: 20000, description: 'Dedicated resources, CDN, priority support (annual)' },
    ]),
  },
  {
    name: 'Domain & SSL Registration',
    category: 'Hosting & Maintenance',
    description: 'Domain name registration and SSL certificate installation.',
    basePrice: 3000,
    packages: JSON.stringify([
      { name: '.co.ke Domain', price: 1500, description: 'Annual .co.ke domain registration' },
      { name: '.com Domain', price: 2500, description: 'Annual .com domain registration' },
      { name: 'SSL Certificate', price: 5000, description: 'Annual SSL certificate + installation' },
    ]),
  },
]

async function seed() {
  console.log('Checking existing services...')
  const existing = await sql`SELECT COUNT(*) as count FROM "ServiceCatalog"`
  const count = parseInt(existing[0].count)

  if (count > 0) {
    console.log(`Service catalog already has ${count} entries. Skipping seed.`)
    return
  }

  console.log(`Seeding ${services.length} services...`)
  for (const svc of services) {
    await sql`
      INSERT INTO "ServiceCatalog" (id, name, description, category, "basePrice", packages, "isActive", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${svc.name},
        ${svc.description},
        ${svc.category},
        ${svc.basePrice},
        ${svc.packages}::jsonb,
        true,
        NOW(),
        NOW()
      )
    `
    console.log(`  ✓ ${svc.name}`)
  }
  console.log('Done!')
}

seed().catch(e => { console.error(e); process.exit(1) })
