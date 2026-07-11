const SITE_URL = 'https://swimsight3d.com';

export function homeStructuredData() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Swim Sight 3D',
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      areaServed: 'AU',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Swim Sight 3D',
      url: SITE_URL,
      description: 'Coach-led swim video review software for coaches and clubs.',
      inLanguage: 'en-AU',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Swim Sight 3D',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: 'Coach-led swim video review software that helps swim coaches review video, mark key moments, add coach findings, assign drills, and create swimmer improvement reports.',
    },
  ];
}

export function faqStructuredData(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

export function breadcrumbStructuredData(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
