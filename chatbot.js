// Edwards & Gray AI Chatbot with Gemini API Integration
class EdwardsGrayAI {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.clearButton = document.getElementById('clearChat');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        
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
            requirements: []
        };
        
        this.isTyping = false;
        
        this.initializeEventListeners();
        this.initializeChat();
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
        
        return `You are an AI assistant for Edwards & Gray Estate Agents in Solihull, UK. You are friendly, professional, and knowledgeable about the local property market.

Your primary goals are to:
1. Gather lead information from potential buyers
2. Provide helpful property search assistance
3. Suggest relevant properties based on their criteria
4. Schedule viewings and connect them with the team

IMPORTANT INFORMATION TO COLLECT:
- Full Name
- Email Address
- Phone Number
- Location of Interest (areas in/around Solihull)
- Budget Range
- Property Type (New Build/Existing)
- Buyer Type (Mortgage/Cash)
- Preferred Call Back Time
- Preferred Viewing Days & Times
- Specific Requirements (bedrooms, bathrooms, garden, etc.)

CURRENT USER INFORMATION:
${userInfo}

PROPERTY KNOWLEDGE:
- Solihull is a desirable area with excellent schools and transport links
- Popular areas include Dorridge, Knowle, Shirley, and Solihull town center
- Price ranges typically: £200k-£400k (apartments/small houses), £400k-£800k (family homes), £800k+ (luxury properties)
- New developments are available in several areas
- Good transport links to Birmingham city center

CONVERSATION STYLE:
- Be conversational and friendly
- Ask follow-up questions naturally
- Provide specific property suggestions when you have enough information
- If you don't have specific property listings, create realistic examples based on the area and budget
- Always offer to connect them with a human agent for viewings
- Use Edwards & Gray branding (professional but approachable)

RESPONSE FORMAT:
- Keep responses conversational and not too long
- Use bullet points for property features
- Include specific addresses when suggesting properties (make them realistic for Solihull)
- Always end with a question or call-to-action

Remember: You're representing Edwards & Gray Estate Agents, so maintain professionalism while being helpful and personable.`;
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
                requirements: []
            };
            this.initializeChat();
        }
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EdwardsGrayAI();
});
