import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Calendar, FileText, Shield, ArrowRight, Star } from 'lucide-react';

const features = [
  {
    name: 'Patient Management',
    description: 'Efficiently manage patient records and medical history.',
    icon: Users,
  },
  {
    name: 'Appointment Scheduling',
    description: 'Streamline appointment booking and management.',
    icon: Calendar,
  },
  {
    name: 'Medical Records',
    description: 'Secure and organized storage of medical documentation.',
    icon: FileText,
  },
];

const pricingPlans = [
  {
    name: 'Basic',
    price: '$49',
    description: 'Essential features for small practices',
    features: [
      'Up to 5 users',
      'Basic patient management',
      'Appointment scheduling',
      'Email support'
    ]
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'Advanced features for growing practices',
    features: [
      'Up to 15 users',
      'Advanced patient management',
      'Custom reporting',
      'Priority support'
    ]
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Complete solution for large practices',
    features: [
      'Unlimited users',
      'Custom integrations',
      'Dedicated support',
      'Advanced analytics'
    ]
  }
];

const demoAccounts = [
  {
    role: 'Admin',
    email: 'admin@hospital.com',
    password: 'password',
    description: 'Full access to organization settings, user management, and analytics.',
    icon: Shield,
  },
  {
    role: 'Doctor',
    email: 'doctor@hospital.com',
    password: 'password',
    description: 'Manage appointments, patient records, and medical history.',
    icon: Users,
  },
  {
    role: 'Patient',
    email: 'patient@example.com',
    password: 'password',
    description: 'Book appointments, view medical records, and manage prescriptions.',
    icon: Calendar,
  },
];

const testimonials = [
  {
    name: "Dr. Priya Sharma",
    role: "Clinic Owner",
    text: "This system has transformed our workflow. Appointments are never missed and patient records are always at our fingertips.",
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    name: "Anil Kumar",
    role: "Receptionist",
    text: "Managing schedules and follow-ups is now a breeze. Our patients love the reminders!",
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    name: "Dr. Lee",
    role: "General Physician",
    text: "The analytics and reporting features help us make better decisions for our practice.",
    image: "https://randomuser.me/api/portraits/men/65.jpg"
  }
];

const whyChoose = [
  {
    icon: <Star className="w-8 h-8 text-yellow-400" />,
    title: "Trusted by 500+ Clinics",
    desc: "Our platform is used by hundreds of clinics and hospitals worldwide."
  },
  {
    icon: <Shield className="w-8 h-8 text-cyan-600" />,
    title: "Secure & Compliant",
    desc: "We use industry-leading security and comply with healthcare regulations."
  },
  {
    icon: <Building2 className="w-8 h-8 text-cyan-600" />,
    title: "Scalable & Customizable",
    desc: "From solo practices to large hospitals, our system grows with you."
  }
];

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-cyan-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-cyan-700 text-xl">
            <Building2 className="w-7 h-7 text-cyan-600" /> MedBookInd
          </Link>
          <div className="hidden md:flex gap-8 items-center font-medium">
            <a href="#features" className="hover:text-cyan-600 transition">Features</a>
            <a href="#pricing" className="hover:text-cyan-600 transition">Pricing</a>
            <a href="#why" className="hover:text-cyan-600 transition">Why Us</a>
            <a href="#testimonials" className="hover:text-cyan-600 transition">Testimonials</a>
            <a href="#demo" className="hover:text-cyan-600 transition">Demo</a>
          </div>
          <div className="flex gap-2">
            <Link to="/auth" className="px-4 py-2 rounded font-semibold text-cyan-700 hover:bg-cyan-50 transition">Sign in</Link>
            <Link to="/organization/register" className="px-4 py-2 rounded bg-cyan-600 text-white font-semibold hover:bg-cyan-500 transition">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cyan-50 to-white flex-1">
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col-reverse md:flex-row items-center gap-12">
          {/* Left: Text */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-semibold w-max mb-4">
              <ArrowRight className="w-4 h-4" /> Just released v1.0
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Hospital Management<br className="hidden sm:block" /> Made Simple
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Streamline your healthcare facility's operations with our comprehensive hospital management system. From appointment scheduling to patient records, we've got you covered.
            </p>
            <div className="flex gap-4">
              <Link
                to="/organization/register"
                className="rounded-md bg-cyan-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-cyan-500 transition"
              >
                Start Free Trial
              </Link>
              <Link
                to="/auth"
                className="text-base font-semibold text-cyan-700 hover:underline flex items-center"
              >
                Sign in <span className="ml-1">→</span>
              </Link>
            </div>
          </div>
          {/* Right: Image */}
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src="https://images.pexels.com/photos/7659564/pexels-photo-7659564.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Hospital Management System"
              className="w-full max-w-md rounded-xl shadow-lg border border-cyan-100"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-cyan-600 font-semibold text-base uppercase tracking-wider">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900">Comprehensive Healthcare Management</p>
            <p className="mt-4 text-lg text-gray-600">
              Our platform provides all the tools you need to manage your healthcare facility efficiently and effectively.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col items-center text-center bg-cyan-50 rounded-xl p-8 shadow hover:shadow-lg transition">
                <feature.icon className="h-10 w-10 text-cyan-600 mb-4" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.name}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why" className="py-20 bg-cyan-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-cyan-600 font-semibold text-base uppercase tracking-wider">Why Choose Us</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900">The MedBookInd Advantage</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {whyChoose.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center bg-white rounded-xl p-8 shadow hover:shadow-lg transition">
                {item.icon}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-cyan-600 font-semibold text-base uppercase tracking-wider">Pricing</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900">Choose Your Plan</p>
            <p className="mt-4 text-lg text-gray-600">
              Flexible pricing for practices of all sizes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="bg-white rounded-xl shadow p-8 flex flex-col items-center border border-cyan-100 hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-extrabold text-cyan-600 mb-2">{plan.price}</div>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <ul className="mb-6 text-gray-700 text-left list-disc list-inside">
                  {plan.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                <Link
                  to="/organization/register"
                  className="mt-auto rounded bg-cyan-600 px-4 py-2 text-white font-semibold hover:bg-cyan-500 transition"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-cyan-600 font-semibold text-base uppercase tracking-wider">Testimonials</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900">What Our Users Say</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-cyan-50 rounded-xl p-8 shadow flex flex-col items-center text-center">
                <img src={t.image} alt={t.name} className="w-16 h-16 rounded-full mb-4 border-2 border-cyan-200 object-cover" />
                <p className="text-gray-700 mb-4 italic">"{t.text}"</p>
                <div className="font-semibold text-cyan-700">{t.name}</div>
                <div className="text-gray-500 text-sm">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Accounts Section */}
      <section id="demo" className="py-20 bg-cyan-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-cyan-300 font-semibold text-base uppercase tracking-wider">Try it now</h2>
            <p className="mt-2 text-3xl font-bold text-white">Experience our demo accounts</p>
            <p className="mt-4 text-lg text-cyan-100">
              Test drive our platform with these demo accounts to explore different user roles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {demoAccounts.map((account) => (
              <div
                key={account.role}
                className="bg-white/10 rounded-2xl p-8 ring-1 ring-white/10 hover:bg-white/20 transition-colors duration-200 flex flex-col items-center text-center"
              >
                <account.icon className="h-8 w-8 text-cyan-300 mb-3" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-white mb-2">{account.role} Account</h3>
                <p className="text-cyan-100 mb-4">{account.description}</p>
                <div className="mb-2">
                  <span className="font-semibold text-white">Email:</span> <span className="text-cyan-100">{account.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-white">Password:</span> <span className="text-cyan-100">{account.password}</span>
                </div>
                <Link
                  to="/auth"
                  className="mt-6 text-sm font-semibold text-cyan-200 hover:underline"
                >
                  Try {account.role} Demo <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-cyan-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your practice?</h2>
          <p className="text-cyan-100 mb-8">Join hundreds of clinics using MedBookInd to streamline their operations and deliver better patient care.</p>
          <Link
            to="/organization/register"
            className="inline-block rounded bg-white px-8 py-3 text-cyan-700 font-semibold text-lg shadow hover:bg-cyan-50 transition"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cyan-900 text-cyan-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Building2 className="w-6 h-6 text-cyan-300" /> MedBookInd
          </div>
          <div className="flex gap-6 text-cyan-200 text-sm">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#pricing" className="hover:underline">Pricing</a>
            <a href="#why" className="hover:underline">Why Us</a>
            <a href="#testimonials" className="hover:underline">Testimonials</a>
            <a href="#demo" className="hover:underline">Demo</a>
          </div>
          <div className="text-cyan-300 text-sm">
            &copy; {new Date().getFullYear()} MedBookInd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;