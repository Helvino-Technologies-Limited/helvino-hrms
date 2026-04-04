import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const HELVINO_PRODUCTS = [
  {
    clientName: 'School Management System',
    industry: 'Education',
    serviceType: 'Software Systems',
    description: 'A comprehensive school management solution covering student registration, fees management, academics, exams, library, transport, staff management, and parent portals. Ideal for primary schools, secondary schools, and colleges.',
    demoUrl: 'https://skulmanager.org',
    isProduct: true,
    productStatus: 'AVAILABLE',
    pricing: 'Contact for pricing',
    features: [
      'Student Registration & Management',
      'Fees Collection & Reporting',
      'Academics & Exam Management',
      'Library Management',
      'Staff & Payroll',
      'Parent Portal',
      'SMS/Email Notifications',
    ],
    isPublished: true,
    projectImages: [],
  },
  {
    clientName: 'Hospital Management System',
    industry: 'Healthcare',
    serviceType: 'Software Systems',
    description: 'A complete hospital information management system with patient management, OPD/IPD management, pharmacy integration, lab results, billing, appointment scheduling, and electronic health records.',
    demoUrl: 'https://hms-three-nu.vercel.app',
    isProduct: true,
    productStatus: 'AVAILABLE',
    pricing: 'Contact for pricing',
    features: [
      'Patient Registration & Records',
      'OPD / IPD Management',
      'Pharmacy Integration',
      'Lab & Radiology Module',
      'Appointment Scheduling',
      'Billing & Insurance',
      'Clinical Reports & Analytics',
    ],
    isPublished: true,
    projectImages: [],
  },
  {
    clientName: 'Dental Practice Management System',
    industry: 'Healthcare',
    serviceType: 'Software Systems',
    description: 'A specialized dental practice management platform for managing patient records, dental charts, appointment scheduling, treatment plans, billing, and dental laboratory requests.',
    demoUrl: 'https://dental-eight-taupe.vercel.app',
    isProduct: true,
    productStatus: 'AVAILABLE',
    pricing: 'Contact for pricing',
    features: [
      'Patient Records & Dental Charts',
      'Appointment Scheduling',
      'Treatment Plans & Notes',
      'Billing & Invoicing',
      'Dental Lab Requests',
      'Staff Management',
      'Inventory & Supplies',
    ],
    isPublished: true,
    projectImages: [],
  },
  {
    clientName: 'Pharmacy Management System',
    industry: 'Healthcare',
    serviceType: 'Software Systems',
    description: 'A robust pharmacy management system for tracking drug inventory, dispensing, prescription management, supplier management, sales reporting, and expiry monitoring.',
    demoUrl: 'https://pmss-coral.vercel.app',
    isProduct: true,
    productStatus: 'AVAILABLE',
    pricing: 'Contact for pricing',
    features: [
      'Drug Inventory Management',
      'Prescription & Dispensing',
      'Supplier & Procurement',
      'Expiry Date Tracking',
      'Sales & Revenue Reports',
      'Multi-branch Support',
      'Controlled Drug Register',
    ],
    isPublished: true,
    projectImages: [],
  },
  {
    clientName: 'Business POS System',
    industry: 'Retail & Commerce',
    serviceType: 'Software Systems',
    description: 'A modern point-of-sale system for retail businesses, supermarkets, and restaurants. Features inventory management, sales tracking, receipt printing, and business analytics.',
    demoUrl: 'https://helvinosmart-frontend.vercel.app',
    isProduct: true,
    productStatus: 'AVAILABLE',
    pricing: 'Contact for pricing',
    features: [
      'Point of Sale (POS)',
      'Inventory Management',
      'Receipt & Invoice Generation',
      'Sales Reports & Analytics',
      'Multi-user Access',
      'Customer Management',
      'Mpesa Integration',
    ],
    isPublished: true,
    projectImages: [],
  },
  {
    clientName: 'Water Purification Management System',
    industry: 'Water & Utilities',
    serviceType: 'Software Systems',
    description: 'A water purification company management system for tracking customer subscriptions, deliveries, equipment maintenance, billing, and operational analytics.',
    demoUrl: '',
    isProduct: true,
    productStatus: 'COMING_SOON',
    pricing: 'Contact for pricing',
    features: [
      'Customer Subscription Management',
      'Delivery Scheduling & Tracking',
      'Equipment Maintenance Records',
      'Billing & Collections',
      'Route Optimization',
      'Inventory & Tanks Management',
      'Operational Analytics',
    ],
    isPublished: true,
    projectImages: [],
  },
  {
    clientName: 'Chama CMS',
    industry: 'Finance & Investment',
    serviceType: 'Software Systems',
    description: 'A Chama (investment group) content and member management system for managing contributions, loans, meetings, welfare, financial reports, and member communication.',
    demoUrl: 'https://chama-nu.vercel.app',
    isProduct: true,
    productStatus: 'AVAILABLE',
    pricing: 'Contact for pricing',
    features: [
      'Member Registration & Management',
      'Contribution Tracking',
      'Loan Management',
      'Meeting & Minute Records',
      'Welfare Fund Management',
      'Financial Reports',
      'SMS/Email Notifications',
    ],
    isPublished: true,
    projectImages: [],
  },
]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (!['SUPER_ADMIN', 'SALES_MANAGER', 'HEAD_OF_SALES'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let added = 0
    let skipped = 0

    for (const product of HELVINO_PRODUCTS) {
      const existing = await prisma.portfolio.findFirst({
        where: { clientName: product.clientName, isProduct: true },
      })
      if (existing) {
        skipped++
        continue
      }
      await prisma.portfolio.create({ data: product })
      added++
    }

    return NextResponse.json({ message: `Seeded ${added} products (${skipped} already existed)`, added, skipped })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to seed products' }, { status: 500 })
  }
}
