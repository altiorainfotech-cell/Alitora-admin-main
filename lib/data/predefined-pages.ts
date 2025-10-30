// Predefined pages data structure for Altiora Infotech website
// This contains all 57 pages that need SEO management

export interface PredefinedPage {
  path: string;
  defaultSlug: string;
  category: 'main' | 'services' | 'blog' | 'about' | 'contact' | 'other';
  defaultTitle: string;
  defaultDescription: string;
}

export const PREDEFINED_PAGES: PredefinedPage[] = [
  // Main pages
  {
    path: '/',
    defaultSlug: 'home',
    category: 'main',
    defaultTitle: 'Altiora Infotech - AI, Web3 & Growth Engineering Solutions',
    defaultDescription: 'Leading AI, Web3, and growth engineering solutions for modern businesses. Transform your digital presence with cutting-edge technology.'
  },
  {
    path: '/about',
    defaultSlug: 'about-us',
    category: 'about',
    defaultTitle: 'About Altiora Infotech - Innovation & Excellence',
    defaultDescription: 'Learn about Altiora Infotech\'s mission to deliver innovative AI, Web3, and growth engineering solutions for businesses worldwide.'
  },
  {
    path: '/contact',
    defaultSlug: 'contact-us',
    category: 'contact',
    defaultTitle: 'Contact Altiora Infotech - Get In Touch',
    defaultDescription: 'Contact Altiora Infotech for AI, Web3, and growth engineering solutions. Let\'s discuss your project requirements.'
  },
  {
    path: '/careers',
    defaultSlug: 'careers',
    category: 'other',
    defaultTitle: 'Careers at Altiora Infotech - Join Our Team',
    defaultDescription: 'Join Altiora Infotech and work on cutting-edge AI, Web3, and growth engineering projects. Explore career opportunities.'
  },
  {
    path: '/portfolio',
    defaultSlug: 'portfolio',
    category: 'other',
    defaultTitle: 'Portfolio - Altiora Infotech Projects & Case Studies',
    defaultDescription: 'Explore Altiora Infotech\'s portfolio of successful AI, Web3, and growth engineering projects and case studies.'
  },

  // AI/ML Services
  {
    path: '/services/ai-ml',
    defaultSlug: 'ai-ml-services',
    category: 'services',
    defaultTitle: 'AI & ML Services - Machine Learning Solutions | Altiora Infotech',
    defaultDescription: 'Comprehensive AI and machine learning services to transform your business with intelligent automation and data-driven insights.'
  },
  {
    path: '/services/ai-ml/machine-learning-development',
    defaultSlug: 'machine-learning-development',
    category: 'services',
    defaultTitle: 'Machine Learning Development Services | Altiora Infotech',
    defaultDescription: 'Custom machine learning development services for predictive analytics, automation, and intelligent business solutions.'
  },
  {
    path: '/services/ai-ml/natural-language-processing',
    defaultSlug: 'natural-language-processing',
    category: 'services',
    defaultTitle: 'Natural Language Processing Services | NLP Solutions',
    defaultDescription: 'Advanced NLP services for text analysis, chatbots, sentiment analysis, and language understanding applications.'
  },
  {
    path: '/services/ai-ml/computer-vision',
    defaultSlug: 'computer-vision-services',
    category: 'services',
    defaultTitle: 'Computer Vision Services - Image & Video Analysis',
    defaultDescription: 'Computer vision solutions for image recognition, object detection, and automated visual analysis applications.'
  },
  {
    path: '/services/ai-ml/deep-learning',
    defaultSlug: 'deep-learning-services',
    category: 'services',
    defaultTitle: 'Deep Learning Services - Neural Network Solutions',
    defaultDescription: 'Deep learning and neural network development for complex pattern recognition and AI-powered applications.'
  },

  // Web3 Services
  {
    path: '/services/web3',
    defaultSlug: 'web3-services',
    category: 'services',
    defaultTitle: 'Web3 Development Services - Blockchain & DeFi Solutions',
    defaultDescription: 'Complete Web3 development services including blockchain, DeFi, NFTs, and decentralized application development.'
  },
  {
    path: '/services/web3/blockchain-development-services-building-the-future-of-web3-with-altiora-infotech',
    defaultSlug: 'blockchain-development-services-building-the-future-of-web3-with-altiora-infotech',
    category: 'services',
    defaultTitle: 'Blockchain Development Services - Building the Future of Web3 | Altiora Infotech',
    defaultDescription: 'Expert blockchain development services for Web3 applications, smart contracts, and decentralized solutions. Build the future with Altiora Infotech.'
  },
  {
    path: '/services/web3/smart-contract-development',
    defaultSlug: 'smart-contract-development',
    category: 'services',
    defaultTitle: 'Smart Contract Development Services | Ethereum & Solidity',
    defaultDescription: 'Professional smart contract development services for Ethereum, Binance Smart Chain, and other blockchain platforms.'
  },
  {
    path: '/services/web3/defi-development',
    defaultSlug: 'defi-development-services',
    category: 'services',
    defaultTitle: 'DeFi Development Services - Decentralized Finance Solutions',
    defaultDescription: 'DeFi development services for decentralized exchanges, lending platforms, yield farming, and financial protocols.'
  },
  {
    path: '/services/web3/nft-marketplace-development',
    defaultSlug: 'nft-marketplace-development',
    category: 'services',
    defaultTitle: 'NFT Marketplace Development - Create Your NFT Platform',
    defaultDescription: 'Custom NFT marketplace development services with advanced features for trading, minting, and managing digital assets.'
  },
  {
    path: '/services/web3/dapp-development',
    defaultSlug: 'dapp-development-services',
    category: 'services',
    defaultTitle: 'DApp Development Services - Decentralized Applications',
    defaultDescription: 'Decentralized application development services for Web3 platforms with user-friendly interfaces and robust functionality.'
  },

  // Growth Engineering Services
  {
    path: '/services/growth-engineering',
    defaultSlug: 'growth-engineering-services',
    category: 'services',
    defaultTitle: 'Growth Engineering Services - Data-Driven Growth Solutions',
    defaultDescription: 'Growth engineering services combining data analytics, automation, and optimization for sustainable business growth.'
  },
  {
    path: '/services/growth-engineering/conversion-optimization',
    defaultSlug: 'conversion-optimization-services',
    category: 'services',
    defaultTitle: 'Conversion Rate Optimization Services | CRO Solutions',
    defaultDescription: 'Conversion rate optimization services to maximize your website performance and increase customer conversions.'
  },
  {
    path: '/services/growth-engineering/analytics-implementation',
    defaultSlug: 'analytics-implementation-services',
    category: 'services',
    defaultTitle: 'Analytics Implementation Services - Data Tracking Solutions',
    defaultDescription: 'Professional analytics implementation services for comprehensive data tracking and business intelligence insights.'
  },
  {
    path: '/services/growth-engineering/marketing-automation',
    defaultSlug: 'marketing-automation-services',
    category: 'services',
    defaultTitle: 'Marketing Automation Services - Streamline Your Marketing',
    defaultDescription: 'Marketing automation services to streamline campaigns, nurture leads, and optimize customer engagement workflows.'
  },
  {
    path: '/services/growth-engineering/ab-testing',
    defaultSlug: 'ab-testing-services',
    category: 'services',
    defaultTitle: 'A/B Testing Services - Optimize Your Conversions',
    defaultDescription: 'Professional A/B testing services to optimize user experience, increase conversions, and drive data-driven decisions.'
  },

  // Web Development Services
  {
    path: '/services/web-development',
    defaultSlug: 'web-development-services',
    category: 'services',
    defaultTitle: 'Web Development Services - Custom Web Solutions',
    defaultDescription: 'Professional web development services for custom websites, web applications, and digital solutions tailored to your business.'
  },
  {
    path: '/services/web-development/react-development',
    defaultSlug: 'react-development-services',
    category: 'services',
    defaultTitle: 'React Development Services - Modern Web Applications',
    defaultDescription: 'Expert React development services for building fast, scalable, and interactive web applications with modern UI/UX.'
  },
  {
    path: '/services/web-development/nextjs-development',
    defaultSlug: 'nextjs-development-services',
    category: 'services',
    defaultTitle: 'Next.js Development Services - Full-Stack React Solutions',
    defaultDescription: 'Next.js development services for server-side rendered applications, static sites, and full-stack React solutions.'
  },
  {
    path: '/services/web-development/nodejs-development',
    defaultSlug: 'nodejs-development-services',
    category: 'services',
    defaultTitle: 'Node.js Development Services - Backend Solutions',
    defaultDescription: 'Node.js development services for scalable backend applications, APIs, and server-side solutions.'
  },
  {
    path: '/services/web-development/ecommerce-development',
    defaultSlug: 'ecommerce-development-services',
    category: 'services',
    defaultTitle: 'E-commerce Development Services - Online Store Solutions',
    defaultDescription: 'Custom e-commerce development services for online stores, marketplaces, and digital commerce platforms.'
  },

  // Mobile Development Services
  {
    path: '/services/mobile-development',
    defaultSlug: 'mobile-development-services',
    category: 'services',
    defaultTitle: 'Mobile App Development Services - iOS & Android Apps',
    defaultDescription: 'Professional mobile app development services for iOS and Android platforms with native and cross-platform solutions.'
  },
  {
    path: '/services/mobile-development/react-native-development',
    defaultSlug: 'react-native-development-services',
    category: 'services',
    defaultTitle: 'React Native Development Services - Cross-Platform Apps',
    defaultDescription: 'React Native development services for cross-platform mobile applications with native performance and user experience.'
  },
  {
    path: '/services/mobile-development/flutter-development',
    defaultSlug: 'flutter-development-services',
    category: 'services',
    defaultTitle: 'Flutter Development Services - Cross-Platform Mobile Apps',
    defaultDescription: 'Flutter development services for beautiful, fast, and cross-platform mobile applications with single codebase.'
  },
  {
    path: '/services/mobile-development/ios-development',
    defaultSlug: 'ios-development-services',
    category: 'services',
    defaultTitle: 'iOS App Development Services - Native iPhone Apps',
    defaultDescription: 'Native iOS app development services for iPhone and iPad applications with optimal performance and user experience.'
  },
  {
    path: '/services/mobile-development/android-development',
    defaultSlug: 'android-development-services',
    category: 'services',
    defaultTitle: 'Android App Development Services - Native Android Apps',
    defaultDescription: 'Native Android app development services for smartphones and tablets with Google Play Store optimization.'
  },

  // Cloud Services
  {
    path: '/services/cloud-services',
    defaultSlug: 'cloud-services',
    category: 'services',
    defaultTitle: 'Cloud Services - AWS, Azure & Google Cloud Solutions',
    defaultDescription: 'Comprehensive cloud services including migration, deployment, and management on AWS, Azure, and Google Cloud platforms.'
  },
  {
    path: '/services/cloud-services/aws-development',
    defaultSlug: 'aws-development-services',
    category: 'services',
    defaultTitle: 'AWS Development Services - Amazon Web Services Solutions',
    defaultDescription: 'AWS development services for cloud infrastructure, serverless applications, and scalable cloud solutions on Amazon Web Services.'
  },
  {
    path: '/services/cloud-services/azure-development',
    defaultSlug: 'azure-development-services',
    category: 'services',
    defaultTitle: 'Azure Development Services - Microsoft Cloud Solutions',
    defaultDescription: 'Microsoft Azure development services for enterprise cloud applications, infrastructure, and digital transformation solutions.'
  },
  {
    path: '/services/cloud-services/google-cloud-development',
    defaultSlug: 'google-cloud-development-services',
    category: 'services',
    defaultTitle: 'Google Cloud Development Services - GCP Solutions',
    defaultDescription: 'Google Cloud Platform development services for scalable applications, data analytics, and machine learning solutions.'
  },
  {
    path: '/services/cloud-services/serverless-development',
    defaultSlug: 'serverless-development-services',
    category: 'services',
    defaultTitle: 'Serverless Development Services - Function-as-a-Service',
    defaultDescription: 'Serverless development services for cost-effective, scalable applications using AWS Lambda, Azure Functions, and Google Cloud Functions.'
  },

  // DevOps Services
  {
    path: '/services/devops',
    defaultSlug: 'devops-services',
    category: 'services',
    defaultTitle: 'DevOps Services - CI/CD & Infrastructure Automation',
    defaultDescription: 'DevOps services for continuous integration, deployment automation, infrastructure management, and development workflow optimization.'
  },
  {
    path: '/services/devops/ci-cd-implementation',
    defaultSlug: 'ci-cd-implementation-services',
    category: 'services',
    defaultTitle: 'CI/CD Implementation Services - Continuous Integration & Deployment',
    defaultDescription: 'CI/CD implementation services for automated testing, deployment pipelines, and continuous integration workflows.'
  },
  {
    path: '/services/devops/docker-kubernetes',
    defaultSlug: 'docker-kubernetes-services',
    category: 'services',
    defaultTitle: 'Docker & Kubernetes Services - Container Orchestration',
    defaultDescription: 'Docker and Kubernetes services for containerization, orchestration, and scalable microservices architecture.'
  },
  {
    path: '/services/devops/infrastructure-as-code',
    defaultSlug: 'infrastructure-as-code-services',
    category: 'services',
    defaultTitle: 'Infrastructure as Code Services - IaC Solutions',
    defaultDescription: 'Infrastructure as Code services using Terraform, CloudFormation, and other IaC tools for automated infrastructure management.'
  },

  // Data Services
  {
    path: '/services/data-services',
    defaultSlug: 'data-services',
    category: 'services',
    defaultTitle: 'Data Services - Analytics, Engineering & Science Solutions',
    defaultDescription: 'Comprehensive data services including data engineering, analytics, visualization, and data science solutions for business insights.'
  },
  {
    path: '/services/data-services/data-engineering',
    defaultSlug: 'data-engineering-services',
    category: 'services',
    defaultTitle: 'Data Engineering Services - ETL & Data Pipeline Solutions',
    defaultDescription: 'Data engineering services for ETL processes, data pipelines, data warehousing, and big data processing solutions.'
  },
  {
    path: '/services/data-services/data-analytics',
    defaultSlug: 'data-analytics-services',
    category: 'services',
    defaultTitle: 'Data Analytics Services - Business Intelligence Solutions',
    defaultDescription: 'Data analytics services for business intelligence, reporting, dashboard creation, and data-driven decision making.'
  },
  {
    path: '/services/data-services/data-visualization',
    defaultSlug: 'data-visualization-services',
    category: 'services',
    defaultTitle: 'Data Visualization Services - Interactive Dashboards',
    defaultDescription: 'Data visualization services for interactive dashboards, charts, and visual analytics using modern visualization tools.'
  },

  // UI/UX Design Services
  {
    path: '/services/ui-ux-design',
    defaultSlug: 'ui-ux-design-services',
    category: 'services',
    defaultTitle: 'UI/UX Design Services - User Experience & Interface Design',
    defaultDescription: 'Professional UI/UX design services for web and mobile applications with focus on user experience and modern design principles.'
  },
  {
    path: '/services/ui-ux-design/web-design',
    defaultSlug: 'web-design-services',
    category: 'services',
    defaultTitle: 'Web Design Services - Modern Website Design',
    defaultDescription: 'Creative web design services for modern, responsive, and user-friendly websites that engage and convert visitors.'
  },
  {
    path: '/services/ui-ux-design/mobile-app-design',
    defaultSlug: 'mobile-app-design-services',
    category: 'services',
    defaultTitle: 'Mobile App Design Services - iOS & Android UI/UX',
    defaultDescription: 'Mobile app design services for iOS and Android applications with intuitive user interfaces and exceptional user experience.'
  },
  {
    path: '/services/ui-ux-design/user-research',
    defaultSlug: 'user-research-services',
    category: 'services',
    defaultTitle: 'User Research Services - UX Research & Testing',
    defaultDescription: 'User research services including usability testing, user interviews, and UX research for data-driven design decisions.'
  },

  // Blog pages (examples)
  {
    path: '/blog',
    defaultSlug: 'blog',
    category: 'blog',
    defaultTitle: 'Blog - Latest Insights on AI, Web3 & Technology | Altiora Infotech',
    defaultDescription: 'Stay updated with the latest insights, trends, and tutorials on AI, Web3, blockchain, and modern technology from Altiora Infotech experts.'
  },
  {
    path: '/blog/ai-trends-2024',
    defaultSlug: 'ai-trends-2024',
    category: 'blog',
    defaultTitle: 'AI Trends 2024 - Future of Artificial Intelligence',
    defaultDescription: 'Explore the top AI trends for 2024 and discover how artificial intelligence is shaping the future of business and technology.'
  },
  {
    path: '/blog/web3-development-guide',
    defaultSlug: 'web3-development-guide',
    category: 'blog',
    defaultTitle: 'Web3 Development Guide - Complete Beginner\'s Tutorial',
    defaultDescription: 'Complete guide to Web3 development covering blockchain, smart contracts, DeFi, and decentralized application development.'
  },
  {
    path: '/blog/blockchain-business-benefits',
    defaultSlug: 'blockchain-business-benefits',
    category: 'blog',
    defaultTitle: 'Blockchain Business Benefits - Transform Your Enterprise',
    defaultDescription: 'Discover how blockchain technology can transform your business with improved security, transparency, and operational efficiency.'
  },

  // Additional pages
  {
    path: '/privacy-policy',
    defaultSlug: 'privacy-policy',
    category: 'other',
    defaultTitle: 'Privacy Policy - Altiora Infotech',
    defaultDescription: 'Privacy policy for Altiora Infotech outlining how we collect, use, and protect your personal information and data.'
  },
  {
    path: '/terms-of-service',
    defaultSlug: 'terms-of-service',
    category: 'other',
    defaultTitle: 'Terms of Service - Altiora Infotech',
    defaultDescription: 'Terms of service for Altiora Infotech services including usage guidelines, limitations, and legal agreements.'
  },
  {
    path: '/sitemap',
    defaultSlug: 'sitemap',
    category: 'other',
    defaultTitle: 'Sitemap - Altiora Infotech Website Navigation',
    defaultDescription: 'Complete sitemap of Altiora Infotech website with links to all pages, services, and resources for easy navigation.'
  }
];

// Helper functions for working with predefined pages
export const getPredefinedPageByPath = (path: string): PredefinedPage | undefined => {
  return PREDEFINED_PAGES.find(page => page.path === path);
};

export const getPredefinedPageBySlug = (slug: string): PredefinedPage | undefined => {
  return PREDEFINED_PAGES.find(page => page.defaultSlug === slug);
};

export const getPredefinedPagesByCategory = (category: string): PredefinedPage[] => {
  return PREDEFINED_PAGES.filter(page => page.category === category);
};

export const getAllPredefinedPaths = (): string[] => {
  return PREDEFINED_PAGES.map(page => page.path);
};

export const getAllPredefinedSlugs = (): string[] => {
  return PREDEFINED_PAGES.map(page => page.defaultSlug);
};