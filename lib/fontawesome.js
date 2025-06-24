// File: lib/fontawesome.js
import { library } from '@fortawesome/fontawesome-svg-core';
import { config } from '@fortawesome/fontawesome-svg-core';
import {
  // Navigation & UI
  faBars,
  faTimes,
  faUser,
  faSignInAlt,
  faSignOutAlt,
  faUserPlus,
  faHome,
  faSearch,
  faFilter,
  
  // Umrah & Travel
  faKaaba,
  faPlane,
  faHotel,
  faMapMarkerAlt,
  faCalendarAlt,
  faCalendarDay,
  faClock,
  faGlobe,
  faStar,
  faStarHalfAlt,
  
  // Business & Money
  faDollarSign,
  faMoneyBillWave,
  faCreditCard,
  faPercentage,
  
  // People & Groups
  faUsers,
  faUserTie,
  faUserFriends,
  faUserCheck,
  faBuilding,
  
  // Communication
  faPhone,
  faEnvelope,
  faComments,
  faHeadset,
  
  // Status & Actions
  faCheck,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimesCircle,
  faEdit,
  faTrash,
  faEye,
  faPlus,
  faMinus,
  faArrowRight,
  faArrowLeft,
  faChevronDown,
  faChevronUp,
  faChevronRight,
  faChevronLeft,
  
  // Features & Services
  faShieldAlt,
  faAward,
  faMedal,
  faHandshake,
  faThumbsUp,
  faCog,
  faTools,
  
  // Data & Analytics
  faChartLine,
  faChartBar,
  faChartPie,
  
  // Time & Calendar
  faClock as faClockSolid,
  faCalendar,
  faCalendarCheck,
  
  // Location & Travel
  faSuitcase,
  faPassport,
  faTicketAlt,
  faBed,
  faUtensils,
  faCar,
  faBus,
  
  // Ratings & Reviews
  faHeart,
  faThumbsDown,
  faComment,
  
  // Loading & States
  faSpinner,
  faCircleNotch,
  
  // Documents & Files
  faFileAlt,
  faDownload,
  faUpload,
  faPrint,
  faClipboardList,
  faListCheck,
  faImages,
  faCamera,
  faLightbulb,
  faExchangeAlt,
  faTag,
  faBookmark,
  
  // Security & Trust
  faLock,
  faUnlock,
  faKey,
  faFingerprint,
  
  // Social & Sharing
  faShare,
  faShareAlt,
  faLink,
  
  // Notifications & Alerts
  faBell,
  faExclamation,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';

import {
  // Regular icons for outline versions
  faCalendar as faCalendarRegular,
  faUser as faUserRegular,
  faHeart as faHeartRegular,
  faStar as faStarRegular,
  faComments as faCommentsRegular,
  faBuilding as faBuildingRegular,
} from '@fortawesome/free-regular-svg-icons';

import {
  // Social media brands
  faFacebook,
  faTwitter,
  faInstagram,
  faWhatsapp,
  faTelegram,
  faGoogle,
  faApple,
} from '@fortawesome/free-brands-svg-icons';

// Configure FontAwesome for SSR compatibility
config.autoAddCss = false;
config.keepOriginalSource = false;

// Add icons to the library
library.add(
  // Solid icons
  faBars,
  faTimes,
  faUser,
  faSignInAlt,
  faSignOutAlt,
  faUserPlus,
  faHome,
  faSearch,
  faFilter,
  faKaaba,
  faPlane,
  faHotel,
  faMapMarkerAlt,
  faCalendarAlt,
  faCalendarDay,
  faClock,
  faGlobe,
  faStar,
  faStarHalfAlt,
  faDollarSign,
  faMoneyBillWave,
  faCreditCard,
  faPercentage,
  faUsers,
  faUserTie,
  faUserFriends,
  faUserCheck,
  faBuilding,
  faPhone,
  faEnvelope,
  faComments,
  faHeadset,
  faCheck,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimesCircle,
  faEdit,
  faTrash,
  faEye,
  faPlus,
  faMinus,
  faArrowRight,
  faArrowLeft,
  faChevronDown,
  faChevronUp,
  faChevronRight,
  faChevronLeft,
  faShieldAlt,
  faAward,
  faMedal,
  faHandshake,
  faThumbsUp,
  faCog,
  faTools,
  faChartLine,
  faChartBar,
  faChartPie,
  faClockSolid,
  faCalendar,
  faCalendarCheck,
  faSuitcase,
  faPassport,
  faTicketAlt,
  faBed,
  faUtensils,
  faCar,
  faBus,
  faHeart,
  faThumbsDown,
  faComment,
  faSpinner,
  faCircleNotch,
  faFileAlt,
  faDownload,
  faUpload,
  faPrint,
  faLock,
  faUnlock,
  faKey,
  faFingerprint,
  faShare,
  faShareAlt,
  faLink,
  faBell,
  faExclamation,
  faQuestionCircle,
  faClipboardList,
  faListCheck,
  faImages,
  faCamera,
  faLightbulb,
  faExchangeAlt,
  faTag,
  faBookmark,
  
  // Regular icons
  faCalendarRegular,
  faUserRegular,
  faHeartRegular,
  faStarRegular,
  faCommentsRegular,
  faBuildingRegular,
  
  // Brand icons
  faFacebook,
  faTwitter,
  faInstagram,
  faWhatsapp,
  faTelegram,
  faGoogle,
  faApple
);