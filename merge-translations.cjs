const fs = require('fs');
const path = require('path');

// ============================================================
// COMPREHENSIVE MISSING TRANSLATIONS - PROPER ENGLISH VALUES
// ============================================================

const properEnglish = {
  // ── ACCOUNT (root-level keys used in some components) ──
  "account": {
    "restoreAction": "Restore Account",
    "restored": "Account restored successfully",
    "restoreFailed": "Failed to restore account",
    "restoring": "Restoring..."
  },

  // ── ATTRIBUTES ──
  "attributes": {
    "errors": {
      "deleteFailed": "Failed to delete attribute"
    },
    "filters": {
      "activeFilters": "Active Filters"
    }
  },

  // ── AUTH ──
  "auth": {
    "errors": {
      "googleCancelled": "Google sign-in was cancelled",
      "googleInitFailed": "Failed to initialize Google sign-in",
      "googleLoadFailed": "Failed to load Google sign-in",
      "googleNoSession": "No active Google session found",
      "googlePromptFailed": "Google sign-in prompt failed",
      "googleUnavailable": "Google sign-in is currently unavailable"
    },
    "google": {
      "continueWith": "Continue with Google",
      "signIn": "Sign in with Google",
      "signUpWith": "Sign up with Google"
    },
    "login": {
      "checkingInfo": "Checking your information...",
      "failed": "Login failed. Please check your credentials.",
      "signingIn": "Signing in..."
    },
    "logout": {
      "message": "You have been logged out successfully"
    },
    "signup": {
      "failed": "Registration failed. Please try again.",
      "success": "Account created successfully! Please check your email to verify."
    },
    "verifyEmail": {
      "failed": "Failed to verify email. Please try again.",
      "resendButton": "Resend Verification Email"
    }
  },

  // ── BRAND DASHBOARD ──
  "brand": {
    "dashboard": {
      "adjustFilters": "Adjust Filters",
      "dissolveLocation": "Remove Location",
      "openDashboard": "Open Dashboard",
      "revenue": "Revenue",
      "share": "Share",
      "viewDashboard": "View Dashboard"
    }
  },

  // ── CATEGORIES ──
  "categories": {
    "errors": {
      "failedToCreate": "Failed to create category"
    }
  },

  // ── CHAT ──
  "chat": {
    "queries": {
      "giveMeTips": "Give me tips to improve my business",
      "showMeReports": "Show me my sales reports",
      "whereAreOrders": "Where can I find my orders?"
    },
    "suggestions": {
      "0": "How do I get started?",
      "1": "Show me how to add products",
      "2": "What features do you have?",
      "3": "Help with reports",
      "add_product": "Add a product",
      "contact_support": "Contact support",
      "get_started": "Get started",
      "manage_staff": "Manage staff",
      "view_orders": "View orders",
      "view_reports": "View reports"
    }
  },

  // ── COMMON ──
  "common": {
    "actions": "Actions",
    "aria": {
      "nextMonth": "Next month",
      "previousMonth": "Previous month",
      "selectDateRange": "Select date range"
    },
    "category": "Category",
    "confirmLogout": "Are you sure you want to log out?",
    "connecting": "Connecting...",
    "copied": "Copied to clipboard",
    "copy": "Copy",
    "copyFailed": "Failed to copy to clipboard",
    "creating": "Creating...",
    "currencySymbol": "$",
    "days": {
      "fri": "Fri",
      "mon": "Mon",
      "sat": "Sat",
      "sun": "Sun",
      "thu": "Thu",
      "tue": "Tue",
      "wed": "Wed"
    },
    "entryError": "Entry Error",
    "finalConfirmation": "Final Confirmation",
    "finish": "Finish",
    "guide": "Guide",
    "languages": {
      "ar": "العربية",
      "en": "English"
    },
    "live": "LIVE",
    "loadingVideo": "Loading video...",
    "location": "Location",
    "locations": "Locations",
    "logoAlt": "Mintcom Logo",
    "logout": "Logout",
    "mo": "/mo",
    "month": "Month",
    "na": "N/A",
    "name": "Name",
    "noData": "No data available",
    "noResults": "No results found",
    "note": "Note",
    "password": "Password",
    "print": "Print",
    "privacyPolicy": "Privacy Policy",
    "restoring": "Restoring...",
    "role": "Role",
    "saveChanges": "Save Changes",
    "searchArticles": "Search articles...",
    "searchPlaceholder": "Search...",
    "security": "Security",
    "selected": "Selected",
    "settings": "Settings",
    "share": "Share",
    "sortByDate": "Sort by Date",
    "sortByLocations": "Sort by Locations",
    "sortByName": "Sort by Name",
    "sortByRole": "Sort by Role",
    "status": "Status",
    "submitting": "Submitting...",
    "system": "System",
    "time": {
      "am": "AM",
      "pm": "PM",
      "hourAbbr": "Hr",
      "minuteAbbr": "Min"
    },
    "tip": "Tip",
    "viewAll": "View All",
    "website": "Website",
    "welcome": "Welcome!",
    "welcomeBack": "Welcome back!"
  },

  // ── COMMUNITY ──
  "community": {
    "discussions": {
      "featured_1": {
        "title": "Best practices for managing multiple locations"
      },
      "featured_2": {
        "title": "How we reduced checkout time by 40%"
      },
      "featured_3": {
        "title": "Integrating Mintcom with our inventory system"
      },
      "item_1": {
        "excerpt": "I recently expanded to 3 locations and looking for tips on how to manage inventory and staff across all of them efficiently...",
        "title": "Best practices for managing multiple locations"
      },
      "item_2": {
        "excerpt": "After optimizing our menu layout and training staff on quick keys, we managed to significantly speed up our service...",
        "title": "How we reduced checkout time by 40%"
      },
      "item_3": {
        "excerpt": "Has anyone successfully integrated Mintcom with a third-party inventory management system? Looking for recommendations...",
        "title": "Integrating Mintcom with our inventory system"
      },
      "item_4": {
        "excerpt": "I want to add our logo and customize the footer of our receipts. Is this possible with the current version?",
        "title": "Custom receipt templates - is it possible?"
      },
      "item_5": {
        "excerpt": "Looking for advice on the best loyalty program setup for a coffee shop. Should I use points or stamps?",
        "title": "Setting up loyalty points for coffee shop"
      }
    },
    "guides": {
      "all": "All Guides",
      "item_1": { "title": "Complete Setup Guide for New Users" },
      "item_2": { "title": "Optimizing Your Menu Layout" },
      "item_3": { "title": "Understanding Sales Reports" },
      "item_4": { "title": "Employee Management Best Practices" }
    },
    "hub": {
      "search_placeholder": "Search discussions, ideas, or guides..."
    },
    "ideas": {
      "all": "All Ideas",
      "item_1": {
        "description": "Many users work in dim environments (bars, restaurants). A dark mode would reduce eye strain and look more professional.",
        "title": "Dark mode for POS tablet app"
      },
      "item_2": {
        "description": "Allow connecting multiple printers to a single tablet - one for customer receipts, one for kitchen orders.",
        "title": "Multiple receipt printers per station"
      },
      "item_3": {
        "description": "Support for a secondary display showing order details and total to customers during checkout.",
        "title": "Customer-facing display support"
      },
      "item_4": {
        "description": "Better offline functionality - sync orders automatically when connection is restored.",
        "title": "Offline mode improvements"
      },
      "item_5": {
        "description": "Built-in table layout editor and reservation system for restaurants.",
        "title": "Table management & reservations"
      },
      "item_6": {
        "description": "Let customers scan a QR code at their table to view menu and place orders from their phone.",
        "title": "QR code ordering for customers"
      }
    }
  },

  // ── CONTACT ──
  "contact": {
    "title": "Contact Us"
  },

  // ── COOKIES ──
  "cookies": {
    "banner": {
      "acceptAll": "Accept All",
      "description": "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking \"Accept All\", you consent to our use of cookies.",
      "policyLink": "Cookie Policy",
      "preferences": "Manage Preferences",
      "rejectAll": "Reject All",
      "title": "We Value Your Privacy"
    },
    "policy": {
      "declaration": "Cookie Declaration",
      "p1": "This Cookie Policy explains how Mintcom LLC (\"we\", \"us\", or \"our\") uses cookies and similar technologies on our website and services.",
      "p2": "By continuing to browse our site, you agree to the use of cookies as described in this policy."
    },
    "preferences": {
      "alwaysActive": "Always Active",
      "manage": "Manage Cookie Preferences",
      "save": "Save Preferences",
      "subtitle": "Choose which types of cookies you want to allow. Essential cookies cannot be disabled as they are necessary for the site to function.",
      "title": "Cookie Preferences"
    },
    "types": {
      "analytics": {
        "description": "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.",
        "title": "Analytics Cookies"
      },
      "essential": {
        "description": "These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions like logging in or filling in forms.",
        "title": "Essential Cookies"
      },
      "marketing": {
        "description": "These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant ads.",
        "title": "Marketing Cookies"
      }
    }
  },

  // ── DASHBOARD ──
  "dashboard": {
    "menu": {
      "billing": "Billing",
      "overview": "Overview"
    },
    "roles": {
      "access": "Access",
      "actions": "Actions",
      "addRole": "Add Role",
      "created": "Created",
      "date": "Date",
      "deleteRole": "Delete Role",
      "deleteTitle": "Delete Role",
      "editRole": "Edit Role",
      "gridView": "Grid View",
      "listView": "List View",
      "loading": "Loading roles...",
      "messages": {
        "created": "Role created successfully",
        "deleted": "Role deleted successfully",
        "deleteFailed": "Failed to delete role",
        "loadFailed": "Failed to load roles",
        "noLocation": "No location selected",
        "saveFailed": "Failed to save role",
        "updated": "Role updated successfully"
      },
      "name": "Name",
      "noRoles": "No roles found",
      "noRolesDesc": "Create a role to manage team permissions.",
      "office": "Back Office",
      "permissions": "Permissions",
      "pos": "POS",
      "searchPlaceholder": "Search roles...",
      "subtitle": "Manage access and permissions",
      "title": "Roles",
      "type": "Type"
    },
    "stats": {
      "live": "LIVE"
    }
  },

  // ── HARDWARE ──
  "hardware": {
    "tip": "Pro Tip: All recommended hardware is plug-and-play with the Mintcom POS app."
  },

  // ── INVENTORY ──
  "inventory": {
    "messages": {
      "deleteFailed": "Failed to delete inventory item"
    }
  },

  // ── LANDING ──
  "landing": {
    "contact": {
      "terms": "By submitting, you agree to our Terms of Service and Privacy Policy."
    },
    "pricing": {
      "features": {
        "adminApp": "Admin App",
        "advancedReporting": "Advanced Reporting",
        "dashboard": "Real-time Dashboard",
        "inventory": "Inventory Management",
        "pointOfSale": "Point of Sale",
        "pos": "POS System",
        "production": "Production & Recipes",
        "reports": "Sales Reports",
        "staffManagement": "Staff Management",
        "support": "24/7 Support",
        "unlimitedStaff": "Unlimited Staff"
      },
      "monthlyPlan": "Monthly Plan",
      "perMonth": "/month",
      "planDescription": "Everything you need to run your business. No hidden fees, cancel anytime.",
      "startFreeTrial": "Start Free Trial"
    }
  },

  // ── LEGAL ──
  "legal": {
    "cookies": {
      "cards": {
        "advertisingDesc": "Used to deliver personalized advertisements based on your browsing habits and interests.",
        "analyticsDesc": "Help us understand how visitors interact with our website by collecting anonymous statistical data.",
        "essentialDesc": "Required for the website to function properly. These cookies enable basic features like page navigation and access to secure areas."
      },
      "content": {
        "control_1": "Most web browsers are set to accept cookies by default. You can usually modify your browser settings to decline cookies if you prefer.",
        "control_2": "Please note that if you disable cookies, some features of our website may not function properly.",
        "fb": "Facebook Pixel",
        "fbDesc": "Used to measure the effectiveness of our advertising campaigns on Facebook and to deliver targeted ads.",
        "ga": "Google Analytics",
        "gaDesc": "Used to collect anonymous data about how visitors use our site, including pages visited, time spent, and traffic sources.",
        "questionsDesc": "If you have any questions about our use of cookies, please contact us at support@Mintcom.app",
        "thirdParty_1": "We may use third-party cookies from services like Google Analytics and Facebook to help us analyze traffic and improve our services.",
        "updates_1": "We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons.",
        "updates_2": "We will notify you of any material changes by posting the updated policy on this page with a new effective date.",
        "whatAre_1": "Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to site owners.",
        "whatAre_2": "Cookies can be \"persistent\" (remaining on your device until deleted) or \"session\" cookies (deleted when you close your browser).",
        "whyUse_1": "We use cookies to ensure the proper functioning of our website, remember your preferences, analyze site usage, and personalize your experience."
      }
    },
    "privacy": {
      "agreement": "By using Mintcom, you agree to the collection and use of information in accordance with this Privacy Policy.",
      "branch": {
        "b1": "Amman, Jordan – Headquarters",
        "b2": "Dubai, UAE – Regional Office",
        "b3": "Riyadh, Saudi Arabia – Regional Office"
      },
      "changes": {
        "desc": "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the \"Last Updated\" date."
      },
      "children": {
        "desc": "Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children."
      },
      "contact": {
        "desc": "If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@Mintcom.app"
      },
      "cookies": {
        "c1": "Essential cookies for site functionality and authentication",
        "c2": "Analytics cookies to understand site usage patterns",
        "c3": "Marketing cookies for personalized advertising",
        "manage": "You can manage your cookie preferences at any time through your browser settings or our Cookie Preferences panel."
      },
      "fields": {
        "analytics": "Usage analytics and interaction data",
        "billingAddress": "Billing and shipping addresses",
        "businessInfo": "Business name, type, and registration details",
        "cardDetails": "Payment card details (stored securely via PCI-compliant processors)",
        "cookies": "Cookie identifiers and tracking data",
        "credentials": "Login credentials (passwords stored as hashed values)",
        "deviceInfo": "Device type, operating system, and browser information",
        "email": "Email address",
        "fullName": "Full name",
        "ipAddress": "IP address and geolocation data",
        "loyalty": "Loyalty program participation and points",
        "phone": "Phone number",
        "products": "Product and inventory data",
        "sales": "Sales transaction records and history",
        "staff": "Staff information and access records",
        "transactionIds": "Transaction identifiers and references",
        "usageLogs": "Platform usage logs and activity records"
      },
      "international": {
        "desc": "Your information may be transferred to and maintained on servers located outside of your country. We ensure appropriate safeguards are in place for international data transfers."
      },
      "intro": "Mintcom LLC (\"we\", \"us\", or \"our\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.",
      "retention": {
        "deletionRequest": "You may request deletion of your personal data at any time by contacting us or using the account deletion feature in your settings.",
        "r1": "Account data: Retained for the duration of your account plus 30 days after deletion request",
        "r2": "Transaction records: Retained for 7 years as required by financial regulations",
        "r3": "Analytics data: Retained in anonymized form indefinitely"
      },
      "rights": {
        "contact": "To exercise any of these rights, please contact us at privacy@Mintcom.app",
        "ri1": "Right to access your personal data and request a copy",
        "ri2": "Right to correct inaccurate or incomplete personal data",
        "ri3": "Right to request deletion of your personal data",
        "ri4": "Right to restrict or object to processing of your data"
      },
      "sections": {
        "s1_1_desc": "We collect information you provide directly, such as when you create an account, make a purchase, or contact us for support.",
        "s1_2_desc": "We automatically collect certain information about your device and usage patterns when you interact with our services.",
        "s1_2_note": "We never sell your personal information to third parties.",
        "s1_3_desc": "We may receive information about you from third-party services you connect to your Mintcom account.",
        "s1_4_desc": "We collect transaction data processed through our point-of-sale system to provide our services.",
        "s1_desc": "We collect several types of information to provide and improve our services.",
        "s2_desc": "We use the information we collect to operate, maintain, and improve our services, process transactions, and communicate with you.",
        "s3_desc": "We do not sell your personal information. We may share your data with service providers who assist us in operating our platform, subject to confidentiality obligations.",
        "s4_desc": "We implement industry-standard security measures including encryption, access controls, and regular security audits to protect your information.",
        "s5_desc": "We retain your information only as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.",
        "s6_desc": "Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, or delete your data.",
        "s7_desc": "We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our website.",
        "s8_desc": "If you have any questions about this Privacy Policy, please contact us at privacy@Mintcom.app"
      },
      "security": {
        "noAbsoluteSecurity": "While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure.",
        "sec1": "AES-256 encryption for all data at rest",
        "sec2": "TLS 1.3 encryption for all data in transit",
        "sec3": "PCI DSS Level 1 compliance for payment data",
        "sec4": "Regular third-party security audits and penetration testing"
      },
      "sharing": {
        "obligation": "We may disclose your information if required to do so by law or in response to valid legal processes.",
        "sh1": "Service providers who help us operate our platform (hosting, analytics, payment processing)",
        "sh2": "Business partners with your consent for integrated services",
        "sh3": "Law enforcement or regulatory bodies when required by applicable law"
      },
      "usage": {
        "noSell": "We never sell your personal information to third parties.",
        "u1": "Process and complete transactions you request",
        "u2": "Provide, maintain, and improve our services",
        "u3": "Send you technical notices, updates, and support messages",
        "u4": "Respond to your comments, questions, and customer service requests",
        "u5": "Monitor and analyze trends, usage, and activities",
        "u6": "Detect, investigate, and prevent fraudulent transactions and abuse",
        "u7": "Personalize and improve your experience",
        "u8": "Comply with legal obligations and enforce our terms"
      }
    },
    "terms": {
      "availability": {
        "desc": "We strive to maintain high availability but do not guarantee uninterrupted service. We may perform scheduled maintenance with advance notice."
      },
      "contact": {
        "desc": "For questions about these Terms of Service, please contact us at legal@Mintcom.app"
      },
      "intro": "Welcome to Mintcom. By accessing or using our services, you agree to be bound by these Terms of Service. Please read them carefully.",
      "ip": {
        "desc": "All content, trademarks, and intellectual property on our platform are owned by Mintcom LLC or its licensors. You may not copy, modify, or distribute our content without written permission."
      },
      "law": {
        "desc": "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Mintcom LLC is registered."
      },
      "liability": {
        "desc": "To the maximum extent permitted by law, Mintcom LLC shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services."
      },
      "payments": {
        "p1": "You agree to pay all fees associated with your subscription plan. Fees are non-refundable except as required by law.",
        "p2": "We may change our pricing with 30 days' notice. Continued use after the change constitutes acceptance of the new pricing."
      },
      "privacy": {
        "p1": "Your use of our services is also governed by our Privacy Policy, which is incorporated into these Terms by reference.",
        "p2": "By using our services, you consent to the collection and use of data as described in our Privacy Policy."
      },
      "responsibilities": {
        "accuracy": "You are responsible for maintaining the accuracy of your account information.",
        "intro": "As a user of our services, you agree to the following responsibilities:",
        "r1": "Maintain the confidentiality of your login credentials",
        "r2": "Use the services only for lawful business purposes",
        "r3": "Not attempt to interfere with or disrupt the services"
      },
      "termination": {
        "desc": "We may suspend or terminate your access to our services at any time for violation of these terms. You may cancel your account at any time through your account settings."
      },
      "use": {
        "u1": "Mintcom grants you a limited, non-exclusive, non-transferable license to use our services for your business operations.",
        "u2": "You may not sublicense, sell, or redistribute access to our services without our written consent."
      }
    }
  },

  // ── ONBOARDING ──
  "onboarding": {
    "errors": {
      "failedToComplete": "Failed to complete setup. Please try again."
    },
    "location": "Location",
    "messages": {
      "complete": "Setup completed successfully!"
    },
    "select": "Select",
    "step1": {
      "businessTypes": {
        "bakery": "Bakery"
      },
      "currencies": {
        "AED": "AED - UAE Dirham",
        "BHD": "BHD - Bahraini Dinar",
        "EGP": "EGP - Egyptian Pound",
        "EUR": "EUR - Euro",
        "GBP": "GBP - British Pound",
        "JOD": "JOD - Jordanian Dinar",
        "KWD": "KWD - Kuwaiti Dinar",
        "OMR": "OMR - Omani Rial",
        "QAR": "QAR - Qatari Riyal",
        "SAR": "SAR - Saudi Riyal",
        "TRY": "TRY - Turkish Lira",
        "USD": "USD - US Dollar"
      }
    },
    "step4": {
      "adminUsernamePlaceholder": "e.g. admin"
    },
    "step5": {
      "ownerPortal": "Owner Portal"
    },
    "validation": {
      "locationPasswordMin": "Location password must be at least 6 characters"
    }
  },

  // ── ORDERS ──
  "orders": {
    "actions": {
      "refund": "Refund",
      "refundOrder": "Refund Order",
      "viewDetails": "View Details"
    },
    "details": {
      "contact": "Contact",
      "contactTip": "Customer contact information",
      "customer": "Customer",
      "customerTip": "Customer who placed this order",
      "date": "Date",
      "dateTip": "Date and time the order was placed",
      "discount": "Discount",
      "items": "Items",
      "notes": "Notes",
      "payment": "Payment",
      "paymentTip": "Payment method used for this order",
      "processed": "Processed",
      "qty": "Qty",
      "refundConfirmMessage": "Are you sure you want to refund this order? This action cannot be undone.",
      "refundConfirmTitle": "Confirm Refund",
      "refundedBy": "Refunded By",
      "refundedByTip": "Staff member who processed the refund",
      "staff": "Staff",
      "staffTip": "Staff member who processed this order",
      "status": "Status",
      "statusTip": "Current order status",
      "subtotal": "Subtotal",
      "tax": "Tax",
      "title": "Order Details",
      "total": "Total"
    },
    "kpi": {
      "onHold": "On Hold",
      "totalOrders": "Total Orders",
      "totalSales": "Total Sales"
    },
    "messages": {
      "checkShiftFailed": "Failed to check shift status",
      "loadFailed": "Failed to load orders",
      "loading": "Loading orders...",
      "noOrders": "No orders found",
      "noShiftFound": "No active shift found. Please start a shift first.",
      "refundConfirmMessage": "Are you sure you want to refund this order? This action cannot be undone.",
      "refundConfirmTitle": "Confirm Refund",
      "refundFailed": "Failed to process refund",
      "refundReasonWeb": "Refunded via web dashboard",
      "refundSuccess": "Order refunded successfully"
    },
    "payment": {
      "deliveryApps": "Delivery Apps"
    },
    "period": "Period",
    "reports": {
      "shifts": {
        "sales": "Sales"
      }
    },
    "stats": {
      "totalSales": "Total Sales"
    },
    "table": {
      "payment": "Payment"
    }
  },

  // ── OWNER ──
  "owner": {
    "account": {
      "accountRestored": "Your account has been restored successfully",
      "activeEstBlockModal": {
        "activeLocations": "Active Locations",
        "goToLocations": "Go to Locations",
        "subtitle": "You have active locations that need to be resolved before proceeding.",
        "title": "Active Locations Found"
      },
      "brandLoginId": "Brand Login ID",
      "brandLoginsSubtitle": "Login credentials for your brand dashboards",
      "dangerZoneHint": "Once you delete your account, there is no going back. Please be certain.",
      "deleteAccount": "Delete Account",
      "deleteAccountModal": {
        "confirmFinal": "I understand this action is permanent and irreversible",
        "confirmPassword": "Confirm your password to proceed",
        "deleting": "Deleting account...",
        "feedbackHint": "Help us improve by sharing your reason (optional)",
        "passwordPlaceholder": "Enter your password",
        "title": "Delete Account",
        "warning": "This will permanently delete your account and all associated data. This action cannot be undone.",
        "whyLeaving": "Why are you leaving?"
      },
      "deletionFailed": "Failed to initiate account deletion",
      "deletionInitiated": "Account deletion has been initiated",
      "deletionScheduledHint": "Your account will be permanently deleted after the grace period. You can restore it anytime before then.",
      "loading": "Loading account...",
      "locationLoginsSubtitle": "Login credentials for your POS locations",
      "noLocationsOrBrands": "No locations or brands found",
      "noLocationsOrBrandsHint": "Get started by creating your first location or brand.",
      "profileUpdatedVerifyEmail": "Profile updated. Please verify your new email address.",
      "resources": {
        "aboutUs": {
          "desc": "Learn about our mission and team",
          "title": "About Us"
        },
        "privacyPolicy": {
          "desc": "How we protect your data",
          "title": "Privacy Policy"
        },
        "qa": {
          "desc": "Find answers to common questions",
          "title": "Q&A Center"
        },
        "setupManual": {
          "desc": "Step-by-step hardware setup guide",
          "title": "Setup Manual"
        },
        "subtitle": "Helpful guides and documentation",
        "termsOfUse": {
          "desc": "Our terms and conditions",
          "title": "Terms of Use"
        },
        "title": "Useful Resources",
        "userManual": {
          "desc": "Complete guide to using Mintcom",
          "title": "User Manual"
        },
        "videoTutorial": {
          "desc": "Watch step-by-step video guides",
          "title": "Video Tutorial"
        }
      },
      "restoreAccount": "Restore Account",
      "restoreMyAccount": "Restore My Account",
      "securityTips": {
        "neverShareOtp": "Never share your OTP or verification codes with anyone",
        "title": "Security Tips",
        "uniquePasswords": "Use unique, strong passwords for each account",
        "updatePeriodically": "Update your password periodically for better security"
      },
      "stats": {
        "admins": "Admins",
        "brands": "Brands",
        "locations": "Locations"
      },
      "validation": {
        "requiredFields": "Please fill in all required fields"
      }
    },
    "billing": {
      "fetchFailed": "Failed to load billing information",
      "subtitle": "Manage subscriptions and payments",
      "title": "Billing"
    },
    "brands": {
      "activeFilters": "Active Filters",
      "adminLoginId": "Admin Login ID",
      "adminLoginIdHint": "This ID will be used to access the brand dashboard",
      "adminLoginIdPlaceholder": "e.g. brand_admin",
      "adminPassword": "Admin Password",
      "brand": "Brand",
      "brandName": "Brand Name",
      "brandNamePlaceholder": "e.g. My Restaurant Chain",
      "createBrandHint": "Group multiple locations under one brand for unified management.",
      "createBrandSubtitle": "Set up a new brand to manage multiple locations",
      "createBrandTitle": "Create New Brand",
      "createFirstBrand": "Create Your First Brand",
      "location": "Location",
      "noBrandsFound": "No brands found",
      "selectLocationsToLink": "Select locations to link to this brand",
      "tryAdjustingSearch": "Try adjusting your search or filters",
      "validation": {
        "loginIdMin": "Login ID must be at least 4 characters",
        "loginIdRegex": "Login ID can only contain letters, numbers, underscores, and hyphens",
        "nameMin": "Brand name must be at least 2 characters",
        "passwordMin": "Password must be at least 6 characters"
      },
      "wizard": {
        "finalStepDesc": "Select which employees should have global access to all linked locations."
      }
    },
    "employees": {
      "activeNow": "Active Now",
      "allRoles": "All Roles",
      "totalUsers": "Total Users"
    },
    "merge": {
      "availableLocations": "Available Locations",
      "brand": "Brand",
      "brandCreated": "Brand created successfully!",
      "brandDetailsSubtitle": "Enter details for your new brand",
      "brandName": "Brand Name",
      "brandNamePlaceholder": "Enter brand name...",
      "createBrand": "Create Brand",
      "createFailed": "Failed to create brand",
      "enterBrandName": "Please enter a brand name",
      "newBrandBadge": "New Brand",
      "readyForNextStep": "Ready for next step",
      "selectedLocations": "Selected Locations",
      "selectMinLocations": "Select at least 2 locations to create a brand",
      "steps": {
        "details": "Brand Details",
        "select": "Select Locations"
      },
      "whyMergeDesc": "Merging locations into a brand lets you manage them together, share staff, and view unified reports."
    },
    "staff": {
      "access": "Access",
      "accessRights": "Access Rights",
      "addStaffDesc": "Add a new team member to your organization",
      "allLocations": "All Locations",
      "enterPasswordPlaceholder": "Enter your password to confirm",
      "noStaffDesc": "Start by adding your first team member.",
      "noStaffFound": "No staff found",
      "passwordPlaceholder": "Enter password",
      "staffRemoved": "Staff member removed successfully",
      "syncError": "Failed to sync staff data",
      "undoneWarning": "This action cannot be undone.",
      "verifyPassword": "Verify your password to continue"
    }
  },

  // ── PASSWORD RESET ──
  "passwordReset": {
    "form": {
      "confirmPassword": "Confirm Password",
      "confirmPlaceholder": "Re-enter your password",
      "newPassword": "New Password",
      "passwordPlaceholder": "Enter new password",
      "resend": "Resend Code",
      "resetButton": "Reset Password",
      "resetting": "Resetting...",
      "sendCode": "Send Verification Code",
      "sending": "Sending...",
      "verifyCode": "Verify Code",
      "verifying": "Verifying..."
    },
    "messages": {
      "codeSent": "Verification code sent to your email",
      "codeVerified": "Code verified successfully",
      "enterFullCode": "Please enter the full verification code",
      "failedToReset": "Failed to reset password. Please try again.",
      "failedToSend": "Failed to send verification code",
      "invalidCode": "Invalid verification code",
      "passwordReset": "Password reset successfully! You can now log in."
    },
    "steps": {
      "enterCodeTitle": "Enter Verification Code",
      "newPasswordDesc": "Create a new, strong password for your account",
      "newPasswordTitle": "Create New Password",
      "successDesc": "You can now log in with your new password.",
      "successTitle": "Password Reset Successful!",
      "verifyDesc": "Enter the code we sent to your email",
      "verifyTitle": "Verify Your Identity"
    },
    "title": {
      "account": "Account Password Reset",
      "default": "Reset Password"
    }
  },

  // ── PAYMENT METHODS ──
  "paymentMethods": {
    "messages": {
      "notActive": "This payment method is not active"
    },
    "modal": {
      "expiryPlaceholder": "MM/YY"
    }
  },

  // ── PRICING ──
  "pricing": {
    "planDetails": "Plan Details",
    "viewDetails": "View Details",
    "whatsIncluded": "What's Included"
  },

  // ── PRODUCTS ──
  "products": {
    "form": {
      "imagePreview": "Image Preview"
    },
    "messages": {
      "addonCreated": "Add-on created successfully",
      "addonFailed": "Failed to create add-on"
    }
  },

  // ── ROLES ──
  "roles": {
    "backoffice": {
      "description": "Access to back office management features",
      "title": "Back Office"
    },
    "createRole": "Create Role",
    "editRole": "Edit Role",
    "form": {
      "allAllowed": "All discounts allowed",
      "allowAllDiscounts": "Allow All Discounts",
      "allowedDiscounts": "Allowed Discounts",
      "roleNamePlaceholder": "e.g. Shift Manager"
    },
    "newRole": "New Role",
    "permissions": "Permissions",
    "pos": {
      "description": "Access to point of sale features",
      "title": "Point of Sale"
    },
    "validation": {
      "atLeastOnePermission": "Please select at least one permission"
    }
  },

  // ── SETTINGS ──
  "settings": {
    "confirm": {
      "criticalChange": "This is a critical change that will affect your system"
    },
    "danger": {
      "cancelFailed": "Failed to cancel deletion"
    },
    "messages": {
      "loading": "Loading settings..."
    },
    "profile": {
      "addressPlaceholder": "Enter your business address..."
    },
    "sales": {
      "taxErrorGeneric": "Failed to update tax rate",
      "taxErrorRange": "Tax rate must be between 0 and 100%"
    }
  },

  // ── STAFF ──
  "staff": {
    "form": {
      "locationLabel": "Location Access",
      "standardUsers": "Standard Users"
    }
  },

  // ── SUPPORT ──
  "support": {
    "articles": {
      "allTitle": "All Articles",
      "backTo": "Back to",
      "backToHelp": "Back to Help Center",
      "bl1": "Understanding Your Sales Dashboard",
      "bl1_excerpt": "Learn how to read and use your sales dashboard for better business decisions.",
      "bl2_excerpt": "A comprehensive guide to billing, invoicing, and managing your subscription payments.",
      "bl2": {
        "h1": "Billing & Payments Guide",
        "h2": "Understanding Your Subscription",
        "h3": "Payment Methods",
        "h4": "Invoices & Receipts",
        "h5": "Upgrading Your Plan",
        "h6": "Cancellation & Refunds",
        "li1": "Monthly subscription covers all features",
        "li2": "30-day free trial for new locations",
        "li3": "No setup fees or hidden charges",
        "li4": "Cancel anytime with 30-day notice",
        "li5": "Credit and debit cards accepted",
        "li6": "Automatic recurring billing",
        "li7": "Secure PCI-compliant processing",
        "li8": "Multiple cards supported",
        "li9": "Invoices generated automatically each billing cycle",
        "li10": "Download PDF invoices from your billing dashboard",
        "li11": "Email receipts sent after each payment",
        "li12": "Tax invoices available for business accounting",
        "li13": "Upgrade anytime from your billing settings",
        "li14": "Prorated charges for mid-cycle upgrades",
        "li15": "New features available immediately after upgrade",
        "li16": "Cancel from Settings > Billing > Cancel Subscription",
        "li17": "Access continues until end of current billing period",
        "li18": "Data retained for 30 days after cancellation",
        "li19": "Export your data before the retention period ends",
        "li20": "Refunds processed within 5-7 business days",
        "li21": "Contact support for billing disputes",
        "note_desc": "Keep your payment method up to date to avoid service interruptions.",
        "note_label": "Important",
        "p1": "This guide covers everything you need to know about billing, payments, and managing your Mintcom subscription.",
        "p2": "Mintcom uses a simple, transparent pricing model with no hidden fees.",
        "p3": "We accept all major payment methods for your convenience."
      },
      "bl3": "Managing Payment Methods",
      "bl3_excerpt": "How to add, update, and manage your payment methods in the dashboard.",
      "bl4": "Understanding Subscription Plans",
      "bl4_excerpt": "Compare plans and find the right subscription for your business needs.",
      "bl5": "Invoice Management Guide",
      "bl5_excerpt": "Access, download, and manage your invoices and payment history.",
      "bl6": "Tax Configuration Setup",
      "bl6_excerpt": "Configure tax rates, exemptions, and reporting for your business.",
      "bl7": "Refund Processing Guide",
      "bl7_excerpt": "Step-by-step instructions for processing refunds through the POS system.",
      "bl8": "Multi-Location Billing",
      "bl8_excerpt": "Manage billing across multiple locations with unified or separate plans.",
      "clearFilters": "Clear Filters",
      "clearSearch": "Clear Search",
      "count": "{{count}} articles",
      "featuredTitle": "Featured Articles",
      "feedbackSorry": "We're sorry this wasn't helpful. We'll work on improving it.",
      "feedbackThanks": "Thanks for your feedback!",
      "ft1_excerpt": "A comprehensive guide to understanding and using all Mintcom features.",
      "ft1": {
        "h1": "Complete Feature Guide",
        "h2": "Point of Sale (POS)",
        "h3": "Inventory Management",
        "h4": "Staff Management",
        "h5": "Reporting & Analytics",
        "h6": "Customer Management",
        "h7": "Settings & Configuration",
        "li1_desc": "Process sales quickly with an intuitive, touch-optimized interface designed for speed.",
        "li1_label": "Fast Checkout",
        "li2_desc": "Accept cash, cards, and digital wallets with secure, PCI-compliant processing.",
        "li2_label": "Multiple Payment Methods",
        "li3_desc": "Create and apply percentage or fixed-amount discounts to orders.",
        "li3_label": "Discounts & Promotions",
        "li4_desc": "View and reprint past receipts from the transaction history.",
        "li4_label": "Receipt Management",
        "li5": "Track stock levels in real-time across all locations",
        "li6": "Set low-stock alerts to never run out of popular items",
        "li7": "Manage ingredients and recipes for prepared items",
        "li8": "Import and export product catalogs easily",
        "li9": "Define roles with granular POS and back-office permissions",
        "li10": "Track employee hours and shift performance",
        "li11": "Monitor sales per staff member for performance reviews",
        "li12": "Set up admin users with full or restricted access",
        "li13": "View real-time sales dashboards with key metrics",
        "li14": "Generate detailed reports on sales, staff, and inventory",
        "li15": "Export reports as CSV for further analysis",
        "p1": "Mintcom is a complete 360° point-of-sale solution built for modern businesses. This guide covers all the features available to you.",
        "p2": "The POS system is designed to be fast, reliable, and easy for your staff to learn.",
        "p3": "Keep track of every item in your inventory with real-time updates.",
        "p4": "Manage your team with flexible roles and detailed performance tracking.",
        "p5": "Make data-driven decisions with comprehensive analytics and reporting.",
        "p6": "Build lasting customer relationships with our built-in CRM and loyalty system.",
        "type1_desc": "Your main sales interface — process orders, apply discounts, and complete transactions.",
        "type1_label": "POS Terminal",
        "type2_desc": "Track raw materials, ingredients, and finished products across all locations.",
        "type2_label": "Inventory System",
        "type3_desc": "Assign roles, manage schedules, and track employee performance.",
        "type3_label": "Staff Management",
        "type4_desc": "Real-time dashboards, sales reports, and business analytics.",
        "type4_label": "Reports & Analytics",
        "type5_desc": "Customer database with loyalty points, purchase history, and engagement tools.",
        "type5_label": "Customer CRM",
        "type6_desc": "Configure your store settings, tax rates, receipt layout, and more.",
        "type6_label": "Settings & Config"
      },
      "ft10": "Offline Mode & Data Sync",
      "ft10_excerpt": "How Mintcom handles offline transactions and syncs data when back online.",
      "ft2": "Inventory Management Guide",
      "ft2_excerpt": "Learn how to track stock, set alerts, and manage your inventory efficiently.",
      "ft3": "Staff Roles & Permissions",
      "ft3_excerpt": "Set up roles, assign permissions, and manage your team access.",
      "ft4": "Customer Loyalty Program",
      "ft4_excerpt": "Configure and manage your customer loyalty and rewards program.",
      "ft5": "Discount Management",
      "ft5_excerpt": "Create, manage, and track discounts across your business.",
      "ft6": "Receipt Customization",
      "ft6_excerpt": "Customize your receipt layout with logo, address, and custom messages.",
      "ft7": "Multi-Location Management",
      "ft7_excerpt": "Manage multiple business locations from a single dashboard.",
      "ft8": "Payment Methods Setup",
      "ft8_excerpt": "Configure accepted payment methods including cards and digital wallets.",
      "ft9": "Add-ons & Modifiers Guide",
      "ft9_excerpt": "Create product add-ons and modifiers for customizable orders.",
      "gs1_excerpt": "Step-by-step guide to setting up your first Mintcom location and getting started.",
      "gs1": {
        "h1": "Getting Started with Mintcom",
        "h2": "Creating Your Account",
        "h3": "Setting Up Your First Location",
        "h4": "Adding Products",
        "h5": "Configuring Payment Methods",
        "h6": "Inviting Staff",
        "h7": "Going Live",
        "li1_desc": "Visit Mintcom.app and click \"Get Started\" to begin your registration.",
        "li1_label": "Sign Up",
        "li2_desc": "Check your inbox for a verification email and click the link to activate your account.",
        "li2_label": "Verify Email",
        "li3_desc": "Enter your business name, type, address, and preferred currency.",
        "li3_label": "Business Details",
        "li4_desc": "Create a unique login ID and password for your POS terminal.",
        "li4_label": "POS Credentials",
        "p1": "Welcome to Mintcom! This guide will walk you through everything you need to get your business up and running.",
        "p2": "Start by creating your account and verifying your email address.",
        "p3": "Next, set up your first business location with all the essential details.",
        "p4": "Add your products, set prices, and organize them into categories.",
        "p5": "Set up the payment methods you want to accept — cash, cards, and digital wallets.",
        "p6": "Invite your team members and assign them appropriate roles and permissions.",
        "p7": "Once everything is set up, download the POS app and start processing orders!"
      },
      "gs2_excerpt": "Learn how to navigate the Mintcom dashboard and use its key features.",
      "gs2": {
        "h1": "Navigating Your Dashboard",
        "h2": "Dashboard Overview",
        "h3": "Sales & Reports",
        "h4": "Managing Orders",
        "h5": "Team Management",
        "h6": "Settings & Configuration",
        "li1_desc": "View real-time sales data, order counts, and performance metrics at a glance.",
        "li1_label": "Live Metrics",
        "li2_desc": "Monitor sales trends throughout the day with hourly breakdowns.",
        "li2_label": "Revenue Chart",
        "li3_desc": "See which products are selling the most in real-time.",
        "li3_label": "Top Products",
        "li4_desc": "Track payments across cash, cards, and other methods.",
        "li4_label": "Payment Breakdown",
        "li5": "Access detailed sales summaries with filters by date, staff, and more",
        "li6": "View item-level reports to understand product performance",
        "li7": "Track staff performance with individual sales metrics",
        "li8_desc": "Track shift status, opening and closing balances, and variances.",
        "li8_label": "Shift Reports",
        "li9_desc": "View all transactions grouped by payment channel.",
        "li9_label": "Payment Reports",
        "li10_desc": "Monitor discounts applied and their impact on revenue.",
        "li10_label": "Discount Reports",
        "li11": "View all orders with status, payment method, and customer info",
        "li12": "Filter orders by date, status, or payment method",
        "li13": "Process refunds directly from the order detail view",
        "li14": "Export order data to CSV for external analysis",
        "li15": "Add team members and assign POS and back-office permissions",
        "li16": "Create custom roles for different access levels",
        "li17": "Monitor who is currently active and on shift",
        "li18": "Track individual staff performance and sales metrics",
        "p1": "Your Mintcom dashboard is your command center for managing your business.",
        "p2": "The main dashboard gives you a real-time overview of your business performance.",
        "p3": "Access comprehensive reports to understand your sales trends and performance.",
        "p4": "Manage all your orders from a single, unified view.",
        "p5": "Build and manage your team with flexible roles and permissions.",
        "p6": "Configure every aspect of your business from the settings panel."
      },
      "gs3": "Adding Your First Product",
      "gs3_excerpt": "Learn how to create products, set prices, and organize your menu.",
      "gs4": "Setting Up Payment Methods",
      "gs4_excerpt": "Configure cash, card, and digital payment options for your business.",
      "gs5": "Creating Staff Accounts",
      "gs5_excerpt": "Add team members, assign roles, and manage permissions.",
      "gs6": "Understanding Roles & Permissions",
      "gs6_excerpt": "Learn how to create custom roles with specific POS and back-office access.",
      "gs7": "Downloading the POS App",
      "gs7_excerpt": "Get the Mintcom POS app on your tablet and connect to your location.",
      "gs8": "Starting Your First Shift",
      "gs8_excerpt": "Learn how to open a shift, process orders, and close out at the end of the day.",
      "helpfulNo": "No",
      "helpfulQuestion": "Was this article helpful?",
      "helpfulYes": "Yes",
      "notFound": "Article Not Found",
      "notFoundDesc": "The article you're looking for doesn't exist or has been moved.",
      "notFoundDescDetail": "Try searching for what you need or browse our help categories.",
      "popular": "Popular",
      "read": "Read",
      "related": "Related Articles",
      "sortBy": "Sort by",
      "sortPopular": "Most Popular",
      "sortRecent": "Most Recent",
      "stubContentH1": "Article Content",
      "stubContentH2": "More Information",
      "stubContentP1": "This article is coming soon. We're working on creating comprehensive content for this topic.",
      "stubContentP2": "In the meantime, please contact our support team if you need immediate assistance.",
      "stubTitle": "Coming Soon",
      "tc1_excerpt": "Step-by-step guide to resolving common technical issues with the POS system.",
      "tc1": {
        "a1_1": "First, check your internet connection. Try loading another website to verify. If the internet is working, try refreshing the page or clearing your browser cache.",
        "a1_2": "If the problem persists, try using a different browser or device. You can also check our status page for any known outages.",
        "a1_3": "If none of these steps work, contact our support team with details about the error you're seeing.",
        "a2_1": "Ensure your printer is powered on and connected to the same network as your POS device. Check that the correct printer is selected in Settings > Receipts.",
        "a2_2": "Try printing a test page from the printer settings. If that works but POS printing doesn't, reinstall the printer driver.",
        "a3_1": "Mintcom automatically syncs data when your connection is restored. You can continue processing orders in offline mode.",
        "a3_2": "Once back online, go to Settings > Sync to manually trigger a sync if needed.",
        "a3_3": "All offline transactions are securely stored on your device and will be uploaded when connectivity returns.",
        "h1": "Troubleshooting Common Issues",
        "h2": "Connection Problems",
        "h3": "Printer Issues",
        "h4": "Data Sync Issues",
        "h5": "Step-by-Step Diagnostic",
        "li1": "Check your internet connection and Wi-Fi signal strength",
        "li2": "Clear your browser cache and cookies",
        "li3": "Try using a different browser (Chrome recommended)",
        "li4": "Restart your device and try again",
        "li5": "Ensure your firewall isn't blocking Mintcom",
        "li6": "Update your browser to the latest version",
        "li7": "Contact support if issues persist after trying all steps",
        "p1": "This guide helps you troubleshoot the most common technical issues you may encounter with Mintcom.",
        "p2": "Most issues can be resolved with these simple steps. If you need further assistance, our support team is available 24/7.",
        "p3": "Follow this diagnostic process to identify and resolve technical issues.",
        "q1": "Why can't I access the Mintcom dashboard?",
        "q2": "My receipt printer isn't working. What should I do?",
        "q3": "What happens to my data during an internet outage?",
        "step1_desc": "Ensure your device is connected to the internet and the connection is stable.",
        "step1_label": "Check Connection",
        "step2_desc": "Close and reopen the Mintcom app or refresh your browser.",
        "step2_label": "Restart Application",
        "step3_desc": "Remove temporary files that might cause issues.",
        "step3_label": "Clear Cache",
        "step4_desc": "Make sure you're running the latest version of Mintcom.",
        "step4_label": "Update Software",
        "step5_desc": "If the issue persists, reach out to our support team with error details.",
        "step5_label": "Contact Support"
      },
      "tc10": "API Integration Guide",
      "tc10_excerpt": "Technical guide for integrating with the Mintcom API.",
      "tc2": "Network & Connectivity Setup",
      "tc2_excerpt": "Optimize your network setup for reliable POS operations.",
      "tc3": "Printer Setup & Configuration",
      "tc3_excerpt": "Set up receipt printers and configure print settings.",
      "tc4": "App Performance Optimization",
      "tc4_excerpt": "Tips and tricks to keep your POS app running smoothly.",
      "tc5": "Data Backup & Recovery",
      "tc5_excerpt": "Understand how Mintcom backs up your data and how to recover it.",
      "tc6": "Browser Compatibility Guide",
      "tc6_excerpt": "Supported browsers and recommendations for the best experience.",
      "tc7": "Security Best Practices",
      "tc7_excerpt": "Keep your Mintcom account and data secure with these tips.",
      "tc8": "Device Requirements",
      "tc8_excerpt": "Minimum hardware and software requirements for running Mintcom.",
      "tc9": "Error Codes Reference",
      "tc9_excerpt": "A reference guide for common error codes and their solutions.",
      "updated": "Updated",
      "viewAll": "View All Articles",
      "views": "views"
    },
    "categories": {
      "all": "All Categories",
      "billing": "Billing & Payments",
      "billingDesc": "Manage subscriptions, invoices, and payment methods",
      "billingDescShort": "Subscriptions & payments",
      "bug": "Bug Report",
      "bugDescShort": "Report a problem",
      "feature": "Feature Request",
      "featureDescShort": "Suggest an improvement",
      "features": "Features & How-To",
      "featuresDesc": "Learn how to use all Mintcom features",
      "gettingStarted": "Getting Started",
      "gettingStartedDesc": "Everything you need to set up and get running",
      "gettingStartedDescShort": "Setup & first steps",
      "notFound": "Category Not Found",
      "notFoundDesc": "The category you're looking for doesn't exist.",
      "other": "Other",
      "otherDescShort": "General questions",
      "sidebarTitle": "Help Categories",
      "subtitle": "Browse by topic to find what you need",
      "technical": "Technical Support",
      "technicalDesc": "Troubleshooting, connectivity, and device setup",
      "technicalDescShort": "Troubleshooting & setup",
      "title": "Help Center"
    },
    "cta": {
      "stillNeedHelp": "Still need help?",
      "stillNeedHelpDesc": "Our support team is available 24/7 to assist you.",
      "subtitle": "Can't find what you're looking for? We're here to help.",
      "title": "Contact Support"
    },
    "hero": {
      "badge": "Help Center",
      "searchPlaceholder": "Search for help articles...",
      "subtitle": "Find answers, guides, and support for all things Mintcom",
      "titleHighlight": "help",
      "titlePart1": "How can we",
      "titlePart2": "you?"
    },
    "newTicket": {
      "addFiles": "Add Files",
      "attachmentLimit": "Max 5 files, 10MB each",
      "categoryLabel": "Category",
      "descriptionLabel": "Description",
      "descriptionPlaceholder": "Describe your issue in detail...",
      "error": "Failed to submit ticket. Please try again.",
      "errors": {
        "category": "Please select a category",
        "description": "Please provide a description",
        "descriptionLength": "Description must be at least 20 characters",
        "subject": "Please enter a subject",
        "subjectLength": "Subject must be at least 5 characters"
      },
      "priorityLabel": "Priority",
      "privacyAgreement": "By submitting, you agree to our Privacy Policy",
      "subjectLabel": "Subject",
      "subjectPlaceholder": "Brief summary of your issue...",
      "submit": "Submit Ticket",
      "subtitle": "Describe your issue and we'll get back to you",
      "success": "Ticket submitted successfully! We'll respond within 24 hours.",
      "title": "Submit a Support Ticket"
    },
    "popularArticles": {
      "account": "How to manage your account settings",
      "establishment": "Setting up your first establishment",
      "payment": "Configuring payment methods",
      "printer": "Connecting your receipt printer",
      "reports": "Understanding your sales reports"
    },
    "qa": {
      "categories": {
        "billing": "Billing",
        "orders": "Orders",
        "products": "Products",
        "staff": "Staff",
        "technical": "Technical"
      },
      "needMoreHelp": "Need more help? Contact our support team.",
      "noResults": "No results found",
      "searchPlaceholder": "Search for help...",
      "subtitle": "Find answers quickly",
      "tryDifferent": "Try a different search term"
    },
    "quickLinks": {
      "community": "Join Community",
      "submitTicket": "Submit a Ticket"
    },
    "tickets": {
      "attachFile": "Attach File",
      "attachments": "Attachments",
      "conversation": "Conversation",
      "created": "Created",
      "createFirst": "Create your first support ticket",
      "id": "Ticket ID",
      "lastUpdated": "Last Updated",
      "markResolved": "Mark as Resolved",
      "mock": {
        "desc1": "I'm having trouble connecting my receipt printer to the POS system. It was working fine yesterday but now shows as offline.",
        "reply1": "Thank you for reaching out! Let me help you with the printer connection issue.",
        "reply2": "Please try restarting both the printer and your POS device, then check the Wi-Fi connection.",
        "reply3": "If the issue persists, please share your printer model and I'll provide specific troubleshooting steps.",
        "subject1": "Receipt printer not connecting"
      },
      "myTickets": "My Tickets",
      "new": "New Ticket",
      "newLabel": "New",
      "notFound": "Ticket not found",
      "notFoundSearch": "No tickets matching your search",
      "noTicketsYet": "No tickets yet",
      "priority": {
        "high": "High",
        "highDesc": "Business significantly impacted",
        "low": "Low",
        "lowDesc": "General question or minor issue",
        "medium": "Medium",
        "mediumDesc": "Moderate business impact",
        "urgent": "Urgent",
        "urgentDesc": "Business operations are stopped"
      },
      "priorityLabel": "Priority",
      "replyPlaceholder": "Type your reply...",
      "resolvedQuestion": "Has your issue been resolved?",
      "sarah": "Sarah from Support",
      "searchPlaceholder": "Search tickets...",
      "sendReply": "Send Reply",
      "stats": {
        "inProgress": "In Progress",
        "open": "Open",
        "resolved": "Resolved"
      },
      "status": {
        "closed": "Closed",
        "inProgress": "In Progress",
        "open": "Open",
        "resolved": "Resolved"
      },
      "statusLabel": "Status",
      "subtitle": "Track and manage your support requests",
      "toClose": "Close Ticket",
      "updated": "Updated",
      "you": "You"
    }
  },

  // ── VALIDATION ──
  "validation": {
    "emailInvalid": "Please enter a valid email address",
    "firstNameMin": "First name must be at least 2 characters",
    "lastNameMin": "Last name must be at least 2 characters",
    "passwordLowercase": "Password must contain at least one lowercase letter",
    "passwordMin": "Password must be at least 8 characters",
    "passwordNumber": "Password must contain at least one number",
    "passwordRequired": "Password is required",
    "passwordsDoNotMatch": "Passwords do not match",
    "passwordUppercase": "Password must contain at least one uppercase letter"
  }
};


// ============================================================
// DEEP MERGE UTILITY
// ============================================================
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ============================================================
// SORT KEYS RECURSIVELY
// ============================================================
function sortKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
  const sorted = {};
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  for (const key of keys) {
    sorted[key] = sortKeys(obj[key]);
  }
  return sorted;
}

// ============================================================
// FIX DUPLICATE KEYS IN EN.JSON
// ============================================================
function fixDuplicateKeys(content) {
  // The file has duplicate "common.time" keys - first with am/pm, second with hourAbbr/minuteAbbr
  // JSON.parse takes the last one, losing am/pm. We need to merge them.
  // Also duplicate common.gotIt and common.select

  // We fix this by ensuring our merge adds the combined time object
  // The properEnglish already has the merged time object
  return content;
}

// ============================================================
// MAIN EXECUTION
// ============================================================
function main() {
  console.log('Reading en.json...');
  const enRaw = fs.readFileSync('src/i18n/locales/en.json', 'utf8');
  let en = JSON.parse(enRaw);

  // Fix: The duplicate common.time key means am/pm may be lost
  // Ensure both sets of time values exist
  if (en.common && en.common.time) {
    en.common.time = {
      am: 'AM',
      pm: 'PM',
      hourAbbr: en.common.time.hourAbbr || 'Hr',
      minuteAbbr: en.common.time.minuteAbbr || 'Min',
      ...en.common.time
    };
    // Force the am/pm back in case they were overwritten
    en.common.time.am = 'AM';
    en.common.time.pm = 'PM';
  }

  console.log('Merging translations...');
  en = deepMerge(en, properEnglish);

  // Sort top-level keys for consistency
  const sorted = sortKeys(en);

  console.log('Writing en.json...');
  fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  console.log('en.json updated successfully!');

  // Count keys
  function countKeys(obj, prefix = '') {
    let count = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        count += countKeys(value, prefix + key + '.');
      } else {
        count++;
      }
    }
    return count;
  }

  console.log(`Total keys in en.json: ${countKeys(sorted)}`);
}

main();
