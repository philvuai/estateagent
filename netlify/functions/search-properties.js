import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Fallback properties for when live search fails
const fallbackProperties = [
  {
    id: 'prop_001',
    title: 'Modern 2-Bedroom Apartment in City Centre',
    price: 250000,
    location: 'Manchester City Centre',
    bedrooms: 2,
    bathrooms: 1,
    property_type: 'Apartment',
    description: 'Stunning modern apartment with city views, perfect for young professionals.',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    viewing_url: 'https://edwardsandgray.co.uk/property/modern-2-bedroom-apartment-city-centre',
    contact_url: 'https://edwardsandgray.co.uk/contact?property=prop_001'
  },
  {
    id: 'prop_002',
    title: 'Victorian Family Home with Garden',
    price: 450000,
    location: 'Didsbury, Manchester',
    bedrooms: 4,
    bathrooms: 2,
    property_type: 'House',
    description: 'Beautiful Victorian family home with large garden and period features.',
    image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
    viewing_url: 'https://edwardsandgray.co.uk/property/victorian-family-home-didsbury',
    contact_url: 'https://edwardsandgray.co.uk/contact?property=prop_002'
  },
  {
    id: 'prop_003',
    title: 'Luxury 3-Bedroom Penthouse',
    price: 750000,
    location: 'Salford Quays',
    bedrooms: 3,
    bathrooms: 2,
    property_type: 'Penthouse',
    description: 'Exceptional penthouse with panoramic views and luxury finishes.',
    image_url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&h=300&fit=crop',
    viewing_url: 'https://edwardsandgray.co.uk/property/luxury-3-bedroom-penthouse-salford',
    contact_url: 'https://edwardsandgray.co.uk/contact?property=prop_003'
  },
  {
    id: 'prop_004',
    title: 'Charming 1-Bedroom Cottage',
    price: 180000,
    location: 'Wilmslow, Cheshire',
    bedrooms: 1,
    bathrooms: 1,
    property_type: 'Cottage',
    description: 'Cozy cottage perfect for first-time buyers or investment.',
    image_url: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=300&fit=crop',
    viewing_url: 'https://edwardsandgray.co.uk/property/charming-1-bedroom-cottage-wilmslow',
    contact_url: 'https://edwardsandgray.co.uk/contact?property=prop_004'
  },
  {
    id: 'prop_005',
    title: 'Contemporary 5-Bedroom Executive Home',
    price: 850000,
    location: 'Altrincham, Greater Manchester',
    bedrooms: 5,
    bathrooms: 3,
    property_type: 'House',
    description: 'Stunning executive home with modern amenities and spacious living.',
    image_url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop',
    viewing_url: 'https://edwardsandgray.co.uk/property/contemporary-5-bedroom-executive-altrincham',
    contact_url: 'https://edwardsandgray.co.uk/contact?property=prop_005'
  }
];

async function scrapeEdwardsGrayProperties(criteria) {
  try {
    console.log('Attempting to scrape Edwards & Gray properties...');
    
    // Try to fetch the Edwards & Gray property search page
    const searchUrl = 'https://edwardsandgray.co.uk/properties';
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      console.log('Edwards & Gray site not accessible, using fallback data');
      return filterFallbackProperties(criteria);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const properties = [];
    
    // Try to extract property listings from the page
    // This is a generic scraper - you may need to adjust selectors based on actual site structure
    $('.property-item, .property-card, .listing-item').each((i, element) => {
      const $elem = $(element);
      
      const title = $elem.find('.property-title, .title, h3, h4').first().text().trim();
      const priceText = $elem.find('.price, .property-price').first().text().trim();
      const location = $elem.find('.location, .address').first().text().trim();
      const bedrooms = extractNumber($elem.find('.bedrooms, .bed').first().text());
      const bathrooms = extractNumber($elem.find('.bathrooms, .bath').first().text());
      
      // Extract price number
      const priceMatch = priceText.match(/£?([0-9,]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      
      // Get property link
      const propertyLink = $elem.find('a').first().attr('href');
      const fullPropertyUrl = propertyLink ? 
        (propertyLink.startsWith('http') ? propertyLink : `https://edwardsandgray.co.uk${propertyLink}`) : 
        'https://edwardsandgray.co.uk/properties';
      
      // Get image
      const imageUrl = $elem.find('img').first().attr('src') || 
                      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop';
      
      if (title && price > 0) {
        properties.push({
          id: `live_${i + 1}`,
          title,
          price,
          location,
          bedrooms: bedrooms || 0,
          bathrooms: bathrooms || 0,
          property_type: determinePropertyType(title),
          description: `${title} in ${location}`,
          image_url: imageUrl.startsWith('http') ? imageUrl : `https://edwardsandgray.co.uk${imageUrl}`,
          viewing_url: fullPropertyUrl,
          contact_url: `https://edwardsandgray.co.uk/contact?property=live_${i + 1}`
        });
      }
    });
    
    console.log(`Found ${properties.length} properties from live scraping`);
    
    if (properties.length === 0) {
      console.log('No properties found from scraping, using fallback');
      return filterFallbackProperties(criteria);
    }
    
    return filterProperties(properties, criteria);
    
  } catch (error) {
    console.error('Error scraping Edwards & Gray:', error);
    return filterFallbackProperties(criteria);
  }
}

function extractNumber(text) {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function determinePropertyType(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('apartment') || lowerTitle.includes('flat')) return 'Apartment';
  if (lowerTitle.includes('house')) return 'House';
  if (lowerTitle.includes('cottage')) return 'Cottage';
  if (lowerTitle.includes('penthouse')) return 'Penthouse';
  if (lowerTitle.includes('bungalow')) return 'Bungalow';
  return 'Property';
}

function filterProperties(properties, criteria) {
  return properties.filter(property => {
    // Price filter
    if (criteria.maxPrice && property.price > criteria.maxPrice) return false;
    if (criteria.minPrice && property.price < criteria.minPrice) return false;
    
    // Location filter
    if (criteria.location && !property.location.toLowerCase().includes(criteria.location.toLowerCase())) return false;
    
    // Bedrooms filter
    if (criteria.bedrooms && property.bedrooms < criteria.bedrooms) return false;
    
    // Property type filter
    if (criteria.property_type && !property.property_type.toLowerCase().includes(criteria.property_type.toLowerCase())) return false;
    
    return true;
  });
}

function filterFallbackProperties(criteria) {
  return filterProperties(fallbackProperties, criteria);
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const criteria = JSON.parse(event.body);
    console.log('Search criteria:', criteria);
    
    // Attempt to scrape live properties
    const properties = await scrapeEdwardsGrayProperties(criteria);
    
    // Limit results to top 5 most relevant
    const limitedProperties = properties.slice(0, 5);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        properties: limitedProperties,
        total: limitedProperties.length,
        source: limitedProperties.length > 0 && limitedProperties[0].id.startsWith('live_') ? 'live' : 'fallback'
      })
    };
    
  } catch (error) {
    console.error('Error in search-properties function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
