// Edwards & Gray AI Chatbot with Gemini API Integration
class EdwardsGrayAI {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.clearButton = document.getElementById('clearChat');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.buyerProfilePanel = document.getElementById('buyerProfile');
        this.requestCallback = document.getElementById('requestCallback');
        
        this.conversationHistory = [];
        this.userProfile = {
            name: null,
            email: null,
            phone: null,
            location: null,
            budget: null,
            propertyType: null,
            buyerType: null,
            preferredCallTime: null,
            viewingDays: [],
            requirements: [],
            bedrooms: null,
            maxPrice: null,
            minPrice: null,
            urgency: null
        };
        
        this.isTyping = false;
        this.profileFields = ['name', 'email', 'phone', 'location', 'budget', 'propertyType', 'buyerType', 'bedrooms'];
        
        this.initializeEventListeners();
        this.initializeChat();
        this.updateBuyerProfile();
    }
    
    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        this.clearButton.addEventListener('click', () => this.clearChat());
        this.requestCallback.addEventListener('click', () => this.handleCallbackRequest());
        
        // Auto-resize input
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = this.userInput.scrollHeight + 'px';
        });
    }
    
    initializeChat() {
        this.addMessage('ai', `Hello! I'm your Edwards & Gray AI assistant. I'm here to help you find the perfect property in Solihull.

I can help you with:
• Finding properties that match your criteria
• Providing area information and market insights
• Scheduling viewings
• Connecting you with our experienced team

To get started, could you tell me a bit about yourself? Your name would be great!`);
    }
    
    async handleSendMessage() {
        const message = this.userInput.value.trim();
        if (!message || this.isTyping) return;
        
        this.addMessage('user', message);
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        
        this.showTypingIndicator();
        
        try {
            const response = await this.callGeminiAPI(message);
            this.hideTypingIndicator();
            this.addMessage('ai', response);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('ai', `I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment, or feel free to call our office directly at 0121 XXX XXXX for immediate assistance.`);
            console.error('API Error:', error);
        }
    }
    
    async callGeminiAPI(userMessage) {
        // Update conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        // Extract information from user message
        this.extractUserInformation(userMessage);
        
        // Build system prompt with context
        const systemPrompt = this.buildSystemPrompt();
        
        // Prepare the request payload
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: systemPrompt + "\\n\\nUser: " + userMessage
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
        
        // Use Netlify function for secure API calls
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Add AI response to conversation history
        this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
        
        return aiResponse;
    }
    
    buildSystemPrompt() {
        const userInfo = this.getUserInfoString();
        const missingInfo = this.getMissingRequiredInfo();
        const conversationContext = this.getConversationContext();
        
        return `You are an AI Estate Agent Expert working for Edwards & Gray Estate Agents in Solihull, UK. You're a property specialist with deep knowledge of the local market.

Your role:
- Expert property consultant and market advisor
- Lead generation specialist
- Viewing coordinator
- Customer relationship manager

IMPORTANT BEHAVIOR RULES:
1. NEVER repeat questions about information you already have
2. Only ask for missing essential information naturally in conversation
3. When suggesting properties, ALWAYS include realistic viewing links
4. Be proactive - suggest properties when you have enough information
5. Act as a knowledgeable local expert, not just a generic assistant

CURRENT USER PROFILE:
${userInfo}

STILL NEEDED: ${missingInfo}

CONVERSATION CONTEXT:
${conversationContext}

PROPERTY SUGGESTIONS FORMAT:
When suggesting properties, use this format:
**Property Name**
£Price | Address
• Feature 1
• Feature 2
• Feature 3

[View Property](https://edwardsandgray.co.uk/property/?id=[property_id]&e=[property_key]) | [Book Viewing](https://edwardsandgray.co.uk/property/?id=[property_id]&e=[property_key])

IMPORTANT: Replace [property_id] and [property_key] with the actual property ID and key.

EXAMPLE EDWARDS & GRAY PROPERTIES TO SUGGEST:

1. **The Maltings, Dorridge** - £675,000 | Dorridge Road, Solihull
   Property ID: 1365357, Key: 6fc55bb2b190d060d9869a5f5453d084
   • 4 bedrooms, 3 bathrooms
   • Modern kitchen with island
   • Private garden and driveway

2. **Knowle Village House** - £485,000 | High Street, Knowle
   Property ID: 1234567, Key: abc123def456ghi789jkl012mno345pqr
   • 3 bedrooms, 2 bathrooms
   • Period features throughout
   • Walking distance to station

3. **New Build Executive Home** - £550,000 | Mill Lane, Cheswick Green
   Property ID: 9876543, Key: xyz987wvu654tsr321qpo098nml876kji
   • 4 bedrooms, 2 bathrooms
   • Energy efficient design
   • Two car garage

USE THESE REAL PROPERTY IDs AND KEYS when suggesting properties that match user criteria.

LOCAL MARKET EXPERTISE:
- Solihull: Premium suburb, excellent schools (£300k-£800k+)
- Dorridge: Village feel, great transport links (£400k-£1M+)
- Knowle: Historic village, family-friendly (£350k-£750k)
- Shirley: Affordable, good amenities (£200k-£500k)
- Dickens Heath: Modern development, young families (£250k-£600k)
- Cheswick Green: New builds, commuter-friendly (£300k-£650k)

EXPERT CONVERSATION STYLE:
- Speak as a property market expert, not a generic assistant
- Provide specific local insights and market knowledge
- Be confident about property values and areas
- Only ask for missing information when naturally relevant
- Focus on helping them find the right property, not just collecting data
- Use phrases like "Based on your requirements..." or "Given your budget..."

REMEMBER: You're Edwards & Gray's property expert - be knowledgeable, confident, and genuinely helpful!`;
    }
    
    getUserInfoString() {
        const info = [];
        Object.entries(this.userProfile).forEach(([key, value]) => {
            if (value && value !== null) {
                if (Array.isArray(value) && value.length > 0) {
                    info.push(`${key}: ${value.join(', ')}`);
                } else if (!Array.isArray(value)) {
                    info.push(`${key}: ${value}`);
                }
            }
        });
        return info.length > 0 ? info.join('\\n') : 'No information collected yet';
    }
    
    extractUserInformation(message) {
        const lowerMessage = message.toLowerCase();
        
        // Extract name patterns
        const namePatterns = [
            /my name is ([a-zA-Z\s]+)/i,
            /i'm ([a-zA-Z\s]+)/i,
            /i am ([a-zA-Z\s]+)/i,
            /call me ([a-zA-Z\s]+)/i
        ];
        
        namePatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match && !this.userProfile.name) {
                this.userProfile.name = match[1].trim();
            }
        });
        
        // Extract email
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
        const emailMatch = message.match(emailPattern);
        if (emailMatch) {
            this.userProfile.email = emailMatch[1];
        }
        
        // Extract phone
        const phonePattern = /(07\d{9}|01\d{8,9}|\+44\d{10,11})/;
        const phoneMatch = message.match(phonePattern);
        if (phoneMatch) {
            this.userProfile.phone = phoneMatch[1];
        }
        
        // Extract budget information
        const budgetPatterns = [
            /budget.*?£?(\d+)k?/i,
            /up to.*?£?(\d+)k?/i,
            /around.*?£?(\d+)k?/i,
            /£(\d+)k?/i
        ];
        
        budgetPatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match && !this.userProfile.budget) {
                let budget = parseInt(match[1]);
                if (budget < 1000) budget *= 1000; // Convert k to full number
                this.userProfile.budget = `£${budget.toLocaleString()}`;
            }
        });
        
        // Extract property type
        if (lowerMessage.includes('new build')) {
            this.userProfile.propertyType = 'new build';
        } else if (lowerMessage.includes('existing') || lowerMessage.includes('resale')) {
            this.userProfile.propertyType = 'existing';
        }
        
        // Extract buyer type
        if (lowerMessage.includes('cash buyer') || lowerMessage.includes('buying with cash')) {
            this.userProfile.buyerType = 'cash';
        } else if (lowerMessage.includes('mortgage') || lowerMessage.includes('financing')) {
            this.userProfile.buyerType = 'mortgage';
        }
        
        // Extract location preferences
        const solihullAreas = ['dorridge', 'knowle', 'shirley', 'solihull', 'dickens heath', 'cheswick green'];
        solihullAreas.forEach(area => {
            if (lowerMessage.includes(area)) {
                if (!this.userProfile.location) {
                    this.userProfile.location = area;
                } else if (!this.userProfile.location.includes(area)) {
                    this.userProfile.location += `, ${area}`;
                }
            }
        });
        
        // Extract bedroom requirements
        const bedroomPatterns = [
            /(\d+)\s*bed/i,
            /(\d+)\s*bedroom/i,
            /(one|two|three|four|five)\s*bed/i
        ];
        
        bedroomPatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match && !this.userProfile.bedrooms) {
                let beds = match[1];
                if (beds === 'one') beds = '1';
                if (beds === 'two') beds = '2';
                if (beds === 'three') beds = '3';
                if (beds === 'four') beds = '4';
                if (beds === 'five') beds = '5';
                this.userProfile.bedrooms = beds;
            }
        });
        
        // Update buyer profile display after extraction
        this.updateBuyerProfile();
    }
    
    getMissingRequiredInfo() {
        const required = ['name', 'location', 'budget'];
        const missing = required.filter(field => !this.userProfile[field]);
        return missing.length > 0 ? missing.join(', ') : 'All essential information collected';
    }
    
    getConversationContext() {
        const recentMessages = this.conversationHistory.slice(-4);
        return recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }
    
    updateBuyerProfile() {
        const profile = this.buyerProfilePanel;
        const profileItems = [];
        
        // Build profile display
        if (this.userProfile.name) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Name:</strong> ${this.userProfile.name}</span></div>`);
        }
        
        if (this.userProfile.email) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Email:</strong> ${this.userProfile.email}</span></div>`);
        }
        
        if (this.userProfile.phone) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Phone:</strong> ${this.userProfile.phone}</span></div>`);
        }
        
        if (this.userProfile.location) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Location:</strong> ${this.userProfile.location}</span></div>`);
        }
        
        if (this.userProfile.budget) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Budget:</strong> ${this.userProfile.budget}</span></div>`);
        }
        
        if (this.userProfile.propertyType) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Property Type:</strong> ${this.userProfile.propertyType}</span></div>`);
        }
        
        if (this.userProfile.buyerType) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Buyer Type:</strong> ${this.userProfile.buyerType}</span></div>`);
        }
        
        if (this.userProfile.bedrooms) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Bedrooms:</strong> ${this.userProfile.bedrooms}</span></div>`);
        }
        
        if (this.userProfile.preferredCallTime) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Call Time:</strong> ${this.userProfile.preferredCallTime}</span></div>`);
        }
        
        if (this.userProfile.urgency) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Urgency:</strong> ${this.userProfile.urgency}</span></div>`);
        }
        
        if (this.userProfile.requirements && this.userProfile.requirements.length > 0) {
            profileItems.push(`<div class="flex items-center space-x-2"><span class="text-green-600">✓</span><span><strong>Requirements:</strong> ${this.userProfile.requirements.join(', ')}</span></div>`);
        }
        
        if (profileItems.length === 0) {
            profile.innerHTML = '<div class="text-sm text-gray-500 italic">Tell me about yourself to build your profile...</div>';
        } else {
            profile.innerHTML = profileItems.join('');
        }
        
        
        // Enable callback button if enough info is provided
        if (this.userProfile.name && this.userProfile.phone) {
            this.requestCallback.disabled = false;
        }
    }
    
    addMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${sender}-message p-4 rounded-2xl animate-fade-in`;
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="flex items-end justify-end space-x-2">
                    <div class="text-sm">${this.formatMessage(message)}</div>
                    <div class="bg-white bg-opacity-20 rounded-full p-1 flex-shrink-0">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="bg-orange rounded-full p-2 flex-shrink-0">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                    </div>
                    <div class="text-sm flex-1">${this.formatMessage(message)}</div>
                </div>
            `;
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(message) {
        // Convert line breaks to HTML
        message = message.replace(/\n/g, '<br>');
        
        // Format bullet points
        message = message.replace(/^• /gm, '<span class="inline-block w-2 h-2 bg-current rounded-full mr-2"></span>');
        
        
        // Format property links
        message = message.replace(/\[View Property\]\(([^)]+)\)/g, '<a href="$1" target="_blank" class="inline-block bg-navy text-white px-4 py-2 rounded-md hover:bg-navy-light transition-colors mr-2">View Property</a>');
        message = message.replace(/\[Book Viewing\]\(([^)]+)\)/g, '<a href="$1" target="_blank" class="inline-block bg-orange text-white px-4 py-2 rounded-md hover:bg-orange-light transition-colors">Book Viewing</a>');
        
        // Format property listings (basic formatting)
        message = message.replace(/£(\d+,?\d*)/g, '<span class="font-semibold text-orange">£$1</span>');
        
        // Format addresses or locations
        message = message.replace(/\b([A-Z][a-z]+ (?:Road|Street|Avenue|Lane|Drive|Close|Way|Place|Gardens|Park|Hill|Green|Court|Manor|Grove|Rise|View|Walk|Crescent|Square|Terrace|Mews))\b/g, 
            '<span class="font-medium">$1</span>');
        
        return message;
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        this.sendButton.disabled = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message-bubble ai-message p-4 rounded-2xl animate-fade-in';
        typingDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="bg-orange rounded-full p-2 flex-shrink-0">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                </div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <span class="ml-2 text-sm text-gray-500">AI is typing...</span>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        this.sendButton.disabled = false;
        
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    handleCallbackRequest() {
        if (this.userProfile.name && this.userProfile.phone) {
            this.addMessage('ai', `Thank you ${this.userProfile.name}! I've scheduled a callback request for you. One of our experienced property consultants will call you on ${this.userProfile.phone} within the next 2 hours to discuss your property requirements in detail.\n\nIn the meantime, feel free to continue our conversation - I'm here to help!`);
            
            // In a real application, you would send this data to your CRM or callback system
            console.log('Callback requested for:', this.userProfile);
        } else {
            this.addMessage('ai', 'I need your name and phone number to schedule a callback. Could you please provide these details?');
        }
    }
    
    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.chatContainer.innerHTML = '';
            this.conversationHistory = [];
            this.userProfile = {
                name: null,
                email: null,
                phone: null,
                location: null,
                budget: null,
                propertyType: null,
                buyerType: null,
                preferredCallTime: null,
                viewingDays: [],
                requirements: [],
                bedrooms: null,
                maxPrice: null,
                minPrice: null,
                urgency: null
            };
            this.initializeChat();
            this.updateBuyerProfile();
        }
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EdwardsGrayAI();
});
