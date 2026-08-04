// Public website content for Anandi Park.
// Residential NA plots at Bakori, Wagholi, Pune.

export const PROJECT = {
  name: 'Anandi Park',
  tagline: 'Premium Residential Plots at Bakori, Wagholi — Pune East',
  builder: 'Yuvraj Gade & Rajan Kute Developers',
  rera: 'P52100030523',
  priceFrom: '₹18 Lakh',
  priceNote: 'all inclusive',
  possession: 'Ready for Registration',
  location: 'GAT No. 279, Village Bakori, Wagholi-Bakori Road, Taluka Haveli, Pune',
  shortLocation: 'Bakori, Wagholi, Pune',
  phone: '+91 99990 00001',
  whatsapp: '919999000001',
  email: 'sales@anandipark.in',
  subdomain: 'anandi-park',
  mapEmbed:
    'https://www.google.com/maps?q=Bakori,+Wagholi,+Pune,+Maharashtra&output=embed',
  instagram: 'https://instagram.com/anandipark',
  facebook: 'https://facebook.com/anandipark',
  youtube: 'https://youtube.com/@anandipark',
};

export const HIGHLIGHTS = [
  { value: '84', unit: 'Plots', label: 'Residential' },
  { value: '1000–4510', unit: 'Sq.ft', label: 'Plot sizes' },
  { value: '30 & 40', unit: 'ft roads', label: 'Wide internal' },
  { value: '100%', unit: 'Clear', label: 'Titles & NA' },
];

// Plot configurations, priced from ₹18 Lakh upwards.
export const CONFIGURATIONS = [
  {
    type: '1000 Sq.ft Plot',
    carpet: '1,000 sq.ft.',
    price: '₹18 Lakh onwards',
    ideal: 'First home / investment entry',
    seed: 'ap-plot-1k',
    available: 18,
  },
  {
    type: '1500 Sq.ft Plot',
    carpet: '1,500 sq.ft.',
    price: '₹27 Lakh onwards',
    ideal: 'Independent bungalow',
    seed: 'ap-plot-15k',
    available: 22,
    featured: true,
  },
  {
    type: '2000 Sq.ft Plot',
    carpet: '2,000 sq.ft.',
    price: '₹36 Lakh onwards',
    ideal: 'Premium villa plot',
    seed: 'ap-plot-2k',
    available: 15,
  },
  {
    type: '3000+ Sq.ft Plot',
    carpet: '3,000–4,510 sq.ft.',
    price: '₹54 Lakh onwards',
    ideal: 'Corner & road-facing premium',
    seed: 'ap-plot-3k',
    available: 7,
  },
];

export const WHY = [
  {
    title: 'Clear Titles, NA Approved',
    body: 'Every plot is Non-Agricultural approved with a clean, marketable title. Ready for immediate registration and construction.',
    icon: 'shield',
  },
  {
    title: 'Pune East Growth Corridor',
    body: 'Minutes from Kharadi IT hub, Wagholi and the upcoming Pune Ring Road — the fastest appreciating belt in East Pune.',
    icon: 'trending',
  },
  {
    title: 'Gated, Planned Layout',
    body: '84 plots with 30 & 40 ft internal roads, compound wall, street lighting and landscaped entry. Build when you are ready.',
    icon: 'map',
  },
  {
    title: 'Loan & Registration Support',
    body: 'Tie-ups with SBI, HDFC, ICICI and Axis. We handle documentation, loan and registration end to end.',
    icon: 'landmark',
  },
];

export const AMENITIES = [
  { name: '30 & 40 ft Internal Roads', icon: 'road' },
  { name: 'Landscaped Entry Gate', icon: 'building' },
  { name: '24x7 Water Supply Line', icon: 'waves' },
  { name: 'Underground Electricity', icon: 'zap' },
  { name: 'Storm Water Drainage', icon: 'waves' },
  { name: 'Central Garden', icon: 'trees' },
  { name: "Children's Play Zone", icon: 'baby' },
  { name: 'Security Cabin & CCTV', icon: 'shield' },
  { name: 'Compound Wall', icon: 'building' },
  { name: 'Street Lights', icon: 'zap' },
  { name: 'Avenue Tree Plantation', icon: 'trees' },
  { name: 'Open Amenity Space', icon: 'footprints' },
];

export const GALLERY = [
  { seed: 'ap-aerial-view', caption: 'Aerial view of the layout' },
  { seed: 'ap-internal-road', caption: 'Wide internal roads' },
  { seed: 'ap-entry-gate', caption: 'Landscaped entry gate' },
  { seed: 'ap-green-belt', caption: 'Central garden & green belt' },
  { seed: 'ap-plot-demarcation', caption: 'Plot demarcation' },
  { seed: 'ap-sample-villa', caption: 'Sample villa design' },
];

// Real, useful connectivity for Bakori / Wagholi, Pune East.
// Drive times are approximate off-peak estimates by road.
export const NEARBY = [
  { place: 'Wagheshwar Temple, Wagholi', time: '10 min', note: 'Landmark temple' },
  { place: 'Reputed Schools', time: '10 min', note: 'Orchid, Wisdom World, Podar' },
  { place: 'Pune-Nagar Highway (NH-753)', time: '8 min', note: 'City connectivity' },
  { place: 'Kharadi IT Hub — EON, WTC', time: '25 min', note: 'Major employment' },
  { place: 'Proposed Pune Ring Road', time: '10 min', note: 'Future appreciation' },
  { place: 'Lohegaon Airport', time: '30 min', note: 'Air travel' },
  { place: 'Columbia Asia Hospital, Kharadi', time: '25 min', note: 'Healthcare' },
  { place: 'Phoenix Marketcity, Viman Nagar', time: '30 min', note: 'Shopping & leisure' },
  { place: 'Ranjangaon MIDC', time: '30 min', note: 'Industrial belt' },
  { place: 'Pune Railway Station', time: '40 min', note: 'Rail connectivity' },
];

// Punchy connectivity highlights used across the site and in ad content.
export const CONNECTIVITY = [
  { time: '10 min', place: 'Wagheshwar Temple' },
  { time: '10 min', place: 'Schools & Colleges' },
  { time: '25 min', place: 'Kharadi IT Park' },
  { time: '30 min', place: 'Pune Airport' },
];

export const BLOG_POSTS = [
  {
    slug: 'why-wagholi-pune-east',
    title: 'Why Wagholi is Pune East\u2019s smartest plot investment in 2026',
    excerpt:
      'From the Kharadi IT boom to the upcoming Ring Road, here is why land around Wagholi and Bakori is appreciating faster than any other Pune corridor.',
    date: 'Aug 2026',
    readMins: 4,
    seed: 'ap-blog-wagholi',
    tag: 'Investment',
  },
  {
    slug: 'plot-vs-flat',
    title: 'Plot vs Flat: which builds more wealth over 10 years?',
    excerpt:
      'Land appreciates, buildings depreciate. A simple breakdown of why a residential plot at Anandi Park can outperform an apartment.',
    date: 'Jul 2026',
    readMins: 5,
    seed: 'ap-blog-plotvsflat',
    tag: 'Guide',
  },
  {
    slug: 'na-plot-checklist',
    title: 'Buying an NA plot in Pune? Your 7-point legal checklist',
    excerpt:
      'Title, 7/12, NA order, RERA, zone certificate and more — everything to verify before you book a residential plot.',
    date: 'Jul 2026',
    readMins: 6,
    seed: 'ap-blog-checklist',
    tag: 'Legal',
  },
];

export const SOCIAL_POSTS = [
  { seed: 'ap-insta-1', caption: 'Site progress: internal roads complete', likes: 214 },
  { seed: 'ap-insta-2', caption: 'Golden hour at Anandi Park', likes: 187 },
  { seed: 'ap-insta-3', caption: 'Corner plots going fast', likes: 342 },
  { seed: 'ap-insta-4', caption: 'Happy family, new plot booked', likes: 156 },
  { seed: 'ap-insta-5', caption: 'Central garden landscaping', likes: 203 },
  { seed: 'ap-insta-6', caption: 'Weekend site visit drive', likes: 98 },
];

export const TESTIMONIALS = [
  {
    name: 'Rajesh Patil',
    role: 'Plot Owner, IT Professional',
    text: 'Clear titles and zero legal hassle. The team handled documentation and registration end to end. Best investment decision I have made in Pune East.',
    seed: 'ap-t1',
  },
  {
    name: 'Sunita Deshmukh',
    role: 'Investor',
    text: 'I bought two road-facing plots. Prices have already moved up noticeably in months. Wagholi is only going one way.',
    seed: 'ap-t2',
  },
  {
    name: 'Mahesh Kulkarni',
    role: 'Plot Owner',
    text: 'Very professional developers. They arranged the site visit, loan assistance and registration in one smooth process.',
    seed: 'ap-t3',
  },
];

export const FAQS = [
  {
    q: 'Is Anandi Park RERA registered?',
    a: `Yes. Anandi Park is registered under MahaRERA (${PROJECT.rera}). You can verify it on the official MahaRERA portal before booking.`,
  },
  {
    q: 'Are these NA residential plots?',
    a: 'Yes. All 84 plots are Non-Agricultural, residential-zone approved with clear, marketable titles — ready for construction or investment.',
  },
  {
    q: 'What is the starting price?',
    a: `Plots start from ${PROJECT.priceFrom} (${PROJECT.priceNote}) for a 1000 sq.ft. plot. Larger and corner plots are priced accordingly.`,
  },
  {
    q: 'What is the payment plan?',
    a: '10% on booking, 40% on agreement and 50% on registration. Easy EMI options are available through our partner banks.',
  },
  {
    q: 'Do you assist with home loans?',
    a: 'Yes. We have tie-ups with SBI, HDFC, ICICI and Axis Bank and handle the complete loan documentation for you.',
  },
  {
    q: 'Can I visit the site?',
    a: 'Absolutely. We run free site visits every day including weekends, with complimentary pickup within Pune city limits. WhatsApp or call us to schedule.',
  },
];

// Locally hosted AI-generated images (served from /public/site by Next.js).
// Any seed not mapped here falls back to a picsum placeholder.
const LOCAL_IMAGES: Record<string, string> = {
  'ap-hero-land-aerial': '/site/hero-aerial.jpg',
  'ap-about-land': '/site/about-land.jpg',
  'ap-about-green': '/site/about-green.jpg',
  'ap-about-gate': '/site/about-gate.jpg',
  'ap-amenity-bg-green': '/site/green-belt.jpg',
  'ap-aerial-view': '/site/aerial-view.jpg',
  'ap-internal-road': '/site/internal-road.jpg',
  'ap-entry-gate': '/site/entry-gate.jpg',
  'ap-green-belt': '/site/green-belt.jpg',
  'ap-plot-demarcation': '/site/about-land.jpg',
  'ap-sample-villa': '/site/sample-villa.jpg',
  'ap-map-context': '/site/aerial-view.jpg',
  // plot config cards
  'ap-plot-1k': '/site/about-land.jpg',
  'ap-plot-15k': '/site/sample-villa.jpg',
  'ap-plot-2k': '/site/entry-gate.jpg',
  'ap-plot-3k': '/site/aerial-view.jpg',
  // gallery
  'ap-site-view': '/site/aerial-view.jpg',
  'ap-road': '/site/internal-road.jpg',
  'ap-entry': '/site/entry-gate.jpg',
  'ap-green': '/site/green-belt.jpg',
  'ap-plots': '/site/about-land.jpg',
  'ap-aerial': '/site/hero-aerial.jpg',
  // blog
  'ap-blog-wagholi': '/site/blog-wagholi.jpg',
  'ap-blog-plotvsflat': '/site/blog-plotvsflat.jpg',
  'ap-blog-checklist': '/site/blog-checklist.jpg',
  // social feed
  'ap-insta-1': '/site/internal-road.jpg',
  'ap-insta-2': '/site/hero-aerial.jpg',
  'ap-insta-3': '/site/aerial-view.jpg',
  'ap-insta-4': '/site/sample-villa.jpg',
  'ap-insta-5': '/site/green-belt.jpg',
  'ap-insta-6': '/site/entry-gate.jpg',
};

export const img = (seed: string, w: number, h: number) =>
  LOCAL_IMAGES[seed] || `https://picsum.photos/seed/${seed}/${w}/${h}`;
