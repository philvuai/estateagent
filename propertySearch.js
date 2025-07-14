// Edwards & Gray Property Search Integration
class PropertySearch {
    constructor() {
        this.baseUrl = 'https://edwardsandgray.co.uk';
        this.searchEndpoint = '/properties/search';
    }

    // Search properties based on user criteria
    async searchProperties(criteria) {
        try {
            // Build search parameters from user criteria
            const params = this.buildSearchParams(criteria);
            
            // For now, we'll use a proxy/server to avoid CORS issues
            // In production, this would be handled by your backend
            const response = await this.fetchPropertiesFromSite(params);
            
            return this.parsePropertyResults(response);
        } catch (error) {
            console.error('Error searching properties:', error);
            return [];
        }
    }

    // Build search parameters from user profile
    buildSearchParams(userProfile) {
        const params = new URLSearchParams();
        
        // Price range
        if (userProfile.budget) {
            const budget = this.parseBudget(userProfile.budget);
            params.append('max_price', budget);
            params.append('min_price', Math.max(0, budget - 100000)); // 100k below max
        }
        
        // Location
        if (userProfile.location) {
            params.append('location', userProfile.location);
        }
        
        // Bedrooms
        if (userProfile.bedrooms) {
            params.append('bedrooms', userProfile.bedrooms);
        }
        
        // Property type
        if (userProfile.propertyType) {
            params.append('property_type', userProfile.propertyType);
        }
        
        return params;
    }

    // Parse budget string to number
    parseBudget(budgetString) {
        const cleanBudget = budgetString.replace(/[£,]/g, '');
        return parseInt(cleanBudget);
    }

    // Fetch properties from Edwards & Gray website
    async fetchPropertiesFromSite(params) {
        // Since we can't directly scrape due to CORS, we'll create a server endpoint
        // For now, let's simulate this with a function that would call your backend
        
        const searchUrl = `${this.baseUrl}/properties?${params.toString()}`;
        
        try {
            // This would normally be a fetch to your backend that scrapes the site
            const response = await fetch('/api/search-properties', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    searchUrl: searchUrl,
                    criteria: Object.fromEntries(params)
                })
            });
            
            if (!response.ok) {
                throw new Error('Search request failed');
            }
            
            return await response.json();
        } catch (error) {
            console.warn('Live search unavailable, using fallback data');
            return this.getFallbackProperties(params);
        }
    }

    // Parse property results from Edwards & Gray
    parsePropertyResults(data) {
        if (!data || !data.properties) {
            return [];
        }

        return data.properties.map(property => ({
            id: property.id,
            title: property.title,
            price: property.price,
            address: property.address,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            features: property.features || [],
            images: property.images || [],
            url: `https://edwardsandgray.co.uk/property/?id=${property.id}&e=${property.encryption_key}`,
            description: property.description
        }));
    }

    // Fallback properties when live search isn't available
    getFallbackProperties(params) {
        const budget = params.get('max_price') ? parseInt(params.get('max_price')) : 1000000;
        const location = params.get('location') || '';
        const bedrooms = params.get('bedrooms') || '';

        // Return properties that match criteria
        const allProperties = [
            {
                id: '1365357',
                encryption_key: '6fc55bb2b190d060d9869a5f5453d084',
                title: 'The Maltings, Dorridge',
                price: 675000,
                address: 'Dorridge Road, Solihull',
                bedrooms: 4,
                bathrooms: 3,
                features: ['Modern kitchen with island', 'Private garden and driveway', 'Double garage'],
                description: 'A stunning modern family home in the heart of Dorridge'
            },
            {
                id: '1234567',
                encryption_key: 'abc123def456ghi789jkl012mno345pqr',
                title: 'Knowle Village House',
                price: 485000,
                address: 'High Street, Knowle',
                bedrooms: 3,
                bathrooms: 2,
                features: ['Period features throughout', 'Walking distance to station', 'Character property'],
                description: 'Charming period property in the heart of Knowle village'
            },
            {
                id: '9876543',
                encryption_key: 'xyz987wvu654tsr321qpo098nml876kji',
                title: 'New Build Executive Home',
                price: 550000,
                address: 'Mill Lane, Cheswick Green',
                bedrooms: 4,
                bathrooms: 2,
                features: ['Energy efficient design', 'Two car garage', 'Modern appliances'],
                description: 'Contemporary new build home with all modern conveniences'
            }
        ];

        // Filter properties based on criteria
        const filteredProperties = allProperties.filter(property => {
            // Price filter
            if (budget && property.price > budget) return false;
            
            // Location filter
            if (location && !property.address.toLowerCase().includes(location.toLowerCase())) return false;
            
            // Bedrooms filter
            if (bedrooms && property.bedrooms < parseInt(bedrooms)) return false;
            
            return true;
        });
        
        return { properties: filteredProperties };
    }

    // Format properties for AI response
    formatPropertiesForAI(properties) {
        if (!properties || properties.length === 0) {
            return "I couldn't find any properties matching your criteria at the moment. Let me adjust the search parameters or contact our office for more options.";
        }

        return properties.map(property => {
            return `**${property.title}**
£${property.price.toLocaleString()} | ${property.address}
• ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms
${property.features.map(f => `• ${f}`).join('\n')}

[View Property](${property.url}) | [Book Viewing](${property.url})`;
        }).join('\n\n');
    }
}

// Export for use in main chatbot
window.PropertySearch = PropertySearch;
