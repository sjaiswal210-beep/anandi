'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'mr' | 'hi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const DICTIONARIES: Record<Language, Record<string, string>> = {
  mr: {
    // Navbar
    'nav.overview': 'विहंगावलोकन',
    'nav.plans': 'प्लॉटचे आकार',
    'nav.amenities': 'वैशिष्ट्ये',
    'nav.location': 'पत्ता',
    'nav.insights': 'ब्लॉग',
    'nav.contact': 'संपर्क',
    'nav.book': 'भेट बुक करा',

    // Hero
    'hero.badge': 'क्लिअर टायटल · तात्काळ खरेदीखत आणि नोंदणी योग्य',
    'hero.title': 'पुणे पूर्व मध्ये स्वतःच्या मालकीची जागा खरेदी करा',
    'hero.sub': 'बकोरी, वाघोली येथे १००० ते ४५१० चौ.फू. चे प्रीमियम निवासी प्लॉट्स. क्लिअर टायटल, भव्य गेटेड लेआउट आणि तात्काळ नोंदणी योग्य.',
    'hero.cta': 'मोफत साईट विजिट बुक करा',
    'hero.whatsapp': 'व्हाट्सएप संपर्क',
    'hero.price': 'किंमत फक्त ₹१८ लाख पासून पुढे (सर्व समावेशक)',
    'hero.location': 'बकोरी, वाघोली, पुणे',
    'hero.status': 'खरेदीखतासाठी तयार',

    // Stats
    'stats.plots': 'एकूण प्लॉट्स',
    'stats.sizes': 'प्लॉटचे आकार',
    'stats.roads': 'रुंद अंतर्गत रस्ते',
    'stats.titles': 'टायटल प्रकार',
    'unit.plots': 'प्लॉट्स',
    'unit.sizes': 'चौ.फूट',
    'unit.roads': 'फूट रस्ते',
    'unit.titles': 'क्लिअर',

    // About
    'about.tag': 'प्रकल्पाबद्दल',
    'about.title': 'आनंदी पार्क — तुमच्या स्वप्नातील घरासाठी हक्काची जागा',
    'about.p1': 'रिच-लैंड डेव्हलपर्स सादर करत आहेत "आनंदी पार्क", बकोरी-वाघोली येथील अत्यंत आधुनिक आणि सुसज्ज ८४ प्रीमियम निवासी प्लॉट्सचा भव्य प्रकल्प. हा प्रकल्प तुमच्या कुटुंबाला निसर्गाच्या सानिध्यात, प्रदूषणापासून दूर आणि सर्व सुख-सोयींनी युक्त असे समृद्ध जीवन देतो.',
    'about.p2': 'खारीडी आयटी पार्क, वाघोली आणि आगामी पुणे रिंग रोडपासून अवघ्या काही मिनिटांच्या अंतरावर असल्याने, हा पुणे पूर्वमधील सर्वात वेगाने वाढणारा आणि सर्वाधिक परतावा देणारा सुरक्षित गुंतवणूक पर्याय आहे.',
    'about.f1': '८४ स्वतंत्र निवासी प्लॉट्स',
    'about.f2': '३० आणि ४० फुटांचे डांबरी रस्ते',
    'about.f3': 'बँक लोन व पूर्ण सरकारी कागदपत्रे उपलब्ध',
    'about.f4': 'निसर्गरम्य बकोरी टेकड्यांच्या कुशीत वसलेला प्रकल्प',

    // Configurations
    'config.title': 'प्लॉटचे विविध पर्याय आणि प्रकार',
    'config.sub': 'तुमच्या बजेट आणि गरजेनुसार योग्य प्लॉट निवडा. गुंठेवारी आणि आर-झोन क्लिअर प्लॉट्स उपलब्ध.',
    'config.carpet': 'क्षेत्रफळ:',
    'config.price': 'किंमत:',
    'config.ideal': 'योग्य:',
    'config.avail': 'प्लॉट्स शिल्लक:',
    'config.btn': 'माहिती व नकाशा मिळवा',

    // Amenities
    'amen.tag': 'जागतिक दर्जाच्या सुविधा',
    'amen.title': 'तुमच्या कुटुंबासाठी सुरक्षित आणि सुसज्ज जीवनशैली',
    'amen.road': '३० आणि ४० फुटांचे अंतर्गत रस्ते',
    'amen.gate': 'भव्य प्रवेशद्वार आणि वॉचमन केबिन',
    'amen.water': '२४/७ पाणी पुरवठा पाईपलाईन',
    'amen.elect': 'अंडरग्राउंड वीज वाहिनी',
    'amen.drain': 'पावसाळी पाण्याचा निचरा यंत्रणा',
    'amen.garden': 'मध्यवर्ती सुशोभित बाग',
    'amen.kids': 'लहान मुलांसाठी खेळण्याची जागा',
    'amen.security': 'सुरक्षा रक्षक आणि सीसीटीव्ही कॅमेरे',
    'amen.wall': 'सुरक्षित सिमेंट कंपाऊंड वॉल',
    'amen.lights': 'रस्त्यावरील एलईडी पथदिवे',
    'amen.trees': 'रस्त्याच्या दुतर्फा वृक्षारोपण',
    'amen.open': 'खुली सांस्कृतिक आणि क्रीडा जागा',

    // Video Tour
    'tour.tag': 'Cinematic AI आभासी सफर',
    'tour.title': 'आनंदी पार्कची विहंगम दृश्ये',
    'tour.sub': 'आमच्या भव्य लेआउटवरून एक डिजिटल सफर करा. आमच्या प्रिमियम सोयी-सुविधांची माहिती मिळवण्यासाठी खालील AI आवाजातील प्रेझेंटेशन चालू करा.',
    'tour.narrator': 'AI आवाज प्रेझेंटेशन',
    'tour.subtext': 'प्लॉटची माहिती देण्यासाठी खालील भाषा निवडा आणि ऑडिओ ऐका:',
    'tour.btn.hi': 'हिंदी ऑडिओ सुरू करा',
    'tour.btn.mr': 'मराठी ऑडिओ (१.२x) सुरू करा',
    'tour.btn.pause': 'ऑटो-प्ले थांबवा',
    'tour.btn.resume': 'ऑटो-प्ले सुरू करा',

    // Location
    'loc.tag': 'भौगोलिक स्थान',
    'loc.title': 'मोक्याचे स्थान, उत्तम कनेक्टिव्हिटी',
    'loc.btn': 'गुगल मॅपवर उघडा',

    // Testimonials
    'test.tag': 'ग्राहकांचे अभिप्राय',
    'test.title': 'आमच्या आनंदी कुटुंबाचे अनुभव',

    // FAQ
    'faq.tag': 'नेहमी विचारले जाणारे प्रश्न',
    'faq.title': 'खरेदीदारांचे नेहमीचे प्रश्न व उत्तरे',

    // Contact
    'contact.tag': 'साईट भेट बुक करा',
    'contact.title': 'आजच तुमची मोफत साईट व्हिजिट बुक करा',
    'contact.sub': 'पुणे शहर परिसरातून मोफत पिकअप आणि ड्रॉप सुविधा उपलब्ध. खालील फॉर्म भरा, आमची टीम तुम्हाला तात्काळ संपर्क करेल.',
    'contact.name': 'पूर्ण नाव',
    'contact.phone': 'मोबाईल नंबर',
    'contact.email': 'ईमेल आयडी',
    'contact.date': 'भेटीची तारीख',
    'contact.submit': 'मोफत साईट व्हिजिट बुक करा',
    'contact.success': 'धन्यवाद! तुमची साईट भेट यशस्वीरित्या नोंदवली गेली आहे. आमची टीम तुम्हाला लवकरच संपर्क करेल.',

    // Footer
    'foot.sub': 'आनंदी पार्क — बकोरी, वाघोली येथे प्रीमियम निवासी प्लॉट्स. रिच-लँड डेव्हलपर्स आणि युवराज गाडे व राजन कुटे यांचा अधिकृत प्रकल्प.',
    'foot.rights': 'सर्व हक्क राखीव.',
    'foot.impress': 'चित्रे काल्पनिक आणि कलाकाराचे कल्पनाविलास आहेत.'
  },
  hi: {
    // Navbar
    'nav.overview': 'अवलोकन',
    'nav.plans': 'प्लॉट साइज',
    'nav.amenities': 'सुविधाएं',
    'nav.location': 'लोकेशन',
    'nav.insights': 'ब्लॉग',
    'nav.contact': 'संपर्क',
    'nav.book': 'विजिट बुक करें',

    // Hero
    'hero.badge': 'क्लियर टाइटल · तत्काल रजिस्ट्री और नामांतरण योग्य',
    'hero.title': 'पुणे ईस्ट में खुद की जमीन खरीदने का सुनहरा मौका',
    'hero.sub': 'बकोरी, वाघोली में 1000 से 4510 वर्ग फीट के प्रीमियम आवासीय प्लॉट्स। क्लियर टाइटल, भव्य गेटेड लेआउट और तत्काल रजिस्ट्री योग्य।',
    'hero.cta': 'फ्री साइट विजिट बुक करें',
    'hero.whatsapp': 'व्हाट्सएप संपर्क',
    'hero.price': 'कीमत केवल ₹18 लाख से शुरू (सब कुछ शामिल)',
    'hero.location': 'बकोरी, वाघोली, पुणे',
    'hero.status': 'रजिस्ट्री के लिए तैयार',

    // Stats
    'stats.plots': 'कुल प्लॉट्स',
    'stats.sizes': 'प्लॉट साइज',
    'stats.roads': 'चौड़ी आंतरिक सड़कें',
    'stats.titles': 'टाइटल प्रकार',
    'unit.plots': 'प्लॉट्स',
    'unit.sizes': 'वर्ग फीट',
    'unit.roads': 'फीट सड़कें',
    'unit.titles': 'क्लियर',

    // About
    'about.tag': 'प्रोजेक्ट के बारे में',
    'about.title': 'आनंदी पार्क — आपके सपनों के आशियाने की सही जगह',
    'about.p1': 'रिच-लैंड डेवलपर्स प्रस्तुत करते हैं "आनंदी पार्क", बकोरी-वाघोली में आधुनिक सुविधाओं से लैस 84 प्रीमियम आवासीय प्लॉट्स का शानदार प्रोजेक्ट। यह प्रोजेक्ट आपके परिवार को प्रकृति की गोद में, प्रदूषण मुक्त और सभी सुख-सुविधाओं से संपन्न जीवन देता है।',
    'about.p2': 'खराड़ी आईटी पार्क, वाघोली और आगामी पुणे रिंग रोड से मात्र कुछ ही मिनटों की दूरी पर होने के कारण, यह पुणे ईस्ट का सबसे तेजी से बढ़ता और सबसे सुरक्षित निवेश विकल्प है।',
    'about.f1': '84 स्वतंत्र आवासीय प्लॉट्स',
    'about.f2': '30 और 40 फीट की पक्की डामर सड़कें',
    'about.f3': 'बैंक लोन और सरकारी दस्तावेज उपलब्ध',
    'about.f4': 'खूबसूरत बकोरी पहाड़ियों की गोद में स्थित',

    // Configurations
    'config.title': 'प्लॉट के विभिन्न विकल्प और साइज',
    'config.sub': 'अपने बजट और आवश्यकता के अनुसार सही प्लॉट चुनें। गुंठेवारी और आर-जोन क्लियर प्लॉट्स उपलब्ध।',
    'config.carpet': 'क्षेत्रफल:',
    'config.price': 'कीमत:',
    'config.ideal': 'उपयुक्त:',
    'config.avail': 'प्लॉट्स बचे हैं:',
    'config.btn': 'जानकारी और नक्शा पाएं',

    // Amenities
    'amen.tag': 'विश्वस्तरीय सुविधाएं',
    'amen.title': 'आपके परिवार के लिए सुरक्षित और सुसज्जित जीवनशैली',
    'amen.road': '30 और 40 फीट की आंतरिक सड़कें',
    'amen.gate': 'भव्य प्रवेश द्वार और सुरक्षा गार्ड केबिन',
    'amen.water': '24/7 पानी की आपूर्ति लाइन',
    'amen.elect': 'भूमिगत (Underground) बिजली लाइन',
    'amen.drain': 'बरसाती पानी की निकासी प्रणाली',
    'amen.garden': 'सुंदर केंद्रीय बगीचा',
    'amen.kids': 'बच्चों के खेलने का क्षेत्र',
    'amen.security': 'सुरक्षा गार्ड और सीसीटीवी कैमरे',
    'amen.wall': 'मजबूत सिमेंट कंपाउंड दीवार',
    'amen.lights': 'सड़क पर एलईडी स्ट्रीट लाइट्स',
    'amen.trees': 'सड़कों के किनारे वृक्षारोपण',
    'amen.open': 'खुली सांस्कृतिक और खेलकूद की जगह',

    // Video Tour
    'tour.tag': 'Cinematic AI वर्चुअल टूर',
    'tour.title': 'आनंदी पार्क का शानदार नजारा',
    'tour.sub': 'हमारे खूबसूरत लेआउट का एक डिजिटल दौरा करें। हमारी प्रीमियम सुविधाओं की जानकारी पाने के लिए नीचे दिए गए AI आवाज प्रेजेंटेशन को चालू करें।',
    'tour.narrator': 'AI आवाज प्रेजेंटेशन',
    'tour.subtext': 'प्लॉट की जानकारी के लिए नीचे दी गई भाषा चुनें और ऑडियो सुनें:',
    'tour.btn.hi': 'हिंदी ऑडियो शुरू करें',
    'tour.btn.mr': 'मराठी ऑडियो (1.2x) शुरू करें',
    'tour.btn.pause': 'ऑटो-प्ले रोकें',
    'tour.btn.resume': 'ऑटो-play शुरू करें',

    // Location
    'loc.tag': 'भौगोलिक स्थान',
    'loc.title': 'मुख्य स्थान, बेहतरीन कनेक्टिविटी',
    'loc.btn': 'गूगल मैप पर खोलें',

    // Testimonials
    'test.tag': 'ग्राहकों के अनुभव',
    'test.title': 'हमारे खुशहाल परिवार के विचार',

    // FAQ
    'faq.tag': 'अक्सर पूछे जाने वाले प्रश्न',
    'faq.title': 'खरीदारों के सामान्य प्रश्न व उत्तर',

    // Contact
    'contact.tag': 'साइट विजिट बुक करें',
    'contact.title': 'आज ही अपनी फ्री साइट विजिट बुक करें',
    'contact.sub': 'पुणे शहर क्षेत्र से फ्री पिकअप और ड्रॉप सुविधा उपलब्ध। नीचे दिए गए फॉर्म को भरें, हमारी टीम आपसे तुरंत संपर्क करेगी.',
    'contact.name': 'पूरा नाम',
    'contact.phone': 'मोबाइल नंबर',
    'contact.email': 'ईमेल आईडी',
    'contact.date': 'विजिट की तारीख',
    'contact.submit': 'फ्री साइट विजिट बुक करें',
    'contact.success': 'धन्यवाद! आपकी साइट विजिट सफलतापूर्वक दर्ज कर ली गई है। हमारी टीम जल्द ही आपसे संपर्क करेगी।',

    // Footer
    'foot.sub': 'आनंदी पार्क — बकोरी, वाघोली में प्रीमियम आवासीय प्लॉट्स। रिच-लैंड डेवलपर्स और युवराज गाडे व राजन कुटे का आधिकारिक प्रोजेक्ट।',
    'foot.rights': 'सर्वाधिकार सुरक्षित।',
    'foot.impress': 'दिए गए चित्र काल्पनिक और कलात्मक चित्रण हैं।'
  },
  en: {
    // Navbar
    'nav.overview': 'Overview',
    'nav.plans': 'Plot Sizes',
    'nav.amenities': 'Amenities',
    'nav.location': 'Location',
    'nav.insights': 'Insights',
    'nav.contact': 'Contact',
    'nav.book': 'Book a Visit',

    // Hero
    'hero.badge': 'Clear Titles · Ready for Registration',
    'hero.title': 'Own your piece of Pune East',
    'hero.sub': 'Premium residential plots from 1000 to 4510 sq.ft. at Bakori, Wagholi. Clear titles, gated layout, ready for registration.',
    'hero.cta': 'Book a Free Site Visit',
    'hero.whatsapp': 'WhatsApp Us',
    'hero.price': 'Starting at ₹18 Lakh (all inclusive)',
    'hero.location': 'Bakori, Wagholi, Pune',
    'hero.status': 'Ready for Registration',

    // Stats
    'stats.plots': 'Total Plots',
    'stats.sizes': 'Plot Sizes',
    'stats.roads': 'Internal Roads',
    'stats.titles': 'Title Status',
    'unit.plots': 'Plots',
    'unit.sizes': 'Sq.ft',
    'unit.roads': 'Ft roads',
    'unit.titles': '100% Clear',

    // About
    'about.tag': 'About the Project',
    'about.title': 'Anandi Park — The Perfect Foundation For Your Dream Home',
    'about.p1': 'Rich-Land Developers presents "Anandi Park", a premium master-planned development of 84 luxury residential plots at Bakori, Wagholi. Designed for families looking for a peaceful hillside lifestyle, this gated community blends absolute security with beautiful nature.',
    'about.p2': 'Situated just minutes away from the Kharadi IT Park, Wagholi, and the upcoming Pune Ring Road corridor, this project is East Pune\'s fastest growing and most profitable real estate investment.',
    'about.f1': '84 Gated Residential Plots',
    'about.f2': '30 & 40 Ft Wide Internal Roads',
    'about.f3': 'Bank Loan & Immediate Registration',
    'about.f4': 'Set against the beautiful Bakori Hills',

    // Configurations
    'config.title': 'Plot Configurations & Sizes',
    'config.sub': 'Choose your perfect layout tailored to your family size and budget. Clear R-Zone plots available.',
    'config.carpet': 'Area:',
    'config.price': 'Price:',
    'config.ideal': 'Ideal For:',
    'config.avail': 'Plots Left:',
    'config.btn': 'Get Layout & Layout PDF',

    // Amenities
    'amen.tag': 'World-Class Amenities',
    'amen.title': 'Thoughtfully Planned Infrastructure For Gated Living',
    'amen.road': '30 & 40 ft Asphalt Internal Roads',
    'amen.gate': 'Landscaped Entrance Gate & Security Cabin',
    'amen.water': '24x7 Water Supply Line Connection',
    'amen.elect': 'Underground Electrical Cabling',
    'amen.drain': 'Storm Water Drainage Network',
    'amen.garden': 'Lush Central Landscape Garden',
    'amen.kids': "Children's Integrated Play Zone",
    'amen.security': 'Security Cabin & CCTV Surveillance',
    'amen.wall': 'RCC Boundary Compound Wall',
    'amen.lights': 'LED Street Lighting System',
    'amen.trees': 'Avenue Tree Plantation',
    'amen.open': 'Multi-purpose Open Amenity Space',

    // Video Tour
    'tour.tag': 'Cinematic AI Interactive Tour',
    'tour.title': 'Experience Anandi Park In HD',
    'tour.sub': 'Take a cinematic virtual flight over your future residential plots. Turn on the AI voiceover to hear our exclusive inaugural layout features.',
    'tour.narrator': 'AI Voiceover Narrator',
    'tour.subtext': 'Select language to play the layout pitch presentation:',
    'tour.btn.hi': 'Play Hindi Voice',
    'tour.btn.mr': 'Play Marathi (1.2x)',
    'tour.btn.pause': 'Pause Auto-Flight',
    'tour.btn.resume': 'Resume Auto-Flight',

    // Location
    'loc.tag': 'Location',
    'loc.title': 'Strategic Location, Connected Living',
    'loc.btn': 'Open in Google Maps',

    // Testimonials
    'test.tag': 'Testimonials',
    'test.title': 'What Our Residents Say',

    // FAQ
    'faq.tag': 'FAQ',
    'faq.title': 'Questions Buyers Ask Us',

    // Contact
    'contact.tag': 'Book a Visit',
    'contact.title': 'Schedule Your Free Site Visit Today',
    'contact.sub': 'Complimentary pickup and drop-off services available across Pune city limits. Fill out the form below and our team will coordinate with you.',
    'contact.name': 'Full Name',
    'contact.phone': 'Phone Number',
    'contact.email': 'Email ID',
    'contact.date': 'Preferred Date',
    'contact.submit': 'Book Free Site Visit',
    'contact.success': 'Thank you! Your site visit request has been logged successfully. Our executive will reach out to you shortly.',

    // Footer
    'foot.sub': 'Anandi Park — Premium Residential Plots at Bakori, Wagholi. Developed by Rich-Land Developers, partnered with Yuvraj Gade and Rajan Kute.',
    'foot.rights': 'All rights reserved.',
    'foot.impress': 'Images are artistic impressions only.'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('mr'); // Default to Marathi (मराठी)

  useEffect(() => {
    const savedLang = localStorage.getItem('anandi_lang') as Language;
    if (savedLang && (savedLang === 'mr' || savedLang === 'hi' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('anandi_lang', lang);
  };

  const t = (key: string): string => {
    return DICTIONARIES[language][key] || DICTIONARIES['mr'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
