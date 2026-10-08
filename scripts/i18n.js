// scripts/i18n.js
// Multilingual Support for Iqbal Fashion Tailoring ERP (English, Marathi, Hindi)
// Persistent in localStorage across all devices and sessions

const I18N_DICTIONARY = {
  en: {
    app_title: "Iqbal Fashion",
    app_subtitle: "Tailoring Order Tracking ERP",
    nav_orders: "Orders in Progress",
    nav_new_order: "+ Book New Order",
    nav_customers: "Customers",
    nav_staff: "Tailor Staff",
    nav_history: "Activity Log",
    nav_notifications: "Notifications",
    nav_settings: "Settings",
    nav_reports: "Reports & Stats",
    nav_logout: "Sign Out",

    // Stages
    stage_all: "All Orders",
    stage_measurement: "Measurement",
    stage_washing: "Washing",
    stage_cutting: "Cutting",
    stage_stitching: "Stitching",
    stage_finishing: "Finishing / Ironing",
    stage_ready: "Ready for Pickup",
    stage_delivered: "Delivered",

    // Headers & Labels
    page_current_orders: "Orders in Progress",
    page_current_orders_sub: "Track exactly where every garment is in the tailoring shop",
    btn_book_order: "+ Book New Order",
    search_placeholder: "Search customer, mobile, order #, cloth material...",
    total_active_orders: "Active Orders",
    no_orders_found: "No orders found in this stage.",
    
    // Card fields
    order_no: "Order",
    customer: "Customer",
    phone: "Mobile",
    garment: "Garment",
    cloth: "Cloth Material",
    quantity: "Qty",
    expected_delivery: "Delivery Date",
    current_step: "Current Step",
    assigned_worker: "Assigned Tailor",
    move_to_next: "Move to Next Step ➔",
    change_step: "Change Step",
    call_customer: "Call",
    whatsapp_receipt: "WhatsApp",
    view_details: "View Order Receipt",
    overdue_badge: "OVERDUE",
    due_today: "Due Today",
    days_left: "days left",
    
    // Actions & Toasts
    stage_updated_success: "Order moved to",
    refreshing: "Refreshing live data...",
    connected: "Connected",
    offline: "Offline",
    admin_badge: "ADMIN",
    quick_advance: "Advance",
    save: "Save",
    cancel: "Cancel",
    // Extended Common UI Strings
    nav_orders_board: "Orders Board",
    print_slip: "Print Slip",
    back_to_orders: "Back to Orders",
    save_order: "Save & Book Order",
    customer_name: "Customer Name",
    mobile_no: "Mobile Number",
    garment_type: "Garment Type",
    cloth_material: "Cloth Material",
    notes: "Notes / Special Instructions",
    refresh: "Refresh",
    online: "Online",
    shop_dashboard: "Shop Dashboard",
    workflow_demo_btn: "Workflow Guide (Demo)",
    workflow_guide_title: "Iqbal Fashion - Shop Workflow Guide"
  },
  mr: {
    app_title: "इक्बाल फॅशन",
    app_subtitle: "टेलरिंग ऑर्डर ट्रॅकिंग प्रणाली",
    nav_orders: "चालू ऑर्डर्स",
    nav_new_order: "+ नवीन ऑर्डर नोंदवा",
    nav_customers: "ग्राहक यादी",
    nav_staff: "कारागीर (स्टाफ)",
    nav_history: "नोंदी (इतिहास)",
    nav_notifications: "सूचना",
    nav_settings: "सेटिंग्ज",
    nav_reports: "अहवाल व आकडेवारी",
    nav_logout: "लॉगआउट",

    // Stages
    stage_all: "सर्व ऑर्डर्स",
    stage_measurement: "मोजमाप",
    stage_washing: "धुलाई",
    stage_cutting: "कटिंग",
    stage_stitching: "शिलाई",
    stage_finishing: "फिनिशिंग / इस्त्री",
    stage_ready: "तयार (पिकअप)",
    stage_delivered: "डिलिव्हरी झाली",

    // Headers & Labels
    page_current_orders: "चालू ऑर्डर्स",
    page_current_orders_sub: "कोणता कपडा सध्या कोणत्या कारागिराकडे आणि कोणत्या पायरीवर आहे ते पहा",
    btn_book_order: "+ नवीन ऑर्डर नोंदवा",
    search_placeholder: "ग्राहकाचे नाव, मोबाईल, ऑर्डर क्र., कापड शोधा...",
    total_active_orders: "एकूण चालू ऑर्डर्स",
    no_orders_found: "या पायरीवर सध्या कोणतीही ऑर्डर नाही.",
    
    // Card fields
    order_no: "ऑर्डर क्र.",
    customer: "ग्राहक",
    phone: "मोबाईल",
    garment: "कपडा प्रकार",
    cloth: "कापड / मटेरियल",
    quantity: "नग",
    expected_delivery: "डिलिव्हरी तारीख",
    current_step: "सध्याची पायरी",
    assigned_worker: "कारागीर",
    move_to_next: "पुढील पायरीवर पाठवा ➔",
    change_step: "पायरी बदला",
    call_customer: "कॉल करा",
    whatsapp_receipt: "व्हॉट्सॲप",
    view_details: "तपशील / पावती पहा",
    overdue_badge: "उशीर झाला (OVERDUE)",
    due_today: "आज डिलिव्हरी",
    days_left: "दिवस शिल्लक",
    
    // Actions & Toasts
    stage_updated_success: "ऑर्डर पुढील पायरीवर पाठवली: ",
    refreshing: "माहिती अपडेट होत आहे...",
    connected: "कनेक्टेड",
    offline: "ऑफलाईन",
    admin_badge: "अॅडमिन",
    quick_advance: "पुढे पाठवा",
    save: "सेव्ह करा",
    cancel: "रद्द करा",
    confirm: "खात्री करा",

    // Extended Common UI Strings
    nav_orders_board: "ऑर्डर फलक",
    print_slip: "पावती छापा",
    back_to_orders: "चालू ऑर्डर्सकडे परत जा",
    save_order: "ऑर्डर नोंदवा व सेव्ह करा",
    customer_name: "ग्राहकाचे नाव",
    mobile_no: "मोबाईल नंबर",
    garment_type: "कपड्याचा प्रकार",
    cloth_material: "कापड / मटेरियल",
    notes: "विशेष सूचना / टीप",
    refresh: "रीफ्रेश",
    online: "ऑनलाईन",
    shop_dashboard: "दुकान अहवाल",
    workflow_demo_btn: "दुकान कार्यप्रणाली (Demo)",
    workflow_guide_title: "इक्बाल फॅशन - दुकान कार्यप्रणाली मार्गदर्शक"
  },
  hi: {
    app_title: "इकबाल फैशन",
    app_subtitle: "टेलरिंग ऑर्डर ट्रैकिंग सिस्टम",
    nav_orders: "चालू ऑर्डर्स",
    nav_new_order: "+ नया ऑर्डर जोड़ें",
    nav_customers: "ग्राहक सूची",
    nav_staff: "कारीगर (स्टाफ)",
    nav_history: "इतिहास / रिकॉर्ड",
    nav_notifications: "सूचनाएं",
    nav_settings: "सेटिंग्स",
    nav_reports: "रिपोर्ट और आंकड़े",
    nav_logout: "लॉगआउट",

    // Stages
    stage_all: "सभी ऑर्डर्स",
    stage_measurement: "नाप (मेजरमेंट)",
    stage_washing: "धुलाई",
    stage_cutting: "कटिंग",
    stage_stitching: "सिलाई",
    stage_finishing: "फिनिशिंग / प्रेस",
    stage_ready: "तैयार (पिकअप)",
    stage_delivered: "डिलीवर हो गया",

    // Headers & Labels
    page_current_orders: "चालू ऑर्डर्स",
    page_current_orders_sub: "देखें कि कौन सा कपड़ा किस कारीगर के पास और किस काम में है",
    btn_book_order: "+ नया ऑर्डर जोड़ें",
    search_placeholder: "ग्राहक का नाम, मोबाइल, ऑर्डर नंबर, कपड़ा खोजें...",
    total_active_orders: "कुल सक्रिय ऑर्डर्स",
    no_orders_found: "इस चरण में वर्तमान में कोई ऑर्डर नहीं है।",
    
    // Card fields
    order_no: "ऑर्डर नं.",
    customer: "ग्राहक",
    phone: "मोबाइल",
    garment: "कपड़े का प्रकार",
    cloth: "कपड़ा / मटेरियल",
    quantity: "संख्या",
    expected_delivery: "डिलीवरी तिथि",
    current_step: "वर्तमान चरण",
    assigned_worker: "कारीगर",
    move_to_next: "अगले चरण में भेजें ➔",
    change_step: "चरण बदलें",
    call_customer: "कॉल करें",
    whatsapp_receipt: "व्हाट्सएप",
    view_details: "रसीद / विवरण देखें",
    overdue_badge: "देरी हुई (OVERDUE)",
    due_today: "आज डिलीवरी",
    days_left: "दिन शेष",
    
    // Actions & Toasts
    stage_updated_success: "ऑर्डर अगले चरण में भेजा गया: ",
    refreshing: "डेटा रीफ्रेश हो रहा है...",
    connected: "कनेक्टेड",
    offline: "ऑफलाइन",
    admin_badge: "एडमिन",
    quick_advance: "आगे बढ़ाएं",
    save: "सेव करें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",

    // Extended Common UI Strings
    nav_orders_board: "ऑर्डर बोर्ड",
    print_slip: "रसीद प्रिंट करें",
    back_to_orders: "चालू ऑर्डर्स पर वापस जाएं",
    save_order: "ऑर्डर सेव करें",
    customer_name: "ग्राहक का नाम",
    mobile_no: "मोबाइल नंबर",
    garment_type: "कपड़े का प्रकार",
    cloth_material: "कपड़ा / मटेरियल",
    notes: "विशेष निर्देश / नोट",
    refresh: "रिफ्रेश",
    online: "ऑनलाइन",
    shop_dashboard: "दुकान रिपोर्ट",
    workflow_demo_btn: "दुकान कार्यप्रणाली (Demo)",
    workflow_guide_title: "इकबाल फैशन - दुकान कार्यप्रणाली गाइड"
  }
};

// Auto-inject CSS for lang-switcher across all pages
(function injectLangStyles() {
  if (typeof document === 'undefined') return;
  const styleId = 'i18n-auto-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .lang-switcher {
        display: inline-flex;
        align-items: center;
        background-color: #F1F5F9;
        border-radius: 20px;
        padding: 2px;
        border: 1px solid #CBD5E1;
        gap: 2px;
        flex-shrink: 0;
      }
      .lang-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 16px;
        color: #64748B;
        transition: all 0.15s ease;
        line-height: 1.2;
      }
      .lang-btn.active {
        background-color: #12306B !important;
        color: #FFFFFF !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .lang-btn:hover:not(.active) {
        color: #12306B;
      }
    `;
    document.head.appendChild(style);
  }
})();

// Global active language getter & setter
window.currentLanguage = localStorage.getItem('iqbal_lang') || 'mr'; // Marathi as friendly default for Maharashtra/local shop

function t(key) {
  const lang = window.currentLanguage || 'mr';
  const dict = I18N_DICTIONARY[lang] || I18N_DICTIONARY['en'];
  return dict[key] || I18N_DICTIONARY['en'][key] || key;
}

function setLanguage(lang) {
  if (!I18N_DICTIONARY[lang]) return;
  window.currentLanguage = lang;
  localStorage.setItem('iqbal_lang', lang);
  applyTranslations();
  if (typeof window.onLanguageChange === 'function') {
    window.onLanguageChange(lang);
  }
}

function applyTranslations() {
  const lang = window.currentLanguage;
  
  // Update all data-i18n text
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && t(key)) {
      el.textContent = t(key);
    }
  });

  // Update all data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && t(key)) {
      el.setAttribute('placeholder', t(key));
    }
  });

  // Update language switcher active buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Stage progress map for quick 1-click next stage
const STAGE_SEQUENCE = ['measurement', 'washing', 'cutting', 'stitching', 'finishing', 'ready', 'delivered'];

function getNextStage(currentStage) {
  const idx = STAGE_SEQUENCE.indexOf(currentStage);
  if (idx >= 0 && idx < STAGE_SEQUENCE.length - 1) {
    return STAGE_SEQUENCE[idx + 1];
  }
  return null;
}

function getStageName(stageKey) {
  const map = {
    measurement: t('stage_measurement'),
    washing: t('stage_washing'),
    cutting: t('stage_cutting'),
    stitching: t('stage_stitching'),
    finishing: t('stage_finishing'),
    ready: t('stage_ready'),
    delivered: t('stage_delivered')
  };
  return map[stageKey] || stageKey;
}

// Inject language switcher HTML into navigation
function renderLanguageSwitcher() {
  const container = document.getElementById('langSwitcherContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="lang-switcher">
      <button type="button" class="lang-btn ${window.currentLanguage === 'mr' ? 'active' : ''}" data-lang="mr" onclick="setLanguage('mr')">मराठी</button>
      <button type="button" class="lang-btn ${window.currentLanguage === 'hi' ? 'active' : ''}" data-lang="hi" onclick="setLanguage('hi')">हिंदी</button>
      <button type="button" class="lang-btn ${window.currentLanguage === 'en' ? 'active' : ''}" data-lang="en" onclick="setLanguage('en')">EN</button>
    </div>
  `;
}

// Global 12-Hour AM/PM Time Formatters
function format12HourTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

function format12HourDateTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const time = format12HourTime(d);
  return `${day} ${month} ${year}, ${time}`;
}

window.format12HourTime = format12HourTime;
window.format12HourDateTime = format12HourDateTime;

document.addEventListener('DOMContentLoaded', () => {
  renderLanguageSwitcher();
  applyTranslations();
});

