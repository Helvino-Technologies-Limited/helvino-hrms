import Link from 'next/link'
import {
  Building2, Users, Clock, TrendingUp, Shield, Globe,
  Phone, Mail, MapPin, ChevronRight, Star, Briefcase,
  Award, HeartHandshake, CheckCircle, ArrowRight
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-black text-slate-900 text-lg">Helvino</span>
                <span className="font-black text-blue-600 text-lg"> Technologies</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#about" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm">About</Link>
              <Link href="#services" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm">Services</Link>
              <Link href="#careers" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm">Careers</Link>
              <Link href="#contact" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm">Contact</Link>
            </div>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-blue-200 flex items-center gap-2 text-sm"
            >
              Employee Portal
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 20%, #1d4ed8 0%, transparent 40%)' }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '50px 50px' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-200 text-sm font-medium">Kenya's Premier IT Solutions Provider</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-6">
                Transforming
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300">
                  Digital Africa
                </span>
                One Solution at a Time
              </h1>

              <p className="text-slate-300 text-xl mb-10 leading-relaxed max-w-lg">
                From network infrastructure to cybersecurity, CCTV systems to custom software — Helvino Technologies delivers world-class IT solutions built for East Africa.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/login"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-blue-500/40 flex items-center gap-2 hover:scale-105">
                  Access HR Portal
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="#careers"
                  className="border-2 border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:bg-white/10 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Join Our Team
                </Link>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                {[
                  { value: '50+', label: 'Team Members', icon: Users },
                  { value: '200+', label: 'Projects Done', icon: CheckCircle },
                  { value: '10+', label: 'Years of Excellence', icon: Award },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-black text-blue-400 mb-1">{stat.value}</div>
                    <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image collage */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80"
                  alt="Modern office"
                  className="col-span-2 h-52 w-full object-cover rounded-2xl ring-2 ring-blue-500/30 shadow-2xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80"
                  alt="Team collaboration"
                  className="h-44 w-full object-cover rounded-2xl ring-2 ring-blue-500/20 shadow-xl"
                />
                <img
                  src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80"
                  alt="Tech work"
                  className="h-44 w-full object-cover rounded-2xl ring-2 ring-blue-500/20 shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">What We Do</span>
            <h2 className="text-4xl font-black text-slate-900 mt-2 mb-4">Comprehensive IT Solutions</h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto">Delivering enterprise-grade technology services to businesses across Kenya and East Africa</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '💻', title: 'Software Development', desc: 'Custom web & mobile applications, enterprise systems, APIs, and SaaS products tailored to your business needs.' },
              { icon: '🌐', title: 'Network & Infrastructure', desc: 'Enterprise network design, installation, and management. Structured cabling, Wi-Fi, MPLS, and SD-WAN solutions.' },
              { icon: '🔒', title: 'Cybersecurity', desc: 'Penetration testing, security audits, SOC services, and compliance consulting to protect your digital assets.' },
              { icon: '📹', title: 'CCTV & Security Systems', desc: 'Professional surveillance camera installation, access control, and integrated security management systems.' },
              { icon: '🛠️', title: 'IT Support & Helpdesk', desc: 'Proactive managed IT support, hardware maintenance, and 24/7 helpdesk services for businesses.' },
              { icon: '📊', title: 'IT Consulting', desc: 'Strategic technology advisory, digital transformation roadmaps, and IT governance frameworks.' },
            ].map(service => (
              <div key={service.title}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 border border-slate-100">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HRMS Feature Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">Our HRMS Platform</span>
              <h2 className="text-4xl font-black text-slate-900 mt-2 mb-6">
                Managing Our People with World-Class HR Technology
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Our internal Human Resource Management System powers how we recruit, manage, develop, and retain our talented team. Built on modern tech, it's investor-grade and scalable.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Employee Self-Service Portal',
                  'Kenya-Compliant Payroll',
                  'Leave Management',
                  'Attendance Tracking',
                  'Performance Reviews',
                  'Recruitment ATS',
                  'HR Analytics Dashboard',
                  'Audit Trail & Compliance',
                ].map(feature => (
                  <div key={feature} className="flex items-center gap-2 text-slate-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 transition-colors">
                  Access Employee Portal
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80" alt="Office" className="rounded-2xl h-52 w-full object-cover shadow-lg" />
              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80" alt="Meeting" className="rounded-2xl h-52 w-full object-cover shadow-lg mt-8" />
              <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&q=80" alt="Developer" className="rounded-2xl h-52 w-full object-cover shadow-lg" />
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&q=80" alt="Team" className="rounded-2xl h-52 w-full object-cover shadow-lg mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">About Us</span>
            <h2 className="text-4xl font-black text-slate-900 mt-2 mb-4">Built in Kenya, Serving Africa</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Trusted Security', desc: 'ISO-aligned security practices protecting client data and infrastructure', color: 'bg-blue-500' },
              { icon: Globe, title: 'Pan-African Reach', desc: 'Delivering solutions to businesses across East Africa and beyond', color: 'bg-emerald-500' },
              { icon: Users, title: 'Expert Team', desc: 'Certified professionals in networking, security, software, and IT support', color: 'bg-purple-500' },
              { icon: TrendingUp, title: 'Proven Growth', desc: 'Consistent track record of project delivery and client satisfaction', color: 'bg-orange-500' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team photos */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900">Our Work Environment</h2>
            <p className="text-slate-500 mt-2">Where innovation meets collaboration</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
              'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=400&q=80',
              'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=400&q=80',
              'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80',
              'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80',
              'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&q=80',
              'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=80',
              'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&q=80',
            ].map((src, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl shadow-md ${i === 0 || i === 5 ? 'col-span-2' : ''}`}>
                <img src={src} alt={`Office ${i + 1}`} className="w-full h-48 object-cover hover:scale-110 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section id="careers" className="py-24 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-blue-300 font-bold text-sm uppercase tracking-widest">Join Us</span>
          <h2 className="text-4xl font-black mt-2 mb-4">Grow Your Career at Helvino</h2>
          <p className="text-blue-200 text-xl max-w-2xl mx-auto mb-10">
            We're building Kenya's most dynamic IT team. If you're passionate about technology and innovation, we want you.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['Competitive Salary', 'Health Benefits', 'Remote Work Options', 'Training & Certifications', 'Growth Opportunities'].map(benefit => (
              <div key={benefit} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {benefit}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/careers"
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 inline-flex items-center gap-2 justify-center shadow-xl">
              View Open Positions
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="mailto:careers@helvino.org"
              className="border-2 border-white/40 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 inline-flex items-center gap-2 justify-center">
              <Mail className="w-5 h-5" />
              Send Your CV
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">Get In Touch</span>
            <h2 className="text-4xl font-black text-slate-900 mt-2 mb-4">Contact Helvino Technologies</h2>
            <p className="text-slate-500 text-xl">Ready to transform your IT infrastructure? Let's talk.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Phone, title: 'Phone', value: '0703 445 756', href: 'tel:+254703445756', sub: 'Mon–Fri, 8am–6pm EAT' },
              { icon: Mail, title: 'Email', value: 'info@helvino.org', href: 'mailto:info@helvino.org', sub: 'We reply within 24 hours' },
              { icon: MapPin, title: 'Location', value: 'Nairobi, Kenya', href: '#', sub: 'East Africa & Beyond' },
            ].map(contact => (
              <a key={contact.title} href={contact.href}
                className="text-center p-8 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group block">
                <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                  <contact.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1 text-lg">{contact.title}</h3>
                <p className="text-blue-600 font-semibold group-hover:text-blue-700">{contact.value}</p>
                <p className="text-slate-400 text-sm mt-1">{contact.sub}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-black text-white">Helvino Technologies</div>
                  <div className="text-slate-400 text-xs">Limited</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Kenya's trusted IT partner for network infrastructure, cybersecurity, software development, and CCTV systems.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                {[['Home', '/'], ['About Us', '#about'], ['Services', '#services'], ['Careers', '/careers'], ['Employee Portal', '/login']].map(([label, href]) => (
                  <Link key={label} href={href} className="block text-slate-400 hover:text-white transition-colors text-sm">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contact</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> 0703 445 756</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@helvino.org</p>
                <p className="flex items-center gap-2"><Globe className="w-4 h-4" /> helvino.org</p>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Nairobi, Kenya</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Helvino Technologies Limited. All rights reserved. | Registered in Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
