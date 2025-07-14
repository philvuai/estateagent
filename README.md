# 🏠 Edwards & Gray AI Chatbot

> **🔒 SECURE VERSION** - API key protection implemented

An intelligent AI-powered chatbot for Edwards & Gray Estate Agents that helps capture leads and suggest properties using Google's Gemini API.

## ✅ **SECURITY CLEARED**
- ❌ **NO API KEYS** in code or Git history
- ✅ **Environment variables** for all secrets
- ✅ **Netlify Functions** for secure API calls
- ✅ **CORS protection** and security headers

## 🚀 Features

- **AI-Powered Conversations**: Uses Google Gemini 2.0 Flash for intelligent responses
- **Lead Capture**: Automatically extracts and stores customer information
- **Property Suggestions**: Provides personalized property recommendations
- **Edwards & Gray Branding**: Custom styling with navy blue and orange colors
- **Mobile Responsive**: Works perfectly on all devices
- **Secure API Integration**: Uses Netlify Functions for secure API calls

## 📋 Information Collected

The chatbot intelligently gathers:
- Full Name
- Email Address
- Phone Number
- Location of Interest
- Budget Range
- Property Type (New Build/Existing)
- Buyer Type (Mortgage/Cash)
- Preferred Call Back Time
- Preferred Viewing Days & Times
- Specific Requirements (bedrooms, bathrooms, etc.)

## 🔐 **CRITICAL: API Key Setup**

### **⚠️ FIRST - Revoke the Old Key**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **DELETE** the key: `AIzaSyAamXLIXYUR-5CK99CU94w_CAb1bCBRBAk`
3. **Generate a new API key**

### **🔐 Setup New Key in Netlify**
1. Deploy this repository to Netlify
2. In Netlify Dashboard: **Site settings** > **Environment variables**
3. Add variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `your_new_api_key_here`
4. **Redeploy** your site

## 🚀 **Deployment to Netlify**

1. **Connect Repository**:
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select your GitHub repository
   - Deploy settings: Build command (leave empty), Publish directory: `.`

2. **Set Environment Variables**:
   - Site settings > Environment variables
   - Add: `GEMINI_API_KEY` with your new API key

3. **Redeploy**:
   - Deploys tab > "Trigger deploy"

## 🛠️ **File Structure**

```
estateagent/
├── index.html              # Main chatbot interface
├── chatbot.js              # AI logic (secure - no API keys)
├── netlify/functions/
│   └── gemini.js           # Secure API handler
├── netlify.toml            # Netlify configuration
├── .gitignore              # Security - excludes .env files
└── README.md               # This file
```

## 🔒 **Security Features**

- **API Key Protection**: Never exposed in frontend code
- **Environment Variables**: Secure storage via Netlify
- **CORS Headers**: Proper security configuration
- **Input Validation**: All user inputs validated
- **CSP Headers**: Content Security Policy protection

## 🎨 **Edwards & Gray Branding**

- **Navy Blue**: `#1C2340`
- **Orange**: `#FBAF40`
- Professional, friendly interface
- Mobile-responsive design

## 📞 **Support**

For questions or customization:
- **Email**: tech@edwardsandgray.co.uk
- **Phone**: 0121 XXX XXXX

---

### 🔐 **Security Status: CLEARED**
✅ No API keys in code  
✅ No API keys in Git history  
✅ Secure environment variable setup  
✅ Ready for production deployment  
