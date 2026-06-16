import React from 'react';

export default function StructuredData({ data }) {
  if (!data) {
    return null;
  }

  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={`${item['@type'] || 'schema'}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
