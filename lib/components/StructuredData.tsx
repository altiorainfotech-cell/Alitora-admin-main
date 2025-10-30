'use client';

import { useEffect } from 'react';

interface StructuredDataProps {
  data: object;
  id?: string;
}

/**
 * StructuredData Component
 * Injects JSON-LD structured data into the page head
 */
export function StructuredData({ data, id = 'structured-data' }: StructuredDataProps) {
  useEffect(() => {
    // Create script element for structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(data, null, 2);
    
    // Remove existing structured data with same ID
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
    
    // Add new structured data to head
    document.head.appendChild(script);
    
    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data, id]);
  
  return null; // This component doesn't render anything visible
}

/**
 * Multiple Structured Data Component
 * Handles multiple structured data objects
 */
interface MultipleStructuredDataProps {
  dataArray: Array<{ data: object; id?: string }>;
}

export function MultipleStructuredData({ dataArray }: MultipleStructuredDataProps) {
  return (
    <>
      {dataArray.map((item, index) => (
        <StructuredData
          key={item.id || `structured-data-${index}`}
          data={item.data}
          id={item.id || `structured-data-${index}`}
        />
      ))}
    </>
  );
}

/**
 * SEO Head Component
 * Combines metadata and structured data for complete SEO setup
 */
interface SEOHeadProps {
  structuredData?: object | object[];
  children?: React.ReactNode;
}

export function SEOHead({ structuredData, children }: SEOHeadProps) {
  return (
    <>
      {structuredData && (
        Array.isArray(structuredData) ? (
          <MultipleStructuredData 
            dataArray={structuredData.map((data, index) => ({ 
              data, 
              id: `structured-data-${index}` 
            }))} 
          />
        ) : (
          <StructuredData data={structuredData} />
        )
      )}
      {children}
    </>
  );
}