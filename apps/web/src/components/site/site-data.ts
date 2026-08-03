// Public website content for the demo project.
// Images use picsum.photos seeded URLs (free, no API key, stable per seed).

export const PROJECT = {
  name: 'Anandi Park',
  tagline: 'Premium NA Plots by Yuvraj Gade & Rajan Kute Developers, Bakori, Pune',
  builder: 'Yuvraj Gade & Rajan Kute Developers',
  rera: 'P52100030523',
  priceFrom: '₹15 Lac',
  possession: 'Ready for Registration',
  location: 'GAT No. 279, Village Bakori, Taluka Haveli, Pune',
  phone: '+91 99990 00001',
  whatsapp: '919999000001',
  email: 'sales@anandipark.in',
  subdomain: 'anandi-park',
};

export const HIGHLIGHTS = [
  { value: '84', unit: 'Plots', label: 'NA approved' },
  { value: '1000-4500', unit: 'Sq.ft', label: 'Plot sizes' },
  { value: '30\'', unit: 'Wide', label: 'Main roads' },
  { value: '100%', unit: 'Clear', label: 'Title & docs' },
];

export const CONFIGURATIONS = [
  { type: '1000 Sq.ft Plot', carpet: '1,000 sq.ft.', price: '₹15 Lac onwards', beds: 0, baths: 0, seed: 'ap-plot-1k', available: 12 },
  { type: '2000 Sq.ft Plot', carpet: '2,000 sq.ft.', price: '₹28 Lac onwards', beds: 0, baths: 0, seed: 'ap-plot-2k', available: 15, featured: true },
  { type: '5000 Sq.ft Plot', carpet: '5,000 sq.ft.', price: '₹65 Lac onwards', beds: 0, baths: 0, seed: 'ap-plot-5k', available: 5 },
];

export const AMENITIES = [
  { name: 'Internal Roads', icon: 'footprints' },
  { name: 'Landscaped Entry Gate', icon: 'building' },
  { name: 'Water Supply', icon: 'waves' },
  { name: 'Electricity', icon: 'zap' },
  { name: 'Drainage System', icon: 'waves' },
  { name: 'Garden Area', icon: 'trees' },
  { name: 'Children Play Zone', icon: 'baby' },
  { name: 'Security Cabin', icon: 'shield' },
  { name: 'Compound Wall', icon: 'building' },
  { name: 'Street Lights', icon: 'zap' },
  { name: 'Tree Plantation', icon: 'trees' },
  { name: 'Open Spaces', icon: 'footprints' },
];

export const GALLERY = [
  { seed: 'ap-site-view', caption: 'Anandi Park site layout' },
  { seed: 'ap-road', caption: 'Internal road network' },
  { seed: 'ap-entry', caption: 'Landscaped entry gate' },
  { seed: 'ap-green', caption: 'Open green spaces' },
  { seed: 'ap-plots', caption: 'Plot demarcation' },
  { seed: 'ap-aerial', caption: 'Aerial site view' },
];

export const NEARBY = [
  { place: 'Wagholi', time: '5 min' },
  { place: 'Pune-Nagar Highway', time: '10 min' },
  { place: 'Bakori Village', time: '2 min' },
  { place: 'Schools & Colleges', time: '8 min' },
  { place: 'Hospital', time: '10 min' },
  { place: 'Pune City', time: '25 min' },
];

export const TESTIMONIALS = [
  { name: 'Rajesh Patil', role: 'Plot Owner', text: 'Clear titles, no legal hassles. The team handled everything from documentation to registration. Best investment decision.', seed: 'ap-t1' },
  { name: 'Sunita Deshmukh', role: 'Investor', text: 'Bought 2 plots as investment. Road-facing plots have already appreciated 20% in 6 months. Highly recommended.', seed: 'ap-t2' },
  { name: 'Mahesh Kulkarni', role: 'Plot Owner', text: 'Yuraj & Rajan team is very professional. They arranged site visit, loan assistance, and registration support all in one go.', seed: 'ap-t3' },
];

export const FAQS = [
  { q: 'Is the project RERA registered?', a: `Yes. Anandi Park is registered under MahaRERA with number ${PROJECT.rera}. You can verify it on the official MahaRERA portal.` },
  { q: 'Are these NA plots?', a: 'Yes, all plots are Non-Agricultural (NA) approved. Clear title, ready for construction or investment.' },
  { q: 'What is the payment plan?', a: '10% on booking, 40% on agreement, and 50% on registration. Easy EMI options available through partner banks.' },
  { q: 'Do you assist with home loans?', a: 'Yes, we have tie-ups with SBI, HDFC, ICICI, and Axis Bank. Our team handles the complete loan documentation process.' },
  { q: 'Can I visit the site?', a: 'Absolutely! We arrange free site visits every day including weekends. WhatsApp us or call to schedule. Pickup available within city limits.' },
];

export const img = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
