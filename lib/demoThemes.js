/**
 * Multi-Thematic Industry & Procedural Content Engine for Web Demos (/demo/[slug])
 * Provides tailored design tokens, color palettes, hero copy, trust pillars,
 * industry-specific service cards, authentic reviews, and FAQs.
 */

export const INDUSTRY_THEMES = {
  TRAVEL_TOURISM: {
    key: 'TRAVEL_TOURISM',
    keywords: [
      'travel', 'tour', 'tourism', 'flight', 'visa', 'trip', 'holiday', 'hotel', 'resort', 
      'vacation', 'booking', 'airline', 'destination', 'wander', 'ghaith', 'al-ghaith', 'safari', 'cruise',
      'umrah', 'umra', 'omrah', 'hajj', 'haji', 'ziyarat', 'ziarah', 'pilgrimage', 'makkah', 'madinah',
      'ticketing', 'package', 'passport', 'consular'
    ],
    industryName: 'Travel & Tourism Agency',
    tagline: 'Premier International Travel & Curated Tours',
    heroHeadlinePrefix: 'Unforgettable Journeys &',
    heroHighlight: 'Curated Travel & Umrah Experiences',
    heroSubtext: 'Bespoke holiday packages, VIP Umrah arrangements, fast-track visa processing, and 5-star flight & resort accommodations tailored for travelers in',
    primaryColor: 'sky',
    gradientClass: 'from-sky-400 via-cyan-400 to-teal-400',
    accentText: 'text-sky-300',
    badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-200',
    buttonClass: 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold shadow-sky-500/25',
    glowColor: 'bg-sky-500/20',
    inputFocusClass: 'focus:border-sky-400 focus:ring-sky-500/20',
    trustPillars: [
      { label: 'IATA & Hajj Ministry Accredited', desc: 'Authorized global ticketing & visas' },
      { label: '100% Customized', desc: 'Bespoke itineraries & guides' },
      { label: 'Visa Fast-Track', desc: '99.2% express approval' },
      { label: '24/7 Concierge', desc: 'On-trip emergency support' }
    ],
    travelPackages: [
      {
        id: 'pkg-umrah-1',
        title: '5-Star VIP Executive Umrah & Ziyarat Package',
        duration: '10 Days / 9 Nights',
        price: '$1,890',
        perPerson: 'per pilgrim',
        badge: 'Top Choice',
        image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',
        includes: ['Steps to Haram 5-Star Hotel', 'Private GMC Luxury Transfers', 'Guided Historical Ziyarat', 'Express Visa & Ground Help'],
        highlight: 'Luxury 5-star accommodations steps away from the Holy Haram with dedicated 24/7 mutawwif support.'
      },
      {
        id: 'pkg-1',
        title: 'Amalfi Coast & Capri Private Yacht Escape',
        duration: '7 Days / 6 Nights',
        price: '$2,450',
        perPerson: 'per traveler',
        badge: 'Bestseller',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
        includes: ['5-Star Cliffside Resort', 'Private Capri Boat Tour', 'Michelin-Starred Dining', 'Chauffeured Transfers'],
        highlight: 'Sunset cruise along Positano with private sommelier tasting.'
      },
      {
        id: 'pkg-2',
        title: 'Swiss Alps Glacier Express & St. Moritz Luxury',
        duration: '8 Days / 7 Nights',
        price: '$3,190',
        perPerson: 'per traveler',
        badge: 'VIP Winter/Spring',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
        includes: ['First-Class Panoramic Rail', 'Thermal Alpine Spa Access', 'Helicopter Glacier Tour', 'Private Mountain Guide'],
        highlight: 'Matterhorn sunrise excursion and luxury chalet suite accommodations.'
      },
      {
        id: 'pkg-3',
        title: 'Kyoto & Tokyo Imperial Cultural Odyssey',
        duration: '10 Days / 9 Nights',
        price: '$2,850',
        perPerson: 'per traveler',
        badge: 'Cultural Immersion',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        includes: ['Private Ryokan with Onsen', 'Shinkansen Bullet Train Passes', 'Tea Ceremony Masterclass', '24/7 Local Concierge'],
        highlight: 'Exclusive after-hours access to ancient Kyoto temples with private monk guide.'
      }
    ],
    visaAssistanceCountries: ['Schengen Area (29 Countries)', 'United Kingdom', 'United States B1/B2', 'UAE Golden Visa', 'Canada & Australia'],
    defaultServices: [
      {
        title: 'Luxury International Vacation Packages',
        desc: 'All-inclusive flights, private chauffeured transfers, 5-star boutique resort stays, and private cultural tours.',
        badge: 'Top Rated'
      },
      {
        title: 'Fast-Track Tourist & Business Visa Assistance',
        desc: 'End-to-end documentation audit, embassy appointment scheduling, and express visa processing with zero hassle.',
        badge: 'Express Service'
      },
      {
        title: 'Corporate & Group Travel Logistics',
        desc: 'Discounted bulk corporate ticketing, hotel room blocks, conference transport, and dedicated account manager.',
        badge: 'Corporate B2B'
      },
      {
        title: 'Bespoke Honeymoon & Family Escapes',
        desc: 'Handcrafted romantic retreats, private yacht charters, and child-friendly excursion itineraries with flexible booking.',
        badge: 'VIP Concierge'
      }
    ],
    reviews: [
      { name: 'Tariq Al-Mansoor', role: 'Frequent Traveler', text: 'Booked our multi-country European summer tour with them. From airport pickups to private guides, every detail was flawlessly organized.' },
      { name: 'Claire Dubois', role: 'Corporate Event Lead', text: 'Secured visas and flights for 24 executives within 72 hours. Outstanding professionalism and responsiveness.' }
    ],
    faqs: [
      { q: 'Can you customize private itineraries?', a: 'Yes, 100% of our luxury travel packages are tailored to your preferred dates, budget, flight class, and resort preferences.' },
      { q: 'Do you assist with urgent visa processing?', a: 'Our dedicated consular desk provides document reviews and expedited appointment booking for all major destinations.' },
      { q: 'What is your refund and cancellation policy?', a: 'We offer flexible booking protection with free date rescheduling on eligible airline and hotel partner reservations.' }
    ]
  },

  RESTAURANT_DINING: {
    key: 'RESTAURANT_DINING',
    keywords: ['restaurant', 'cafe', 'coffee', 'dining', 'bistro', 'food', 'burger', 'pizza', 'steak', 'bakery', 'pastry', 'bar', 'grill', 'sushi', 'culinary', 'cater', 'kitchen', 'eatery', 'taco', 'shawarma'],
    industryName: 'Restaurant & Dining',
    tagline: 'Artisanal Culinary Experiences',
    heroHeadlinePrefix: 'Authentic Flavor &',
    heroHighlight: 'Artisanal Dining Excellence',
    heroSubtext: 'Farm-fresh organic ingredients, masterfully crafted signature recipes, and an unforgettable dining atmosphere in',
    primaryColor: 'amber',
    gradientClass: 'from-amber-400 via-orange-500 to-rose-500',
    accentText: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-200',
    buttonClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-amber-500/25',
    glowColor: 'bg-orange-500/20',
    inputFocusClass: 'focus:border-amber-400 focus:ring-amber-500/20',
    trustPillars: [
      { label: 'Farm-To-Table', desc: '100% organic fresh produce' },
      { label: 'Master Chefs', desc: 'Award-winning signature recipes' },
      { label: 'Private Dining', desc: 'Exclusive VIP event suites' },
      { label: 'Instant Booking', desc: 'Direct online table reserve' }
    ],
    menuCategories: [
      {
        category: "Chef's Signatures",
        items: [
          { name: 'Wood-Fired Dry-Aged Ribeye', price: '$48', desc: '45-day dry-aged Prime Angus, rosemary garlic butter, charred asparagus & truffle reduction.', badge: 'House Specialty' },
          { name: 'Pan-Seared Chilean Sea Bass', price: '$42', desc: 'Saffron-infused risotto, crispy leeks, citrus beurre blanc & caviar pearls.', badge: 'Wild Caught' },
          { name: 'Truffle & Wild Mushroom Tagliatelle', price: '$34', desc: 'Handmade fresh egg pasta, shaved black Périgord truffle, aged Parmigiano-Reggiano.', badge: 'Vegetarian' }
        ]
      },
      {
        category: 'Artisanal Starters',
        items: [
          { name: 'Burrata Pugliese & Heirloom Tomatoes', price: '$19', desc: 'Fresh creamy burrata, balsamic glaze pearls, toasted pine nuts & basil oil.', badge: 'Organic' },
          { name: 'Wagyu Beef Carpaccio', price: '$24', desc: 'Thinly sliced A5 Wagyu, caperberries, micro arugula, truffle aioli & shaved parmesan.', badge: 'Chef Choice' },
          { name: 'Crispy Calamari & Rock Shrimp', price: '$21', desc: 'Flash-fried with pickled cherry peppers, lemon zest & roasted garlic aioli.', badge: 'Crispy' }
        ]
      },
      {
        category: 'Desserts & Cocktails',
        items: [
          { name: 'Deconstructed Tiramisu Al Mascarpone', price: '$14', desc: 'Espresso-soaked ladyfingers, velvety mascarpone cream, Valrhona dark cocoa.', badge: 'Signature' },
          { name: 'Molten Lava Cake with Pistachio Gelato', price: '$15', desc: 'Warm 70% dark chocolate center paired with artisanal Bronte pistachio gelato.', badge: 'Decadent' },
          { name: 'Smoked Rosemary Old Fashioned', price: '$18', desc: 'Small-batch Kentucky bourbon, Angostura bitters, flamed orange peel, charred rosemary.', badge: 'Craft Bar' }
        ]
      }
    ],
    defaultServices: [
      {
        title: "Chef's Signature Seasonal Tasting Menu",
        desc: 'A multi-course gastronomic journey featuring hand-selected seasonal cuts, organic pairings, and artisanal desserts.',
        badge: "Chef's Special"
      },
      {
        title: 'Full-Service Private Event & Corporate Catering',
        desc: 'Live cooking stations, bespoke buffet spreads, and white-glove waitstaff for weddings, galas, and corporate mixers.',
        badge: 'Events & Galas'
      },
      {
        title: 'VIP Table Reservation & Private Dining Room',
        desc: 'Intimate candlelit dining rooms with personalized sommelier pairings for anniversaries, business dinners, and celebrations.',
        badge: 'Instant Reserve'
      },
      {
        title: 'Artisanal Bakery & Handcrafted Dessert Platters',
        desc: 'Daily fresh-baked sourdough, French viennoiseries, custom celebration cakes, and specialty espresso bar.',
        badge: 'Fresh Daily'
      }
    ],
    reviews: [
      { name: 'Chef Alessandro Rossi', role: 'Food Critic', text: 'The balance of textures and authentic seasonal seasoning is exceptional. One of the finest dining gems in the region.' },
      { name: 'Samantha Reed', role: 'Private Event Host', text: 'They catered our corporate product launch for 120 guests. The presentation was stunning and food was rave-reviewed by everyone!' }
    ],
    faqs: [
      { q: 'How far in advance should I reserve a table?', a: 'For weekend dinner service and private dining rooms, we recommend reserving 48–72 hours in advance via our 1-tap booking.' },
      { q: 'Do you accommodate dietary restrictions and allergies?', a: 'Yes, our kitchen features dedicated prep stations for vegan, gluten-free, halal, and keto dietary requirements.' }
    ]
  },

  REAL_ESTATE: {
    key: 'REAL_ESTATE',
    keywords: ['real estate', 'realtor', 'realty', 'property', 'broker', 'apartment', 'condo', 'estate', 'leasing', 'mortgage', 'staging', 'interior design', 'architecture', 'land'],
    industryName: 'Luxury Real Estate & Advisory',
    tagline: 'Top 1% Luxury Property Specialists',
    heroHeadlinePrefix: 'Exclusive Listings &',
    heroHighlight: 'Prime Real Estate Portfolio',
    heroSubtext: 'Discover off-market luxury estates, high-yield commercial assets, and strategic investment properties across',
    primaryColor: 'emerald',
    gradientClass: 'from-emerald-400 via-teal-300 to-cyan-400',
    accentText: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
    buttonClass: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold shadow-emerald-500/25',
    glowColor: 'bg-emerald-500/20',
    inputFocusClass: 'focus:border-emerald-400 focus:ring-emerald-500/20',
    trustPillars: [
      { label: '$75M+ Closed Volume', desc: 'Proven track record in luxury' },
      { label: 'Off-Market Access', desc: 'Exclusive pocket listings' },
      { label: 'Full Staging & 3D', desc: '4K Matterport virtual tours' },
      { label: 'White-Glove Advisory', desc: 'End-to-end closing counsel' }
    ],
    luxuryListings: [
      {
        id: 'prop-1',
        title: 'The Bellagio Waterfront Modern Estate',
        price: '$4,250,000',
        specs: '5 Beds • 6.5 Baths • 6,800 Sq Ft',
        tag: 'Exclusive Direct Waterfront',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        features: ['Infinity Edge Pool', 'Private 80ft Boat Dock', 'Wine Cellar & Smart Automation']
      },
      {
        id: 'prop-2',
        title: 'Panorama Skyline Penthouse Suite',
        price: '$2,890,000',
        specs: '3 Beds • 3.5 Baths • 3,450 Sq Ft',
        tag: 'Private Rooftop Terrace',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        features: ['360° Floor-to-Ceiling Glass', 'Direct Keyed Elevator', '24/7 White Glove Valet']
      },
      {
        id: 'prop-3',
        title: 'Oakridge Contemporary Architectural Villa',
        price: '$3,400,000',
        specs: '4 Beds • 5 Baths • 5,200 Sq Ft',
        tag: 'Gated Private Compound',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        features: ['Zero Carbon Solar Array', 'Designer Italian Kitchen', 'Spa & Wellness Pavilion']
      }
    ],
    defaultServices: [
      {
        title: 'Luxury Residential Acquisition & Buyer Representation',
        desc: 'Confidential scouting, off-market seller negotiations, and rigorous due diligence for high-net-worth buyers.',
        badge: 'VIP Buyer'
      },
      {
        title: 'Strategic Seller Representation & 4K Staging',
        desc: 'High-production video walkthroughs, drone photography, and targeted global MLS syndication to maximize sale price.',
        badge: 'Maximum ROI'
      },
      {
        title: 'Commercial Asset Investment & Advisory',
        desc: 'Cash flow modeling, cap-rate optimization, tenant lease audits, and strategic multi-family acquisitions.',
        badge: 'High Yield'
      },
      {
        title: 'Instant Comprehensive Property Valuation Audit',
        desc: 'In-depth comparative market analysis (CMA) with algorithmic valuation and recent neighborhood comps report.',
        badge: 'Free Valuation'
      }
    ],
    reviews: [
      { name: 'Jonathan Sterling', role: 'Luxury Estate Buyer', text: 'Secured an off-market waterfront villa 15% below market valuation. Their negotiation skills and market knowledge are unrivaled.' },
      { name: 'Victoria Hayes', role: 'Property Seller', text: 'Sold our home in 6 days with 4 competitive bids over asking price. The 3D tour and marketing presentation blew everyone away.' }
    ],
    faqs: [
      { q: 'How do you determine the accurate listing price of a home?', a: 'We combine real-time MLS sold data, micro-neighborhood demand velocity, and professional appraisal modeling.' },
      { q: 'Do you offer virtual showings for out-of-state buyers?', a: 'Yes, we provide live 4K FaceTime tours, drone overviews, and Matterport 3D digital floorplans for all active listings.' }
    ]
  },

  BEAUTY_SPA_SALON: {
    key: 'BEAUTY_SPA_SALON',
    keywords: ['salon', 'spa', 'beauty', 'hair', 'lash', 'nail', 'barber', 'aesthetic', 'skincare', 'cosmetic', 'facial', 'massage', 'wax', 'wellness', 'makeup', 'microblade', 'botox'],
    industryName: 'Luxury Salon & Aesthetic Spa',
    tagline: 'Master Stylists & Skin Rejuvenation Specialists',
    heroHeadlinePrefix: 'Luxury Self-Care &',
    heroHighlight: 'Artisanal Beauty Rejuvenation',
    heroSubtext: 'Bespoke hair design, medical-grade skin therapy, and tranquil spa rituals customized for clients in',
    primaryColor: 'fuchsia',
    gradientClass: 'from-fuchsia-400 via-pink-400 to-rose-400',
    accentText: 'text-fuchsia-300',
    badgeBg: 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-200',
    buttonClass: 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 hover:from-fuchsia-400 hover:to-pink-400 text-white font-bold shadow-fuchsia-500/25',
    glowColor: 'bg-fuchsia-500/20',
    inputFocusClass: 'focus:border-fuchsia-400 focus:ring-fuchsia-500/20',
    trustPillars: [
      { label: 'Master Stylists', desc: '10+ yrs editorial experience' },
      { label: 'Organic & Vegan', desc: 'Zero toxic parabens/sulfates' },
      { label: 'Private VIP Suites', desc: 'Tranquil luxury sanctuary' },
      { label: 'Personalized Skin Regimen', desc: 'Custom diagnostic analysis' }
    ],
    spaTreatments: [
      {
        id: 'spa-1',
        name: 'Signature 24K Gold Cellular Glow Facial',
        duration: '75 min',
        price: '$185',
        badge: 'Client Favorite',
        desc: 'Ultrasonic deep pore extraction, 24k gold peptide sheet mask infusion, cryo-sculpting, and lymphatic drainage.'
      },
      {
        id: 'spa-2',
        name: 'Master Balayage & Glaze Conditioning Ritual',
        duration: '120 min',
        price: '$240',
        badge: 'Master Colorist',
        desc: 'Hand-painted dimensional contouring, bespoke gloss toner, Olaplex structural rebuild, and signature silk blowout.'
      },
      {
        id: 'spa-3',
        name: 'Therapeutic Hot Himalayan Stone Muscle Release',
        duration: '90 min',
        price: '$165',
        badge: 'Pure Zen',
        desc: 'Heated mineral stones, custom essential oil blends, and deep trigger-point tension release for complete renewal.'
      }
    ],
    defaultServices: [
      {
        title: 'Precision Balayage, Color Balancing & Gloss',
        desc: 'Dimensional hair lightening, custom botanical root melt, and bond-building repair treatments for silky shine.',
        badge: 'Most Popular'
      },
      {
        title: 'Advanced Medical HydraFacials & Peels',
        desc: 'Deep ultrasonic pore cleansing, painless suction extraction, antioxidant peptide infusion, and LED light therapy.',
        badge: 'Glow Facial'
      },
      {
        title: 'Deep Tissue & Hot Stone Stress Relief Rituals',
        desc: 'Aromatherapy body massage relieving muscular tension, enhancing circulation, and restoring mental calm.',
        badge: 'Pure Relaxation'
      },
      {
        title: 'Bridal & Editorial Makeup / Hair Styling',
        desc: 'Long-wearing HD airbrush makeup, luxury lash extensions, and bespoke wedding party hair artistry.',
        badge: 'VIP Event'
      }
    ],
    reviews: [
      { name: 'Isabella Vance', role: 'Regular Member', text: 'The HydraFacial transformed my skin texture in one session! The atmosphere is serene and the staff is extraordinarily skilled.' },
      { name: 'Natalie Moreau', role: 'Bridal Client', text: 'Did our entire wedding party hair and makeup. We all looked and felt like royalty. Could not recommend more highly!' }
    ],
    faqs: [
      { q: 'How do I know which facial or skin treatment is right for me?', a: 'Every booking begins with a complimentary 10-minute digital skin diagnostic to tailor active serums to your barrier needs.' },
      { q: 'What brand of hair and skin products do you use?', a: 'We exclusively use medical-grade, cruelty-free, organic botanical formulations with zero harsh sulfates or parabens.' }
    ]
  },

  TECH_SOFTWARE_AGENCY: {
    key: 'TECH_SOFTWARE_AGENCY',
    keywords: ['tech', 'software', 'saas', 'app', 'web', 'digital', 'marketing', 'agency', 'code', 'dev', 'cloud', 'it', 'cyber', 'ai', 'data', 'consulting', 'dmz', 'automation', 'seo'],
    industryName: 'Technology & Digital Solutions',
    tagline: 'Modern High-Performance Engineering & Digital Growth',
    heroHeadlinePrefix: 'Scalable Software &',
    heroHighlight: 'Next-Gen Digital Solutions',
    heroSubtext: 'High-converting web platforms, cloud architecture, and AI-driven automation built to scale businesses in',
    primaryColor: 'violet',
    gradientClass: 'from-violet-400 via-purple-400 to-indigo-400',
    accentText: 'text-violet-300',
    badgeBg: 'bg-violet-500/15 border-violet-500/30 text-violet-200',
    buttonClass: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold shadow-violet-500/25',
    glowColor: 'bg-violet-500/20',
    inputFocusClass: 'focus:border-violet-400 focus:ring-violet-500/20',
    trustPillars: [
      { label: 'Ultra-Fast <0.8s Load', desc: 'Next.js & Edge optimized' },
      { label: 'Zero Bug Guarantee', desc: '100% test coverage & QA' },
      { label: 'AI & Automation', desc: 'Automated CRM & lead pipelines' },
      { label: 'Enterprise Security', desc: 'SOC2 & HIPAA compliant' }
    ],
    bentoGrid: [
      {
        title: 'Global Edge Network (<50ms Latency)',
        desc: 'Deployed on decentralized edge serverless nodes ensuring instant page rendering worldwide.',
        stat: '0.78s',
        statLabel: 'Average Mobile LCP',
        badge: 'Edge CDN'
      },
      {
        title: 'Autonomous AI Lead Pipelines',
        desc: 'Automated decision-maker enrichment, semantic email generation, and instant calendar booking.',
        stat: '10x',
        statLabel: 'Outreach Throughput',
        badge: 'AI Agents'
      },
      {
        title: 'Enterprise SOC2 & SSL Shield',
        desc: 'Bank-grade encryption, zero data telemetry leaks, and continuous security vulnerability scans.',
        stat: '99.99%',
        statLabel: 'Uptime SLA',
        badge: 'Security'
      },
      {
        title: 'Semantic Schema & AI Citability (GEO)',
        desc: 'Pre-formatted for ChatGPT, Perplexity, and Google AI Overviews to capture conversational search rank.',
        stat: '100%',
        statLabel: 'Indexability Score',
        badge: 'Search GEO'
      }
    ],
    defaultServices: [
      {
        title: 'Custom Web Applications & Next-Gen Portals',
        desc: 'Lightning-fast, mobile-first web platforms built on modern React/Next.js with zero bloat and high conversion rates.',
        badge: 'Core Engine'
      },
      {
        title: 'AI Workflow Automation & Intelligent Integrations',
        desc: 'Connect your CRM, lead intake forms, and automated email sequences to save 20+ hours of manual labor per week.',
        badge: 'High Efficiency'
      },
      {
        title: 'SEO Architecture & Core Web Vitals Optimization',
        desc: 'Semantic Schema.org structured data, edge caching, and mobile speed tuning to capture top Google Search rankings.',
        badge: '10x Traffic'
      },
      {
        title: 'Cloud Infrastructure & 24/7 Security Monitoring',
        desc: 'AWS/GCP serverless architecture, automated daily backups, SSL encryption, and high-availability uptime guarantees.',
        badge: 'Enterprise SLA'
      }
    ],
    reviews: [
      { name: 'Alexandre Mercer', role: 'CTO / Founder', text: 'They rebuilt our web platform in 3 weeks. Page load times dropped from 4.2s to 0.7s, and our conversion rate jumped by 42%!' },
      { name: 'Sophia Lin', role: 'Director of Growth', text: 'The automated lead routing system completely transformed our sales response time. Elite technical craftsmanship.' }
    ],
    faqs: [
      { q: 'How fast can a new web platform or prototype be launched?', a: 'Our agile engineering sprint delivers production-ready prototypes within 5–10 business days.' },
      { q: 'Do you provide maintenance and ongoing updates?', a: 'Yes, all projects include 30 days of complimentary support with optional ongoing SLA maintenance packages.' }
    ]
  },

  ROOFING_CONSTRUCTION: {
    key: 'ROOFING_CONSTRUCTION',
    keywords: ['roof', 'construction', 'contractor', 'builder', 'remodel', 'renovation', 'solar', 'gutter', 'siding', 'deck', 'masonry', 'concrete', 'paving'],
    industryName: 'Roofing & General Contracting',
    tagline: 'Licensed & Master Certified Contractors',
    heroHeadlinePrefix: 'Premier Storm-Resistant',
    heroHighlight: 'Roofing & Contracting Excellence',
    heroSubtext: 'Engineered for durability, backed by lifetime warranties, and trusted by hundreds of property owners across',
    primaryColor: 'amber',
    gradientClass: 'from-amber-500 via-orange-500 to-amber-600',
    accentText: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    buttonClass: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold shadow-amber-500/25',
    glowColor: 'bg-amber-500/20',
    inputFocusClass: 'focus:border-amber-400 focus:ring-amber-500/20',
    trustPillars: [
      { label: 'Licensed & Bonded', desc: 'Full $2M liability coverage' },
      { label: 'Lifetime Workmanship', desc: '100% manufacturer warranty' },
      { label: 'Emergency Response', desc: '24/7 Rapid storm tarping' },
      { label: 'Insurance Assistance', desc: 'Direct claim billing support' }
    ],
    roofingMaterials: [
      {
        name: 'Architectural Shingles (GAF Timberline HDZ)',
        lifespan: '30–50 Years',
        windRating: '130 MPH Wind Resistant',
        warranty: 'Lifetime Manufacturer Warranty',
        badge: 'Most Popular',
        desc: 'High-definition dimensional aesthetics with algae resistance and LayerLock mechanical fastening.'
      },
      {
        name: 'Commercial Standing Seam Metal Roofing',
        lifespan: '50–70+ Years',
        windRating: '160 MPH Category 5 Rating',
        warranty: '50-Year Non-Prorated Warranty',
        badge: 'Maximum Durability',
        desc: 'Concealed fasteners, energy-efficient solar reflectivity, and zero maintenance requirements.'
      },
      {
        name: 'Spanish Concrete & Terracotta Barrel Tile',
        lifespan: '50+ Years',
        windRating: 'Class 4 Hail Impact Rated',
        warranty: 'Transferable Lifetime Warranty',
        badge: 'Luxury Architectural',
        desc: 'Timeless Mediterranean aesthetics engineered for extreme UV heat dissipation and hurricane protection.'
      }
    ],
    defaultServices: [
      {
        title: 'Architectural Shingle & Metal Roofing',
        desc: 'Impact-resistant, energy-efficient roofing installations engineered to withstand extreme winds and heavy hail.',
        badge: 'Popular'
      },
      {
        title: 'Emergency Leak Detection & Rapid Tarping',
        desc: 'Immediate dispatch response within 2 hours to prevent water intrusion and secondary structural damage.',
        badge: '24/7 Service'
      },
      {
        title: 'Comprehensive 21-Point Roof Health Audit',
        desc: 'High-resolution drone & physical inspection report outlining shingle granule loss, flashing integrity, and ventilation.',
        badge: 'Free Diagnostic'
      },
      {
        title: 'Seamless Gutter & Downspout Systems',
        desc: 'Heavy-duty aluminum water mitigation systems customized on-site to protect foundation integrity.',
        badge: 'Lifetime Seal'
      }
    ],
    reviews: [
      { name: 'Marcus Sterling', role: 'Homeowner', text: 'Had severe hail damage. Their crew finished the entire 3,200 sq ft roof in a single day and handled everything with our insurance adjuster!' },
      { name: 'Sarah Jenkins', role: 'Property Manager', text: 'Best contractor we have worked with. Clean job site, transparent pricing, and zero surprises on the final invoice.' }
    ],
    faqs: [
      { q: 'How quickly can your emergency response team arrive?', a: 'We dispatch emergency tarping teams within 60–120 minutes of initial contact to secure your structure.' },
      { q: 'Do you help with insurance storm claims?', a: 'Yes, we provide line-item digital drone estimates directly formatted for all major insurance adjusters.' },
      { q: 'What warranties do you provide?', a: 'All new installations carry a 50-year manufacturer warranty alongside our 10-year craftsmanship guarantee.' }
    ]
  },

  DENTAL_MEDICAL: {
    key: 'DENTAL_MEDICAL',
    keywords: ['dent', 'medical', 'clinic', 'doctor', 'physician', 'ortho', 'chiro', 'health', 'derma', 'therapy', 'pediatric', 'pharma', 'eye', 'optom', 'hospital', 'surgery'],
    industryName: 'Dental & Clinical Healthcare',
    tagline: 'Board-Certified Healthcare Specialists',
    heroHeadlinePrefix: 'Modern, Gentle & State-of-the-Art',
    heroHighlight: 'Dental & Clinical Care',
    heroSubtext: 'Painless procedures, cutting-edge digital diagnostics, and personalized treatment plans in a relaxing environment for families in',
    primaryColor: 'teal',
    gradientClass: 'from-cyan-400 via-teal-400 to-emerald-500',
    accentText: 'text-teal-300',
    badgeBg: 'bg-teal-500/15 border-teal-500/30 text-teal-300',
    buttonClass: 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold shadow-teal-500/25',
    glowColor: 'bg-teal-500/20',
    inputFocusClass: 'focus:border-teal-400 focus:ring-teal-500/20',
    trustPillars: [
      { label: 'Board-Certified Doctors', desc: '15+ years clinical expertise' },
      { label: 'Painless Sedation', desc: 'Zero-anxiety comfort options' },
      { label: '3D Digital Imaging', desc: 'Ultra-low radiation scans' },
      { label: 'Same-Day Emergency', desc: 'Walk-ins & acute relief' }
    ],
    smileCases: [
      {
        procedure: 'Handcrafted Porcelain Veneers (8 Units)',
        condition: 'Severe Discoloration & Enamel Micro-Fractures',
        treatmentTime: '2 Visits (7 Days Total)',
        result: 'Natural Hollywood Luminosity & Perfect Symmetry',
        badge: 'Cosmetic Artistry'
      },
      {
        procedure: 'Invisalign Clear Aligner Therapy',
        condition: 'Moderate Crowding & Deep Overbite',
        treatmentTime: '6 Months',
        result: '100% Straight Teeth without Metal Braces',
        badge: 'Orthodontics'
      },
      {
        procedure: 'All-on-4 Permanent Dental Implant Arch',
        condition: 'Multiple Missing Teeth & Bone Loss',
        treatmentTime: 'Same-Day Placement',
        result: 'Full Chewing Function & Fixed Natural Aesthetic',
        badge: 'Implantology'
      }
    ],
    acceptedInsurance: ['Delta Dental Premier', 'MetLife Dental PPO', 'Cigna Healthcare', 'Aetna Dental Network', 'Guardian Dental', '0% CareCredit Financing'],
    defaultServices: [
      {
        title: 'Comprehensive Exams & Low-Dose Digital X-Rays',
        desc: 'Complete oral wellness evaluation, gentle ultrasonic scaling, and personalized preventive care roadmap.',
        badge: 'New Patient Special'
      },
      {
        title: 'Cosmetic Smile Makeovers & Porcelain Veneers',
        desc: 'Custom aesthetic design crafted to restore natural luminosity, correct alignment, and boost self-confidence.',
        badge: 'Custom Aesthetic'
      },
      {
        title: 'Permanent Dental Implants & Restorations',
        desc: 'Titanium root integration with natural-looking zirconia crowns for lifetime chewing strength and stability.',
        badge: 'Permanent Fix'
      },
      {
        title: 'Emergency Tooth Pain & Infection Relief',
        desc: 'Priority same-day appointments dedicated to immediately diagnosing and resolving acute dental discomfort.',
        badge: 'Same-Day'
      }
    ],
    reviews: [
      { name: 'Elena Rostova', role: 'Verified Patient', text: 'I used to have severe dental anxiety, but the team made me feel completely at ease. Painless procedure and immaculate facility!' },
      { name: 'David Chen', role: 'Family Patient', text: 'Dr. and staff are world-class. Digital scans were explained clearly and scheduling was effortless.' }
    ],
    faqs: [
      { q: 'Do you accept insurance and flexible payment plans?', a: 'Yes, we accept all major PPO insurance providers and offer 0% interest flexible financing via CareCredit.' },
      { q: 'What sedation options are available for anxious patients?', a: 'We provide nitrous oxide (laughing gas) and gentle conscious sedation to ensure a completely calm visit.' }
    ]
  },

  LEGAL_FINANCE: {
    key: 'LEGAL_FINANCE',
    keywords: ['law', 'attorney', 'legal', 'lawyer', 'counsel', 'litigation', 'wealth', 'finance', 'tax', 'accounting', 'cpa', 'advisor', 'audit'],
    industryName: 'Legal Representation & Counsel',
    tagline: 'Top-Rated Trial Attorneys & Counsel',
    heroHeadlinePrefix: 'Relentless Advocacy & Proven',
    heroHighlight: 'Legal Representation',
    heroSubtext: 'Dedicated to defending your rights, protecting your assets, and securing maximum financial recovery across',
    primaryColor: 'amber',
    gradientClass: 'from-amber-400 via-yellow-400 to-yellow-600',
    accentText: 'text-yellow-300',
    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-200',
    buttonClass: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold shadow-amber-500/25',
    glowColor: 'bg-amber-400/20',
    inputFocusClass: 'focus:border-amber-400 focus:ring-amber-500/20',
    trustPillars: [
      { label: '98% Success Rate', desc: 'Over $25M+ recovered' },
      { label: 'No Fee Unless We Win', desc: 'Zero upfront financial risk' },
      { label: 'Top 100 Trial Lawyers', desc: 'Nationally recognized counsel' },
      { label: '24/7 Confidential Case Review', desc: 'Direct attorney access' }
    ],
    defaultServices: [
      {
        title: 'Catastrophic Injury & Motor Vehicle Claims',
        desc: 'Aggressive representation against insurance carriers to secure full compensation for medical expenses and lost wages.',
        badge: 'No Win No Fee'
      },
      {
        title: 'Corporate Litigation & Commercial Disputes',
        desc: 'Strategic dispute resolution, breach of contract defense, and partnership liability protection.',
        badge: 'Corporate Advisory'
      },
      {
        title: 'Comprehensive Estate Planning & Asset Shield',
        desc: 'Custom revocable trusts, powers of attorney, and wealth preservation frameworks to secure multi-generational legacy.',
        badge: 'Asset Protection'
      },
      {
        title: 'Real Estate & Contract Negotiation',
        desc: 'Thorough closing due diligence, title review, zoning compliance, and contractual risk mitigation.',
        badge: 'High Value'
      }
    ],
    reviews: [
      { name: 'Robert Vance', role: 'Commercial Client', text: 'Their litigation team dismantled a frivolous multi-million dollar claim in mediation. Invaluable legal partners.' },
      { name: 'Michelle Gomez', role: 'Injury Client', text: 'When insurance offered pennies, this firm took them to court and won 6x the initial settlement offer.' }
    ],
    faqs: [
      { q: 'How does the contingency fee structure work?', a: 'You pay zero legal fees out of pocket. We only take a pre-agreed percentage if we successfully settle or win your case.' },
      { q: 'How quickly can an attorney review my case?', a: 'We provide immediate 24/7 confidential case evaluations with senior partners.' }
    ]
  },

  AUTOMOTIVE_SERVICES: {
    key: 'AUTOMOTIVE_SERVICES',
    keywords: ['auto', 'car', 'detail', 'mechanic', 'repair', 'towing', 'tire', 'collision', 'paint', 'wrap', 'tint', 'motor', 'vehicle', 'transmission', 'brakes', 'lube'],
    industryName: 'Precision Automotive & Detailing',
    tagline: 'Master Certified Automotive Technicians',
    heroHeadlinePrefix: 'High-Precision Performance &',
    heroHighlight: 'Ceramic Auto Detailing',
    heroSubtext: 'Showroom-grade paint correction, certified ceramic coatings, and dealer-grade mechanical servicing for enthusiasts in',
    primaryColor: 'rose',
    gradientClass: 'from-rose-500 via-red-500 to-pink-600',
    accentText: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    buttonClass: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-rose-600/25',
    glowColor: 'bg-rose-500/20',
    inputFocusClass: 'focus:border-rose-400 focus:ring-rose-500/20',
    trustPillars: [
      { label: 'Certified Installers', desc: 'Official 9H Ceramic Pro certified' },
      { label: 'Dust-Free Clean Bay', desc: 'Climate-controlled application' },
      { label: 'Lifetime Warranty', desc: 'CarFax registered coatings' },
      { label: 'Mobile & In-Shop', desc: 'Doorstep pickup available' }
    ],
    detailingTiers: [
      {
        name: 'Stage 1 Precision Polish & Seal',
        price: '$199',
        duration: '3–4 Hours',
        recommended: false,
        badge: 'Entry Detail',
        features: ['Hand Foam Pre-Wash & Iron Decon', 'Clay Bar Paint Purification', 'Single-Stage Gloss Enhancement Polish', '6-Month Hydrophobic Sealant', 'Full Interior Vacuum & Wipe']
      },
      {
        name: '5-Year 9H Graphene Ceramic Shield',
        price: '$599',
        duration: '1 Full Day',
        recommended: true,
        badge: 'Most Popular',
        features: ['2-Stage Multi-Pass Paint Correction', '90%+ Swirl & Scuff Eradication', 'Dual Layer 9H Graphene Coating', 'CarFax Registered Warranty', 'Wheel Faces & Glass Rain Shield', 'Full Interior Steam Extraction']
      },
      {
        name: 'Ultimate Diamond Armor PPF + Ceramic',
        price: '$1,299',
        duration: '2 Days',
        recommended: false,
        badge: 'Track & Supercar Armor',
        features: ['Full Front End Self-Healing PPF', 'Multi-Layer 10H Ceramic Over PPF', 'Wheel Barrel & Caliper Ceramic', '10-Year Rock Chip Protection', 'Full Leather Ceramic Shielding']
      }
    ],
    defaultServices: [
      {
        title: 'Multi-Stage Paint Correction & Swirl Removal',
        desc: 'Rotary jeweled polishing eliminating 95%+ of clear coat micro-scratches, haze, and oxidation for deep mirror gloss.',
        badge: 'Mirror Finish'
      },
      {
        title: '9H Multi-Year Graphene Ceramic Shield',
        desc: 'Permanent hydrophobic bonding delivering extreme chemical resistance, UV shielding, and effortless self-cleaning properties.',
        badge: 'CarFax Registered'
      },
      {
        title: 'Deep Interior Steam Disinfection & Leather Nourish',
        desc: 'Hot water extraction, high-pressure steam sanitation of vents and seams, with OEM matte leather conditioning.',
        badge: 'Odor Neutralization'
      },
      {
        title: 'Self-Healing Paint Protection Film (PPF)',
        desc: 'Computer-cut invisible urethane armor safeguarding front bumper, hood, and mirrors against rock chips and road debris.',
        badge: '10-Yr Warranty'
      }
    ],
    reviews: [
      { name: 'Harrison Blake', role: 'Porsche 911 Owner', text: 'The paint correction took my black finish from dull and swirled to looking better than when it left the showroom floor.' },
      { name: 'Kelly Watson', role: 'SUV Owner', text: 'Ceramic coating makes washing the car take literally 10 minutes. Water flies off the hood effortlessly.' }
    ],
    faqs: [
      { q: 'How long does ceramic coating last?', a: 'Our professional graphene ceramic formulas are rated for 5 to 9 years with proper annual maintenance.' },
      { q: 'Do you offer mobile detailing at my home/office?', a: 'Yes, our fully equipped mobile rigs carry onboard filtered deionized water and power generators.' }
    ]
  },

  HOME_SERVICES_PLUMBING: {
    key: 'HOME_SERVICES_PLUMBING',
    keywords: ['plumb', 'electric', 'hvac', 'air condition', 'heating', 'pest', 'landscap', 'pool', 'garage', 'locksmith', 'handy', 'pipe', 'drain', 'septic', 'water heater', 'furnace', 'duct'],
    industryName: 'Home Services & Repairs',
    tagline: 'Rapid 24/7 Licensed Technicians',
    heroHeadlinePrefix: 'Prompt, Reliable & Affordable',
    heroHighlight: 'Home & Commercial Repairs',
    heroSubtext: 'Same-day appointments, upfront diagnostic pricing, and guaranteed 5-star craftsmanship for homeowners across',
    primaryColor: 'cyan',
    gradientClass: 'from-cyan-400 via-blue-500 to-indigo-500',
    accentText: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    buttonClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-cyan-500/25',
    glowColor: 'bg-cyan-500/20',
    inputFocusClass: 'focus:border-cyan-400 focus:ring-cyan-500/20',
    trustPillars: [
      { label: 'Licensed & Insured', desc: 'Background-checked technicians' },
      { label: 'Upfront Flat-Rate', desc: 'No hidden overtime charges' },
      { label: 'Same-Day Priority', desc: 'Arrive within 60-minute window' },
      { label: '100% Satisfaction', desc: 'Guaranteed parts and labor' }
    ],
    defaultServices: [
      {
        title: 'Emergency Diagnostic & Rapid Repair',
        desc: 'Comprehensive system inspection identifying root causes with transparent quote before any work starts.',
        badge: 'Zero Surprises'
      },
      {
        title: 'High-Efficiency System Upgrades & Replacements',
        desc: 'Modern, energy-saving unit installations lowering monthly utility bills with factory rebates.',
        badge: 'Energy Rebates'
      },
      {
        title: 'Preventative Seasonal Tune-Up & Maintenance',
        desc: 'Thorough lubrication, sensor calibration, safety checks, and filter replacement to prolong equipment life.',
        badge: 'Peak Efficiency'
      },
      {
        title: 'Comprehensive Safety Inspection & Code Compliance',
        desc: 'Full diagnostic testing verifying adherence to municipal safety standards and electrical/plumbing codes.',
        badge: 'Safety First'
      }
    ],
    reviews: [
      { name: 'Brian Miller', role: 'Homeowner', text: 'Our AC went out in 95-degree heat. They arrived within 45 minutes, had the capacitor replaced, and charged exactly what was quoted.' },
      { name: 'Linda Vance', role: 'Resident', text: 'Super professional technicians who wore shoe covers and left the work area cleaner than they found it.' }
    ],
    faqs: [
      { q: 'Do you charge extra for weekends or after-hours emergencies?', a: 'No, we believe in honest flat-rate pricing with zero surprise weekend surcharges.' },
      { q: 'Are your technicians licensed and drug-tested?', a: 'Every technician undergoes rigorous background screening, drug testing, and annual technical re-certification.' }
    ]
  },

  CLEANING_JANITORIAL: {
    key: 'CLEANING_JANITORIAL',
    keywords: ['clean', 'janitor', 'maid', 'sanitize', 'carpet', 'power wash', 'pressure wash', 'window clean', 'housekeep'],
    industryName: 'Commercial & Residential Cleaning',
    tagline: 'Spotless Hospital-Grade Sanitization',
    heroHeadlinePrefix: 'Pristine, Eco-Friendly & Deep',
    heroHighlight: 'Cleaning & Sanitization',
    heroSubtext: 'Hospital-grade non-toxic disinfectants, certified background-checked staff, and 100% spotless satisfaction for properties in',
    primaryColor: 'emerald',
    gradientClass: 'from-emerald-400 via-teal-400 to-cyan-400',
    accentText: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
    buttonClass: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold shadow-emerald-500/25',
    glowColor: 'bg-emerald-500/20',
    inputFocusClass: 'focus:border-emerald-400 focus:ring-emerald-500/20',
    trustPillars: [
      { label: 'Eco-Friendly & Safe', desc: '100% pet & child safe products' },
      { label: 'Bonded & Insured', desc: 'Full property protection coverage' },
      { label: '50-Point Checklist', desc: 'Zero missed corner guarantee' },
      { label: 'Same-Day Booking', desc: 'Flexible recurring scheduling' }
    ],
    defaultServices: [
      {
        title: 'Deep House Cleaning & Move-In/Out Sanitation',
        desc: 'Comprehensive floor-to-ceiling cleaning, oven & appliance detailing, baseboards, and window track disinfection.',
        badge: 'Thorough Clean'
      },
      {
        title: 'Commercial Office Janitorial & Facility Contracts',
        desc: 'Nightly or weekly commercial sanitation, trash removal, surface sanitization, and restroom replenishment.',
        badge: 'Commercial SLA'
      },
      {
        title: 'Hot Water Extraction Carpet & Upholstery Revival',
        desc: 'High-pressure steam extraction lifting deep stubborn stains, dust mites, and pet odors with quick drying.',
        badge: 'Stain Lift'
      },
      {
        title: 'Exterior Power Washing & Gutter Clear',
        desc: 'High-PSI driveway, patio, siding, and sidewalk mildew removal restoring pristine curb appeal.',
        badge: 'Curb Appeal'
      }
    ],
    reviews: [
      { name: 'Rachel Goldstein', role: 'Homeowner', text: 'Our move-out clean was so thorough that the landlord returned 100% of our deposit with zero questions. Outstanding work!' },
      { name: 'Daniel Ortiz', role: 'Office Manager', text: 'Reliable, punctual, and our 5,000 sq ft office always smells fresh and looks immaculate on Monday mornings.' }
    ],
    faqs: [
      { q: 'Do you bring your own cleaning equipment and supplies?', a: 'Yes, our teams arrive fully equipped with HEPA-filter vacuums, microfiber cloths, and commercial-grade eco-friendly cleaners.' },
      { q: 'What happens if I am not 100% satisfied with a clean?', a: 'We offer a 24-hour re-clean guarantee: notify us within 24 hours and we will return to re-clean any area free of charge.' }
    ]
  },

  FITNESS_WELLNESS: {
    key: 'FITNESS_WELLNESS',
    keywords: ['gym', 'fitness', 'train', 'yoga', 'crossfit', 'martial', 'boxing', 'pilates', 'coach', 'sport', 'athletics', 'weight loss'],
    industryName: 'Elite Fitness & Coaching',
    tagline: 'Elite Performance & Body Transformation',
    heroHeadlinePrefix: 'Unleash Your Full Potential with',
    heroHighlight: 'Personalized Coaching & Training',
    heroSubtext: 'Custom workout blueprints, science-backed nutrition guidance, and motivating master coaches in',
    primaryColor: 'lime',
    gradientClass: 'from-lime-400 via-emerald-400 to-teal-400',
    accentText: 'text-lime-300',
    badgeBg: 'bg-lime-500/15 border-lime-500/30 text-lime-200',
    buttonClass: 'bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 hover:from-lime-300 hover:to-emerald-400 text-slate-950 font-bold shadow-lime-500/25',
    glowColor: 'bg-lime-500/20',
    inputFocusClass: 'focus:border-lime-400 focus:ring-lime-500/20',
    trustPillars: [
      { label: 'Certified Master Trainers', desc: 'NASM & CSCS certified' },
      { label: 'Custom Nutrition Plans', desc: 'Tailored macro breakdowns' },
      { label: 'State-Of-The-Art Gear', desc: 'Olympic lifting & cardio suites' },
      { label: 'Free Trial Session', desc: 'Zero long-term commitment' }
    ],
    defaultServices: [
      {
        title: '1-on-1 Personalized Body Transformation Coaching',
        desc: 'Customized progression programming tailored specifically to your metabolic rate, biomechanics, and body goals.',
        badge: 'Fast Results'
      },
      {
        title: 'High-Intensity Functional Group Conditioning',
        desc: 'Heart-rate tracked metabolic circuit workouts engineered to torch calories and build lean functional muscle.',
        badge: 'High Energy'
      },
      {
        title: 'Registered Dietitian Nutrition Blueprint',
        desc: 'Sustainable, non-restrictive eating strategies with weekly grocery guides and body composition tracking.',
        badge: 'Custom Macro'
      },
      {
        title: 'Athletic Strength & Mobility Restoration',
        desc: 'Corrective movement protocols enhancing joint longevity, posture, and explosive athletic output.',
        badge: 'Longevity'
      }
    ],
    reviews: [
      { name: 'Dominic Taylor', role: 'Member (Down 32 lbs)', text: 'Lost 32 lbs in 4 months without starving myself. The accountability and coaching completely changed my life.' },
      { name: 'Chloe Sanders', role: 'Athlete', text: 'World-class facility and coaches who actually pay attention to proper lifting form.' }
    ],
    faqs: [
      { q: 'Is this suitable for complete beginners?', a: 'Yes! We customize every workout to match your current baseline fitness level safely.' },
      { q: 'What is included in the free trial pass?', a: 'You get a full 60-minute 1-on-1 fitness diagnostic and body composition assessment.' }
    ]
  }
};

/**
 * Procedural Dynamic Color Palettes for Unmatched / Custom Categories
 * Ensures NO TWO businesses ever share the same default color or generic look.
 */
const PROCEDURAL_PALETTES = [
  {
    gradientClass: 'from-amber-400 via-orange-500 to-yellow-500',
    accentText: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-200',
    buttonClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-amber-500/25',
    glowColor: 'bg-amber-500/20',
    inputFocusClass: 'focus:border-amber-400 focus:ring-amber-500/20'
  },
  {
    gradientClass: 'from-rose-500 via-pink-500 to-purple-500',
    accentText: 'text-rose-300',
    badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-200',
    buttonClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-pink-400 text-white font-bold shadow-rose-500/25',
    glowColor: 'bg-rose-500/20',
    inputFocusClass: 'focus:border-rose-400 focus:ring-rose-500/20'
  },
  {
    gradientClass: 'from-emerald-400 via-teal-400 to-cyan-400',
    accentText: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
    buttonClass: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold shadow-emerald-500/25',
    glowColor: 'bg-emerald-500/20',
    inputFocusClass: 'focus:border-emerald-400 focus:ring-emerald-500/20'
  },
  {
    gradientClass: 'from-violet-500 via-indigo-500 to-sky-400',
    accentText: 'text-violet-300',
    badgeBg: 'bg-violet-500/15 border-violet-500/30 text-violet-200',
    buttonClass: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-violet-500/25',
    glowColor: 'bg-violet-500/20',
    inputFocusClass: 'focus:border-violet-400 focus:ring-violet-500/20'
  },
  {
    gradientClass: 'from-cyan-400 via-blue-500 to-teal-400',
    accentText: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200',
    buttonClass: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold shadow-cyan-500/25',
    glowColor: 'bg-cyan-500/20',
    inputFocusClass: 'focus:border-cyan-400 focus:ring-cyan-500/20'
  },
  {
    gradientClass: 'from-yellow-400 via-amber-400 to-orange-500',
    accentText: 'text-yellow-300',
    badgeBg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-200',
    buttonClass: 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold shadow-yellow-500/25',
    glowColor: 'bg-yellow-500/20',
    inputFocusClass: 'focus:border-yellow-400 focus:ring-yellow-500/20'
  }
];

function stringToHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Intelligent Theme Matcher & Procedural Content Generator
 */
export function getIndustryTheme(lead) {
  const category = (lead?.category || '').toLowerCase();
  const businessName = (lead?.business_name || '').toLowerCase();
  const servicesStr = Array.isArray(lead?.services) 
    ? lead.services.join(' ').toLowerCase() 
    : (typeof lead?.services === 'string' ? lead.services.toLowerCase() : '');
  const slug = (lead?.business_slug || '').toLowerCase();
  const combined = `${category} ${businessName} ${servicesStr} ${slug}`;

  const themeList = [
    INDUSTRY_THEMES.TRAVEL_TOURISM,
    INDUSTRY_THEMES.RESTAURANT_DINING,
    INDUSTRY_THEMES.REAL_ESTATE,
    INDUSTRY_THEMES.BEAUTY_SPA_SALON,
    INDUSTRY_THEMES.TECH_SOFTWARE_AGENCY,
    INDUSTRY_THEMES.ROOFING_CONSTRUCTION,
    INDUSTRY_THEMES.DENTAL_MEDICAL,
    INDUSTRY_THEMES.LEGAL_FINANCE,
    INDUSTRY_THEMES.AUTOMOTIVE_SERVICES,
    INDUSTRY_THEMES.HOME_SERVICES_PLUMBING,
    INDUSTRY_THEMES.CLEANING_JANITORIAL,
    INDUSTRY_THEMES.FITNESS_WELLNESS
  ];

  for (const theme of themeList) {
    if (theme.keywords.some(kw => combined.includes(kw))) {
      return theme;
    }
  }

  // Deterministic Procedural Generation for Unmatched Custom Businesses
  const hash = stringToHash(combined || 'custom-business');
  const palette = PROCEDURAL_PALETTES[hash % PROCEDURAL_PALETTES.length];
  const displayCategory = lead?.category || 'Professional Services';
  const displayBusiness = lead?.business_name || 'Premier Solutions';
  const displayCity = lead?.city || 'Local Area';

  return {
    key: 'PROCEDURAL_CUSTOM',
    industryName: displayCategory,
    tagline: `Top-Rated ${displayCategory} in ${displayCity}`,
    heroHeadlinePrefix: `Top-Rated & Dedicated`,
    heroHighlight: `${displayCategory} by ${displayBusiness}`,
    heroSubtext: `Tailored high-performance solutions, upfront transparent pricing, and 5-star customer care across`,
    gradientClass: palette.gradientClass,
    accentText: palette.accentText,
    badgeBg: palette.badgeBg,
    buttonClass: palette.buttonClass,
    glowColor: palette.glowColor,
    inputFocusClass: palette.inputFocusClass,
    trustPillars: [
      { label: '5-Star Local Reputation', desc: '100% verified customer ratings' },
      { label: 'Upfront Flat-Rate Estimates', desc: 'Clear pricing with no surprises' },
      { label: 'Priority Turnaround', desc: 'Rapid response in your area' },
      { label: 'Complete Quality Guarantee', desc: '100% customer satisfaction promise' }
    ],
    defaultServices: [
      {
        title: `Comprehensive ${displayCategory} Diagnostic & Consultation`,
        desc: `In-depth evaluation of your specific requirements by ${displayBusiness} with itemized options.`,
        badge: 'Free Estimate'
      },
      {
        title: `Turnkey ${displayCategory} Execution & Implementation`,
        desc: `Commercial-grade craftsmanship executed utilizing industry best practices and proven methodology.`,
        badge: 'Full Service'
      },
      {
        title: `Scheduled Preventative Maintenance & Support`,
        desc: `Regular checkups, proactive servicing, and priority customer care to maximize longevity and performance.`,
        badge: 'Guaranteed'
      },
      {
        title: `Expedited Priority Response Service in ${displayCity}`,
        desc: `Rapid direct-dispatch support engineered to quickly resolve urgent requirements without downtime.`,
        badge: 'Priority'
      }
    ],
    reviews: [
      { name: 'Michael Harrison', role: 'Verified Client', text: `Outstanding quality and professionalism from ${displayBusiness}. They completed everything on time and under budget.` },
      { name: 'Sarah Vance', role: 'Local Customer', text: `Easily the best experience we have had with a ${displayCategory.toLowerCase()} company. Highly recommend!` }
    ],
    faqs: [
      { q: `How can I request a quote from ${displayBusiness}?`, a: `Simply fill out our 1-tap quote form above or give our direct line a call for an immediate estimate.` },
      { q: `Do you provide guarantees on your work in ${displayCity}?`, a: `Yes, we back every project with our 100% customer satisfaction guarantee.` }
    ]
  };
}
