export const dashboardStats = [
  {
    id: 1,
    title: "Total Users",
    value: 1284,
    change: "+12.4%",
    trend: "up",
  },
  {
    id: 2,
    title: "Active Users",
    value: 932,
    change: "+8.1%",
    trend: "up",
  },
  {
    id: 3,
    title: "Revenue",
    value: "₹4,82,500",
    change: "+18.7%",
    trend: "up",
  },
  {
    id: 4,
    title: "New Registrations",
    value: 46,
    change: "-2.1%",
    trend: "down",
  },
];

export const recentActivities = [
  {
    id: 1,
    title: "New user registered",
    description: "Aarav Mishra created a new account.",
    time: "10 min ago",
    type: "user",
  },
  {
    id: 2,
    title: "Payment received",
    description: "Payment of ₹12,500 received from Rohan Das.",
    time: "28 min ago",
    type: "payment",
  },
  {
    id: 3,
    title: "Service updated",
    description: "SEO package content updated by Admin.",
    time: "1 hour ago",
    type: "service",
  },
  {
    id: 4,
    title: "Lead submitted",
    description: "New website inquiry received from Priya Sharma.",
    time: "2 hours ago",
    type: "lead",
  },
];

export const users = [
  {
    id: "USR001",
    name: "Aarav Mishra",
    email: "aarav@example.com",
    phone: "+91 9876543210",
    status: "active",
    role: "Customer",
    joinedAt: "2026-04-10",
  },
  {
    id: "USR002",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 9876501234",
    status: "blocked",
    role: "Customer",
    joinedAt: "2026-04-05",
  },
  {
    id: "USR003",
    name: "Rohan Das",
    email: "rohan@example.com",
    phone: "+91 9988776655",
    status: "active",
    role: "Subscriber",
    joinedAt: "2026-03-28",
  },
  {
    id: "USR004",
    name: "Sneha Patnaik",
    email: "sneha@example.com",
    phone: "+91 9437001122",
    status: "pending",
    role: "Customer",
    joinedAt: "2026-04-17",
  },
];

export const services = [
  {
    id: "SER001",
    title: "Website Development",
    category: "Development",
    price: 25000,
    status: "published",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop",
    shortDescription: "Modern business websites with responsive UI and admin panel support.",
  },
  {
    id: "SER002",
    title: "SEO Optimization",
    category: "Marketing",
    price: 15000,
    status: "draft",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
    shortDescription: "On-page and technical SEO setup for better search visibility.",
  },
  {
    id: "SER003",
    title: "Social Media Marketing",
    category: "Marketing",
    price: 18000,
    status: "published",
    image:
      "https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=1200&auto=format&fit=crop",
    shortDescription: "Campaign design, content calendar, and performance tracking.",
  },
];

export const leads = [
  {
    id: "LED001",
    name: "Karan Verma",
    email: "karan@example.com",
    phone: "+91 9090909090",
    serviceInterested: "Website Development",
    message: "I need a corporate website with admin panel.",
    date: "2026-04-20",
    status: "new",
  },
  {
    id: "LED002",
    name: "Megha Patel",
    email: "megha@example.com",
    phone: "+91 9000011111",
    serviceInterested: "SEO Optimization",
    message: "Need SEO for an e-commerce website.",
    date: "2026-04-19",
    status: "contacted",
  },
  {
    id: "LED003",
    name: "Arjun Rao",
    email: "arjun@example.com",
    phone: "+91 9888866666",
    serviceInterested: "Social Media Marketing",
    message: "Looking for monthly social media package.",
    date: "2026-04-18",
    status: "closed",
  },
];

export const cmsSections = [
  {
    id: "CMS001",
    sectionName: "Homepage Hero",
    title: "Grow Your Business with Smart Digital Solutions",
    description: "We build websites, apps, and growth systems that help businesses scale.",
    updatedAt: "2026-04-20",
    status: "published",
  },
  {
    id: "CMS002",
    sectionName: "About Us",
    title: "Who We Are",
    description: "A full-service digital agency focused on design, development, and growth.",
    updatedAt: "2026-04-19",
    status: "published",
  },
  {
    id: "CMS003",
    sectionName: "Testimonials",
    title: "Client Success Stories",
    description: "Showcase client feedback and business outcomes.",
    updatedAt: "2026-04-17",
    status: "draft",
  },
];

export const mediaItems = [
  {
    id: "MED001",
    name: "hero-banner.jpg",
    type: "image",
    size: "1.8 MB",
    uploadedAt: "2026-04-20",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "MED002",
    name: "service-video.mp4",
    type: "video",
    size: "8.4 MB",
    uploadedAt: "2026-04-18",
    url: "#",
  },
  {
    id: "MED003",
    name: "team-photo.png",
    type: "image",
    size: "2.1 MB",
    uploadedAt: "2026-04-15",
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
  },
];

export const payments = [
  {
    id: "PAY001",
    user: "Aarav Mishra",
    amount: 25000,
    method: "UPI",
    status: "success",
    date: "2026-04-20",
  },
  {
    id: "PAY002",
    user: "Priya Sharma",
    amount: 15000,
    method: "Card",
    status: "pending",
    date: "2026-04-19",
  },
  {
    id: "PAY003",
    user: "Rohan Das",
    amount: 18000,
    method: "Bank Transfer",
    status: "failed",
    date: "2026-04-18",
  },
];

export const notificationHistory = [
  {
    id: "NOT001",
    title: "New Service Launch",
    message: "We have launched our new branding package.",
    audience: "All Users",
    sentAt: "2026-04-20 10:30 AM",
    status: "sent",
  },
  {
    id: "NOT002",
    title: "Scheduled Maintenance",
    message: "The admin panel will be under maintenance tonight.",
    audience: "Admins",
    sentAt: "2026-04-19 08:00 PM",
    status: "sent",
  },
];

export const teamMembers = [
  {
    id: "TM001",
    name: "Rahul Nanda",
    role: "Admin",
    email: "rahul@example.com",
    phone: "+91 9012345678",
    permissions: ["manage_users", "manage_services", "view_reports"],
    status: "active",
  },
  {
    id: "TM002",
    name: "Neha Jain",
    role: "Editor",
    email: "neha@example.com",
    phone: "+91 9022223344",
    permissions: ["manage_cms", "manage_media"],
    status: "active",
  },
  {
    id: "TM003",
    name: "Vikas Roy",
    role: "Viewer",
    email: "vikas@example.com",
    phone: "+91 9033334455",
    permissions: ["view_reports"],
    status: "inactive",
  },
];

export const settingsData = {
  siteName: "Infotattva Admin",
  siteEmail: "support@infotattva.com",
  supportPhone: "+91 9999999999",
  address: "Bhubaneswar, Odisha, India",
  logoUrl: "https://dummyimage.com/180x60/111827/ffffff&text=Infotattva",
  maintenanceMode: false,
  twoFactorAuth: true,
  cloudinaryCloudName: "demo-cloud",
  apiBaseUrl: "http://localhost:5000/api",
};

export const reportsSummary = [
  {
    id: 1,
    reportTitle: "User Growth Report",
    description: "Track new registrations and active users over time.",
    generatedOn: "2026-04-20",
    format: "CSV",
  },
  {
    id: 2,
    reportTitle: "Revenue Report",
    description: "Monthly revenue grouped by services and payment status.",
    generatedOn: "2026-04-19",
    format: "PDF",
  },
  {
    id: 3,
    reportTitle: "Lead Conversion Report",
    description: "Measure inquiry-to-client conversion rates.",
    generatedOn: "2026-04-18",
    format: "XLSX",
  },
];