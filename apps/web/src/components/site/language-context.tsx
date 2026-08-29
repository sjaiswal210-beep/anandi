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
    'nav.amenities': 'सुविधा आणि वैशिष्ट्ये',
    'nav.location': 'पत्ता आणि नकाशा',
    'nav.insights': 'ब्लॉग',
    'nav.contact': 'संपर्क करा',
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
    'about.tag': 'प्रकल्पाबद्दल माहिती',
    'about.title': 'आनंदी पार्क — तुमच्या स्वप्नातील घरासाठी हक्काची जागा',
    'about.p1': 'रिच-लैंड डेव्हलपर्स सादर करत आहेत "आनंदी पार्क", बकोरी-वाघोली येथील अत्यंत आधुनिक आणि सुसज्ज ८४ प्रीमियम निवासी प्लॉट्सचा भव्य प्रकल्प. हा प्रकल्प तुमच्या कुटुंबाला निसर्गाच्या सानिध्यात, प्रदूषणापासून दूर आणि सर्व सुख-सोयींनी युक्त असे समृद्ध जीवन देतो.',
    'about.p2': 'खारीडी आयटी पार्क, वाघोली आणि आगामी पुणे रिंग रोडपासून अवघ्या काही मिनिटांच्या अंतरावर असल्याने, हा पुणे पूर्वमधील सर्वात वेगाने वाढणारा आणि सर्वाधिक परतावा देणारा सुरक्षित गुंतवणूक पर्याय आहे.',
    'about.f1': '८४ स्वतंत्र निवासी प्लॉट्स',
    'about.f2': '३० आणि ४० फुटांचे डांबरी रस्ते',
    'about.f3': 'बँक लोन व पूर्ण सरकारी कागदपत्रे उपलब्ध',
    'about.f4': 'निसर्गरम्य बकोरी टेकड्यांच्या कुशीत वसलेला प्रकल्प',
    'about.f5': 'तात्काळ खरेदीखत आणि नोंदणी योग्य',

    // Why Us Cards
    'why.title.0': 'क्लिअर आणि मार्केटेबल टायटल्स',
    'why.body.0': 'प्रत्येक निवासी प्लॉट पूर्णपणे क्लिअर टायटलसह येतो — तात्काळ खरेदीखत आणि नवीन बांधकाम सुरू करण्यासाठी तयार.',
    'why.title.1': 'पुणे पूर्व वेगाने वाढणारा कॉरिडॉर',
    'why.body.1': 'खराडी आयटी हब, वाघोली आणि आगामी पुणे रिंग रोड कॉरिडॉरपासून अगदी जवळ — पुणे पूर्वमधील सर्वात वेगाने वाढणारी जागा.',
    'why.title.2': 'भव्य नियोजित गेटेड लेआउट',
    'why.body.2': '३० आणि ४० फुटांचे रुंद अंतर्गत रस्ते, सुरक्षित कंपाऊंड वॉल, एलइडी स्ट्रीट लाईट्स आणि मध्यवर्ती बाग असलेला प्रशस्त ८४ प्लॉट्सचा प्रकल्प.',
    'why.title.3': 'बँक लोन आणि कागदपत्रांचे सहकार्य',
    'why.body.3': 'एसबीआय, एचडीएफसी, आयसीआयसीआय आणि ॲक्सिस बँकेसोबत भागीदारी. कागदपत्रे, बँक लोन आणि नोंदणी प्रक्रिया आम्ही पूर्ण करतो.',

    // Configurations
    'config.title': 'प्लॉटचे विविध पर्याय आणि प्रकार',
    'config.sub': 'तुमच्या बजेट आणि गरजेनुसार योग्य प्लॉट निवडा. गुंठेवारी आणि आर-झोन क्लिअर प्लॉट्स उपलब्ध.',
    'config.carpet': 'क्षेत्रफळ:',
    'config.price': 'किंमत:',
    'config.ideal': 'योग्य:',
    'config.avail': 'शिल्लक',
    'config.btn': 'किंमत आणि नकाशा मिळवा',
    'config.type.0': '१००० चौ.फूट प्लॉट',
    'config.type.1': '१५०० चौ.फूट प्लॉट',
    'config.type.2': '२००० चौ.फूट प्लॉट',
    'config.type.3': '३०००+ चौ.फूट प्लॉट',
    'config.price.0': '₹१८ लाख पासून पुढे',
    'config.price.1': '₹२७ लाख पासून पुढे',
    'config.price.2': '₹३६ लाख पासून पुढे',
    'config.price.3': '₹५४ लाख पासून पुढे',
    'config.ideal.0': 'गुंतवणूक आणि पहिले घर',
    'config.ideal.1': 'स्वतंत्र वैयक्तिक बंगला',
    'config.ideal.2': 'प्रीमियम व्हिला प्लॉट',
    'config.ideal.3': 'कॉर्नर आणि प्रीमियम रस्ता-भिमुख',

    // Amenities
    'amen.tag': 'जागतिक दर्जाच्या सुविधा',
    'amen.title': 'तुमच्या कुटुंबासाठी सुरक्षित आणि सुसज्ज जीवनशैली',
    'amen.road': '३० आणि ४० फुटांचे अंतर्गत रस्ते',
    'amen.gate': 'भव्य प्रवेशद्वार आणि वॉचमन केबिन',
    'amen.water': '२४/७ पाणी पुरवठा पाईपलाईन',
    'amen.elect': 'अंडरग्राउंड वीज वाहिनी',
    'amen.drain': 'पावसाळी पाण्याचा निचरा यंत्रणा',
    'amen.garden': 'मधेवर्ती सुशोभित बाग',
    'amen.kids': 'लहान मुलांसाठी खेळण्याची जागा',
    'amen.security': 'सुरक्षा रक्षक आणि सीसीटीव्ही कॅमेरे',
    'amen.wall': 'सुरक्षित सिमेंट कंपाऊंड वॉल',
    'amen.lights': 'रस्त्यावरील एलईडी पथदिवे',
    'amen.trees': 'रस्त्याच्या दुतर्फा वृक्षारोपण',
    'amen.open': 'खुली सांस्कृतिक आणि क्रीडा जागा',

    // Gallery
    'gallery.tag': 'प्रकल्पाची झलक',
    'gallery.title': 'आनंदी पार्कची विहंगम दृश्ये',
    'gallery.caption.0': 'भव्य मुख्य प्रवेशद्वार संकल्पना',
    'gallery.caption.1': 'सुशोभित मध्यवर्ती हरित बाग',
    'gallery.caption.2': 'लहान मुलांचे खेळण्याचे मैदान',
    'gallery.caption.3': '३० फुटांचे अंतर्गत डांबरी रस्ते',
    'gallery.caption.4': 'निसर्गरम्य टेकडी आणि परिसर',
    'gallery.caption.5': 'संपूर्ण प्रकल्पाचा भव्य विहंगम आराखडा',

    // Video Tour
    'tour.tag': 'Cinematic AI आभासी सफर',
    'tour.title': 'आनंदी पार्कची विहंगम दृश्ये (HD)',
    'tour.sub': 'आमच्या भव्य लेआउटवरून एक डिजिटल सफर करा. आमच्या प्रिमियम सोयी-सुविधांची माहिती मिळवण्यासाठी खालील AI आवाजातील प्रेझेंटेशन चालू करा.',
    'tour.narrator': 'AI आवाज प्रेझेंटेशन',
    'tour.subtext': 'प्लॉटची माहिती घेण्यासाठी खालील भाषा निवडा आणि ऑडिओ ऐका:',
    'tour.playing.hi': 'हिंदी (१.१x) ऑडिओ प्रेझेंटेशन सुरू आहे...',
    'tour.playing.mr': 'मराठी (१.१x) ऑडिओ प्रेझेंटेशन सुरू आहे...',
    'tour.playing.idle': 'प्लॉटची माहिती घेण्यासाठी खालील भाषा निवडा आणि ऑडिओ ऐका:',
    'tour.btn.hi': 'हिंदी ऑडिओ (१.१x) सुरू करा',
    'tour.btn.mr': 'मराठी ऑडिओ (१.१x) सुरू करा',
    'tour.btn.pause': 'ऑटो-प्ले थांबवा',
    'tour.btn.resume': 'ऑटो-प्ले सुरू करा',
    'tour.slide.title.0': 'प्रकल्पाचा भव्य विहंगम नकाशा',
    'tour.slide.body.0': '८४ प्रीमियम प्लॉट्सचा सुवर्ण त्रिकोण लेआउट आणि भरपूर मोकळी जागा.',
    'tour.slide.badge.0': 'ड्रोन दृश्य',
    'tour.slide.title.1': 'निसर्गरम्य बकोरी टेकड्यांच्या पायथ्याशी',
    'tour.slide.body.1': 'आल्हाददायक गार वारा आणि सुंदर डोंगर रांगांची मनमोहक दृश्ये.',
    'tour.slide.badge.1': 'काल्पनिक देखावा',
    'tour.slide.title.2': 'प्रीमियम स्वतंत्र बंगला विकास',
    'tour.slide.body.2': 'तुमच्या कल्पनेतील भव्य बंगला १००0 - ४५१० चौ.फू. च्या रेडी प्लॉट्सवर साकार करा.',
    'tour.slide.badge.2': 'पायाभूत सुविधा',

    // Location & Connectivity
    'loc.tag': 'भौगोलिक स्थान',
    'loc.title': 'मोक्याचे स्थान, उत्तम कनेक्टिव्हिटी',
    'loc.btn': 'गुगल मॅपवर उघडा',
    'loc.conn.0': 'वाघोली चौक',
    'loc.conn.1': 'खराडी आयटी हब',
    'loc.conn.2': 'पुणे विमानतळ',
    'loc.conn.3': 'पुणे रेल्वे स्टेशन',
    'loc.nearby.place.0': 'वाघोली चौक',
    'loc.nearby.note.0': 'खरेदी, रेस्टॉरंट्स आणि मुख्य बस थांबा',
    'loc.nearby.place.1': 'खराडी आयटी पार्क',
    'loc.nearby.note.1': 'EON IT पार्क आणि वर्ल्ड ट्रेड सेंटर',
    'loc.nearby.place.2': 'आगामी पुणे रिंग रोड कॉरिडॉर',
    'loc.nearby.note.2': 'जलद कनेक्टिव्हिटी देणारा रिंग रोड',
    'loc.nearby.place.3': 'फिनिक्स Marketcity',
    'loc.nearby.note.3': 'विमान नगर शॉपिंग आणि मॉल परिसर',
    'loc.nearby.place.4': 'स्टेट बँक (SBI) आणि HDFC शाखा',
    'loc.nearby.note.4': 'तसेच बँक ऑफ महाराष्ट्र जवळ',
    'loc.nearby.place.5': 'डी-मार्ट आणि स्थानिक बाजारपेठ',
    'loc.nearby.note.5': 'वाघोली येथील दैनंदिन खरेदी',
    'loc.nearby.place.6': 'लाईफलाईन हॉस्पिटल आणि क्लिनिक',
    'loc.nearby.note.6': 'तातडीच्या वैद्यकीय सोयी-सुविधा',
    'loc.nearby.place.7': 'लेक्सिकॉन किड्स आणि पोदार स्कूल',
    'loc.nearby.note.7': 'प्रतिष्ठित आंतरराष्ट्रीय शाळा',

    // Testimonials
    'test.tag': 'ग्राहकांचे अभिप्राय',
    'test.title': 'आमच्या आनंदी ग्राहकांचे अनुभव',
    'test.text.0': 'क्लिअर-टायटल प्लॉट्समधील माझी सर्वोत्तम गुंतवणूक! लेआउट खूपच सुंदर आणि सुसज्ज आहे. रिच-लैंड टीमने कागदपत्रे आणि बँक लोनची सर्व प्रक्रिया अवघ्या दोन आठवड्यांत पूर्ण करून दिली.',
    'test.role.0': 'आयटी मॅनेजर, खराडी',
    'test.text.1': 'आम्ही आमचे हक्काचे घर बांधण्यासाठी १५०० चौ.फू. चा प्लॉट घेतला. हा परिसर अत्यंत शांत आणि निसर्गरम्य आहे आणि वाघोलीतील शाळा व हॉस्पिटल अवघ्या ५ मिनिटांवर आहेत. अतिशय उत्तम अनुभव!',
    'test.role.1': 'गृहिणी, वाघोली रहिवासी',
    'test.text.2': 'आनंदी पार्क पुणे पूर्वमधील सर्वात वेगाने वाढणाऱ्या आणि फायदेशीर क्षेत्रात स्थित आहे. या किमतीत पूर्णपणे गेटेड, अंतर्गत रस्ते आणि क्लिअर टायटल असलेले आर-झोन प्लॉट्स मिळणे अशक्य आहे.',
    'test.role.2': 'उद्योजक, पुणे',

    // FAQ
    'faq.tag': 'नेहमी विचारले जाणारे प्रश्न',
    'faq.title': 'खरेदीदारांचे नेहमीचे प्रश्न व उत्तरे',
    'faq.q.0': 'प्रकल्पाचा टायटल स्टेटस आणि झोनिंग काय आहे?',
    'faq.a.0': 'आनंदी पार्क मधील सर्व प्लॉट्स १००% क्लिअर, मार्केटेबल टायटलचे आहेत आणि अधिकृत आर-झोन (R-Zone) कलेक्टर मान्यताप्राप्त आहेत. आम्ही खरेदीदारांना सर्च रिपोर्ट, सातबारा उतारा आणि सर्व कागदपत्रांचे संच देतो.',
    'faq.q.1': 'या प्रकल्पासाठी बँक लोन उपलब्ध आहे का?',
    'faq.a.1': 'होय, आनंदी पार्क हा राष्ट्रीयीकृत आणि खाजगी बँकांमार्फत मंजूर प्रकल्प आहे. स्टेट बँक ऑफ इंडिया (SBI), एचडीएफसी (HDFC), आयसीआयसीआय (ICICI) आणि ॲक्सिस बँकेकडून गृहकर्ज आणि प्लॉट खरेदी कर्ज उपलब्ध आहे.',
    'faq.q.2': 'पाणी, रस्ते आणि वीज पायाभूत सुविधा तयार आहेत का?',
    'faq.a.2': 'होय, संपूर्ण सुविधा तयार आहेत. ३० आणि ४० फुटांचे डांबरी रस्ते, भूमिगत वीज वाहिनी कॉरिडॉर, २४ तास शुद्ध पाणी पुरवठ्याची पाईपलाईन आणि पावसाळी पाण्याचा निचरा होणारी अद्ययावत ड्रेनेज सिस्टीम आधीच तयार करण्यात आली आहे.',
    'faq.q.3': 'प्लॉटची नोंदणी (Registry) कधी आणि कशी होईल?',
    'faq.a.3': 'प्लॉट तात्काळ खरेदीखतासाठी आणि नोंदणीसाठी तयार आहे. आमचा लीगल आणि नोंदणी विभाग खरेदीदारांचे दस्तऐवज, मुद्रांक शुल्क (Stamp Duty) आणि सरकारी खरेदीखत नोंदणीची सर्व प्रक्रिया अवघ्या काही दिवसांत पार पाडतो.',

    // Contact Form
    'contact.tag': 'साईट भेट बुक करा',
    'contact.title': 'आजच तुमची मोफत साईट व्हिजिट बुक करा',
    'contact.sub': 'पुणे शहर परिसरातून मोफत पिकअप आणि ड्रॉप सुविधा उपलब्ध. खालील फॉर्म भरा, आमची टीम तुम्हाला तात्काळ संपर्क करेल.',
    'contact.hours': 'सर्व दिवस सुरू, सकाळी १० ते संध्याकाळी ७',
    'contact.center': 'अनुभव केंद्र आणि साईट पत्ता',
    'contact.name': 'पूर्ण नाव',
    'contact.name.placeholder': 'तुमचे पूर्ण नाव प्रविष्ट करा',
    'contact.phone': 'मोबाईल नंबर',
    'contact.phone.placeholder': '१०-अंकी मोबाईल नंबर',
    'contact.email': 'ईमेल पत्ता',
    'contact.email.placeholder': 'you@email.com (पर्यायी)',
    'contact.config': 'प्लॉटचा प्रकार निवडा',
    'contact.message': 'संदेश किंवा तारीख',
    'contact.message.placeholder': 'पसंतीची भेटीची तारीख, बजेट किंवा इतर प्रश्न...',
    'contact.submit': 'मोफत साईट व्हिजिट बुक करा',
    'contact.submit.another': 'दुसरी चौकशी सबमिट करा',
    'contact.submitting': 'नोंदणी होत आहे...',
    'contact.thankyou': 'धन्यवाद!',
    'contact.success': 'तुमची चौकशी यशस्वीरित्या नोंदवली गेली आहे. आमची टीम मोफत पिकअपसाठी तुमच्याशी संपर्क साधेल.',
    'contact.error.validation': 'कृपया आपले नाव आणि वैध १०-अंकी मोबाईल नंबर प्रविष्ट करा.',
    'contact.error.api': 'तांत्रिक अडचणींमुळे फॉर्म सबमिट करता आला नाही. कृपया कॉल किंवा व्हॉट्सॲपद्वारे संपर्क करा.',
    'contact.disclaimer': 'Form सबमिट करून आपण या प्रकल्पाच्या माहितीसाठी आमच्याशी संपर्क साधण्यास सहमती दर्शवता.',

    // Blog
    'blog.title': 'स्मार्ट प्लॉट खरेदीदारांसाठी उपयुक्त मार्गदर्शक',
    'blog.sub': 'पुणे पूर्वमध्ये निवासी प्लॉटमध्ये गुंतवणूक करण्यापूर्वी आपल्याला माहित असणे आवश्यक असलेली सर्व माहिती.',
    'blog.readmore': 'अधिक वाचा',
    'blog.readmins.suffix': 'मिनिट वाचन',
    'blog.title.0': '२०२६ मध्ये वाघोली पुणे पूर्वमधील सर्वात हुशार प्लॉट गुंतवणूक का आहे',
    'blog.excerpt.0': 'खराडी आयटी क्षेत्रातील तेजीपासून ते आगामी रिंग रोडपर्यंत, वाघोली आणि बकोरी परिसरातील जमीन इतर कोणत्याही पुणे कॉरिडॉरपेक्षा वेगाने का वाढत आहे ते जाणून घ्या.',
    'blog.tag.0': 'गुंतवणूक',
    'blog.title.1': 'प्लॉट की फ्लॅट: १० वर्षांत कोणती गुंतवणूक जास्त संपत्ती निर्माण करते?',
    'blog.excerpt.1': 'जमिनीची किंमत वाढते, इमारतींची घसरण होते. आनंदी पार्कमधील निवासी प्लॉट फ्लॅटपेक्षा उत्तम कामगिरी का करू शकतो याचे सोपे विश्लेषण.',
    'blog.tag.1': 'मार्गदर्शक',
    'blog.title.2': 'पुण्यात प्लॉट खरेदी करत आहात? तुमची ७-मुद्द्यांची कायदेशीर तपासणी',
    'blog.excerpt.2': 'टायटल, सातबारा उतारा, झोन, सीमा आणि बरेच काही — निवासी प्लॉट बुक करण्यापूर्वी तपासण्याच्या सर्व गोष्टी.',
    'blog.tag.2': 'कायदेशीर',

    // Social
    'social.tag': 'सोशल मीडियावर फॉलो करा',
    'social.title': 'सोशल मीडियावर @anandipark',
    'social.caption.0': 'काम सुरू: अंतर्गत ३०/४० फुटांचे पक्के डांबरी रस्ते पूर्ण झाले आहेत.',
    'social.caption.1': 'आनंदी पार्क येथील निवांत निसर्गरम्य सोनेरी संध्याकाळ.',
    'social.caption.2': 'प्रशस्त कॉर्नर प्लॉट्स वेगाने बुक होत आहेत.',
    'social.caption.3': 'आनंदी कुटुंब, हक्काचा स्वतंत्र बंगला प्लॉट बुक केल्याचा आनंद.',
    'social.caption.4': 'मध्यवर्ती हरित बागेचे सुशोभीकरण काम प्रगतीपथावर आहे.',
    'social.caption.5': 'वीकेंड साईट व्हिजिटला उदंड प्रतिसाद - आजच संपर्क साधा.',

    // Footer
    'foot.getintouch': 'संपर्क साधा',
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
    'about.f5': 'तत्काल रजिस्ट्री और नामांतरण योग्य',

    // Why Us Cards
    'why.title.0': 'क्लियर और मार्केटेबल टाइटल्स',
    'why.body.0': 'प्रत्येक आवासीय प्लॉट पूरी तरह से क्लियर टाइटल के साथ आता है — तत्काल रजिस्ट्री और नया निर्माण शुरू करने के लिए तैयार।',
    'why.title.1': 'पुणे ईस्ट तेजी से बढ़ता हुआ कॉरिडोर',
    'why.body.1': 'खराड़ी आईटी हब, वाघोली और आगामी पुणे रिंग रोड कॉरिडोर से बिल्कुल नजदीक — पुणे ईस्ट में सबसे तेजी से बढ़ती जगह।',
    'why.title.2': 'भव्य सुनियोजित गेटेड लेआउट',
    'why.body.2': '30 और 40 फीट की चौड़ी आंतरिक सड़कें, सुरक्षित बाउंड्री वॉल, एलईडी स्ट्रीट लाइट्स और मध्यवर्ती बगीचे वाला भव्य 84 प्लॉट्स का प्रोजेक्ट।',
    'why.title.3': 'बैंक लोन और कागजी दस्तावेजों का सहयोग',
    'why.body.3': 'एसबीआय, एचडीएफसी, आईसीआईसीआई और एक्सिस बैंक के साथ साझेदारी। दस्तावेज, bank लोन और रजिस्ट्री प्रक्रिया हम पूरी करते हैं।',

    // Configurations
    'config.title': 'प्लॉट के विभिन्न विकल्प और साइज',
    'config.sub': 'अपने बजट और आवश्यकता के अनुसार सही प्लॉट चुनें। गुंठेवारी और आर-जोन क्लियर प्लॉट्स उपलब्ध.',
    'config.carpet': 'क्षेत्रफल:',
    'config.price': 'कीमत:',
    'config.ideal': 'उपयुक्त:',
    'config.avail': 'बचे हैं',
    'config.btn': 'कीमत और नक्शा पाएं',
    'config.type.0': '1000 वर्ग फीट प्लॉट',
    'config.type.1': '1500 वर्ग फीट प्लॉट',
    'config.type.2': '2000 वर्ग फीट प्लॉट',
    'config.type.3': '3000+ वर्ग फीट प्लॉट',
    'config.price.0': '₹18 लाख से शुरू',
    'config.price.1': '₹27 लाख से शुरू',
    'config.price.2': '₹36 लाख से शुरू',
    'config.price.3': '₹54 लाख से शुरू',
    'config.ideal.0': 'निवेश और पहला घर',
    'config.ideal.1': 'स्वतंत्र व्यक्तिगत बंगला',
    'config.ideal.2': 'प्रीमियम विला प्लॉट',
    'config.ideal.3': 'कॉर्नर और प्रीमियम सड़क-उन्मुख',

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
    'amen.trees': 'सड़क के किनारे वृक्षारोपण',
    'amen.open': 'खुली सांस्कृतिक और खेलकूद की जगह',

    // Gallery
    'gallery.tag': 'प्रोजेक्ट की झलक',
    'gallery.title': 'आनंदी पार्क की सुंदर तस्वीरें',
    'gallery.caption.0': 'भव्य मुख्य प्रवेश द्वार संकल्पना',
    'gallery.caption.1': 'सुंदर केंद्रीय हरित उद्यान',
    'gallery.caption.2': 'बच्चों का खेल क्षेत्र',
    'gallery.caption.3': '30 फीट चौड़ी आंतरिक पक्की सड़क',
    'gallery.caption.4': 'खूबसूरत बकोरी पहाड़ियां और वातावरण',
    'gallery.caption.5': 'पूरे लेआउट का भव्य एरियल व्यू',

    // Video Tour
    'tour.tag': 'Cinematic AI वर्चुअल टूर',
    'tour.title': 'आनंदी पार्क का शानदार नजारा (HD)',
    'tour.sub': 'हमारे खूबसूरत लेआउट का एक डिजिटल दौरा करें। हमारी प्रीमियम सुविधाओं की जानकारी पाने के लिए नीचे दिए गए AI आवाज प्रेजेंटेशन को चालू करें।',
    'tour.narrator': 'AI आवाज प्रेजेंटेशन',
    'tour.subtext': 'प्लॉट की जानकारी के लिए नीचे दी गई भाषा चुनें और ऑडियो सुनें:',
    'tour.playing.hi': 'हिंदी (1.1x) ऑडियो प्रेजेंटेशन शुरू है...',
    'tour.playing.mr': 'मराठी (1.1x) ऑडियो प्रेजेंटेशन शुरू है...',
    'tour.playing.idle': 'ऑडियो सुनने के लिए नीचे दी गई भाषा चुनें और प्ले करें:',
    'tour.btn.hi': 'हिंदी ऑडिओ (1.1x) शुरू करें',
    'tour.btn.mr': 'मराठी ऑडिओ (1.1x) शुरू करें',
    'tour.btn.pause': 'ऑटो-प्ले रोकें',
    'tour.btn.resume': 'ऑटो-प्ले शुरू करें',
    'tour.slide.title.0': 'प्रोजेक्ट का भव्य लेआउट नक्शा',
    'tour.slide.body.0': '84 प्रीमियम प्लॉट्स का शानदार ज्यामितीय लेआउट और विशाल खुली जगह।',
    'tour.slide.badge.0': 'ड्रोन दृश्य',
    'tour.slide.title.1': 'बकोरी पहाड़ियों की खूबसूरत तलहटी',
    'tour.slide.body.1': 'मनमोहक पहाड़ी दृश्य और सुबह की ताजी ठंडी हवा।',
    'tour.slide.badge.1': 'काल्पनिक दृश्य',
    'tour.slide.title.2': 'प्रीमियम स्वतंत्र बंगला निर्माण',
    'tour.slide.body.2': 'अपने सपनों का स्वतंत्र बंगला 1000 - 4510 वर्ग फीट के तैयार प्लॉट्स पर बनाएं।',
    'tour.slide.badge.2': 'इन्फ्रास्ट्रक्चर',

    // Location & Connectivity
    'loc.tag': 'लोकेशन',
    'loc.title': 'मुख्य स्थान, बेहतरीन कनेक्टिविटी',
    'loc.btn': 'गूगल मैप पर खोलें',
    'loc.conn.0': 'वाघोली चौक',
    'loc.conn.1': 'खराडी आईटी हब',
    'loc.conn.2': 'पुणे एयरपोर्ट',
    'loc.conn.3': 'पुणे रेलवे स्टेशन',
    'loc.nearby.place.0': 'वाघोली चौक',
    'loc.nearby.note.0': 'शॉपिंग, रेस्टोरेंट और मुख्य बस स्टैंड',
    'loc.nearby.place.1': 'खराडी आईटी पार्क',
    'loc.nearby.note.1': 'EON आईटी पार्क और वर्ल्ड ट्रेड सेंटर',
    'loc.nearby.place.2': 'आगामी पुणे रिंग रोड कॉरिडोर',
    'loc.nearby.note.2': 'तेज कनेक्टिविटी देने वाला आउटर रिंग रोड',
    'loc.nearby.place.3': 'फिनिक्स मार्केटसिटी',
    'loc.nearby.note.3': 'विमान नगर शॉपिंग और मॉल क्षेत्र',
    'loc.nearby.place.4': 'स्टेट बैंक (SBI) और HDFC शाखाएं',
    'loc.nearby.note.4': 'इसके साथ ही बैंक ऑफ महाराष्ट्र नजदीक',
    'loc.nearby.place.5': 'डी-मार्ट और स्थानीय बाजार',
    'loc.nearby.note.5': 'वाघोली में दैनिक खरीदारी के साधन',
    'loc.nearby.place.6': 'लाइफलाइन हॉस्पिटल और क्लिनिक',
    'loc.nearby.note.6': 'तत्काल चिकित्सा सुविधाएं',
    'loc.nearby.place.7': 'लेक्सिकॉन किड्स और पोदार स्कूल',
    'loc.nearby.note.7': 'प्रतिष्ठित अंतर्राष्ट्रीय स्कूल',

    // Testimonials
    'test.tag': 'ग्राहकों के अनुभव',
    'test.title': 'हमारे खुशहाल परिवारों के विचार',
    'test.text.0': 'क्लियर-टाइटल प्लॉट्स में मेरा सबसे अच्छा निवेश! लेआउट बहुत सुंदर और सुसज्जित है। रिच-लैंड टीम ने दस्तावेज और बैंक लोन की पूरी प्रक्रिया मात्र दो सप्ताह में पूरी कर दी।',
    'test.role.0': 'आईटी मैनेजर, खराडी',
    'test.text.1': 'हमने अपना सपनों का स्वतंत्र घर बनाने के लिए 1500 वर्ग फीट का प्लॉट खरीदा। यह क्षेत्र बहुत ही शांत और प्राकृतिक है और वाघोली के स्कूल व अस्पताल मात्र 5 मिनट की दूरी पर हैं।',
    'test.role.1': 'गृहणी, वाघोली निवासी',
    'test.text.2': 'आनंदी पार्क पुणे ईस्ट के सबसे तेजी से बढ़ते और फायदे वाले क्षेत्र में स्थित है। इस कीमत पर पूरी तरह से गेटेड, पक्की सड़कें और क्लियर टाइटल वाले आर-जोन प्लॉट्स मिलना असंभव है।',
    'test.role.2': 'व्यवसायी, पुणे',

    // FAQ
    'faq.tag': 'अक्सर पूछे जाने वाले प्रश्न',
    'faq.title': 'खरीदारों के सामान्य प्रश्न व उत्तर',
    'faq.q.0': 'प्रोजेक्ट का टाइटल स्टेटस और जोनिंग क्या है?',
    'faq.a.0': 'आनंदी पार्क के सभी प्लॉट्स 100% क्लियर, मार्केटेबल टाइटल के हैं और अधिकृत आर-जोन (R-Zone) कलेक्टर मान्यता प्राप्त हैं। हम खरीदारों को सर्च रिपोर्ट, सातबारा उतारा और सभी दस्तावेज प्रदान करते हैं।',
    'faq.q.1': 'क्या इस प्रोजेक्ट के लिए बैंक लोन उपलब्ध है?',
    'faq.a.1': 'हाँ, आनंदी पार्क राष्ट्रीयकृत और निजी बैंकों द्वारा स्वीकृत प्रोजेक्ट है। स्टेट बैंक ऑफ इंडिया (SBI), एचडीएफसी (HDFC), आईसीआईसीआई (ICICI) और एक्सिस बैंक से गृह ऋण और प्लॉट लोन उपलब्ध हैं।',
    'faq.q.2': 'क्या पानी, सड़कें और बिजली की बुनियादी सुविधाएं तैयार हैं?',
    'faq.a.2': 'हाँ, पूरी सुविधाएं तैयार हैं। 30 और 40 फीट की पक्की डामर सड़कें, अंडरग्राउंड बिजली लाइन कॉरिडोर, 24 घंटे शुद्ध पानी की आपूर्ति पाइपलाइन और आधुनिक ड्रेनेज सिस्टम पहले ही बनाया जा चुका है।',
    'faq.q.3': 'प्लॉट की रजिस्ट्री कब और कैसे होगी?',
    'faq.a.3': 'प्लॉट तत्काल रजिस्ट्री और नामांतरण के लिए तैयार है। हमारा लीगल और रजिस्ट्री विभाग खरीदारों के दस्तावेज, स्टांप ड्यूटी और सरकारी रजिस्ट्री की सभी प्रक्रिया मात्र कुछ ही दिनों में पूरी करता है।',

    // Contact Form
    'contact.tag': 'साइट विजिट बुक करें',
    'contact.title': 'आज ही अपनी फ्री साइट विजिट बुक करें',
    'contact.sub': 'पुणे शहर क्षेत्र से फ्री पिकअप और ड्रॉप सुविधा उपलब्ध। नीचे दिए गए फॉर्म को भरें, हमारी टीम आपसे तुरंत संपर्क करेगी.',
    'contact.hours': 'सभी दिन खुला, सुबह 10 से शाम 7 बजे',
    'contact.center': 'अनुभव केंद्र और साइट का पता',
    'contact.name': 'पूरा नाम',
    'contact.name.placeholder': 'अपना पूरा नाम दर्ज करें',
    'contact.phone': 'मोबाइल नंबर',
    'contact.phone.placeholder': '10-अंकीय मोबाइल नंबर',
    'contact.email': 'ईमेल पता',
    'contact.email.placeholder': 'you@email.com (वैकल्पिक)',
    'contact.config': 'प्लॉट का प्रकार चुनें',
    'contact.message': 'संदेश या तारीख',
    'contact.message.placeholder': 'पसंदीदा विजिट की तारीख, बजट या अन्य कोई सवाल...',
    'contact.submit': 'फ्री साइट विजिट बुक करें',
    'contact.submit.another': 'दूसरी पूछताछ सबमिट करें',
    'contact.submitting': 'पंजीकरण हो रहा है...',
    'contact.thankyou': 'धन्यवाद!',
    'contact.success': 'आपकी पूछताछ सफलतापूर्वक दर्ज कर ली गई है। हमारी टीम मुफ्त पिकअप के लिए जल्द ही आपसे संपर्क करेगी।',
    'contact.error.validation': 'कृपया अपना नाम और वैध 10-अंकीय मोबाइल नंबर दर्ज करें।',
    'contact.error.api': 'तकनीकी समस्याओं के कारण फॉर्म सबमिट नहीं हो सका। कृपया कॉल या व्हाट्सएप के माध्यम से संपर्क करें।',
    'contact.disclaimer': 'फॉर्म सबमिट करके आप इस प्रोजेक्ट की जानकारी के लिए हमसे संपर्क करने की सहमति देते हैं।',

    // Blog
    'blog.title': 'स्मार्ट प्लॉट खरीदारों के लिए उपयोगी गाइड',
    'blog.sub': 'पुणे ईस्ट में आवासीय प्लॉट में निवेश करने से पहले आपके लिए जानना आवश्यक सभी बातें।',
    'blog.readmore': 'अधिक पढ़ें',
    'blog.readmins.suffix': 'मिनट का समय',
    'blog.title.0': '2026 में वाघोली पुणे ईस्ट का सबसे स्मार्ट प्लॉट निवेश क्यों है',
    'blog.excerpt.0': 'खराड़ी आईटी बूम से लेकर आगामी रिंग रोड तक, यहां बताया गया है कि वाघोली और बकोरी के आसपास की जमीन पुणे के किसी भी अन्य क्षेत्र की तुलना में तेजी से क्यों बढ़ रही है।',
    'blog.tag.0': 'निवेश',
    'blog.title.1': 'प्लॉट बनाम फ्लैट: 10 वर्षों में कौन अधिक संपत्ति बनाता है?',
    'blog.excerpt.1': 'जमीन की कीमत बढ़ती है, इमारतों का मूल्य घटता है। आनंदी पार्क में एक आवासीय प्लॉट फ्लैट से बेहतर प्रदर्शन क्यों कर सकता है इसका आसान विश्लेषण।',
    'blog.tag.1': 'गाइड',
    'blog.title.2': 'पुणे में प्लॉट खरीद रहे हैं? आपकी 7-बिंदु कानूनी चेकलिस्ट',
    'blog.excerpt.2': 'शीर्षक, सातबारा उतारा, जोन, सीमाएं और बहुत कुछ — आवासीय प्लॉट बुक करने से पहले जांचने योग्य बातें।',
    'blog.tag.2': 'कानूनी',

    // Social
    'social.tag': 'सोशल मीडिया पर फॉलो करें',
    'social.title': 'सोशल मीडिया पर @anandipark',
    'social.caption.0': 'काम प्रगति पर: आंतरिक 30/40 फीट की पक्की सड़कें पूरी हो चुकी हैं।',
    'social.caption.1': 'आनंदी पार्क में एक सुंदर शांत सुनहरी शाम का नजारा।',
    'social.caption.2': 'शानदार कॉर्नर प्लॉट्स बहुत तेजी से बिक रहे हैं।',
    'social.caption.3': 'खुशहाल परिवार, अपने नए स्वतंत्र विला प्लॉट की बुकिंग के अवसर पर।',
    'social.caption.4': 'केंद्रीय हरित उद्यान का सुशोभीकरण कार्य प्रगति पर है।',
    'social.caption.5': 'वीकेंड साइट विजिट पर शानदार प्रतिक्रिया - आज ही संपर्क करें।',

    // Footer
    'foot.getintouch': 'संपर्क करें',
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
    'about.f5': 'Clear marketable titles, immediate registration',

    // Why Us Cards
    'why.title.0': 'Clear, Marketable Titles',
    'why.body.0': 'Every residential plot comes with a clean, clear title — ready for immediate registration and construction.',
    'why.title.1': 'Pune East Growth Corridor',
    'why.body.1': 'Minutes from Kharadi IT hub, Wagholi and the upcoming Pune Ring Road — the fastest appreciating belt in East Pune.',
    'why.title.2': 'Gated, Planned Layout',
    'why.body.2': '84 plots with 30 & 40 ft internal roads, compound wall, street lighting and landscaped entry. Build when you are ready.',
    'why.title.3': 'Loan & Registration Support',
    'why.body.3': 'Tie-ups with SBI, HDFC, ICICI and Axis. We handle documentation, loan and registration end to end.',

    // Configurations
    'config.title': 'Plot Configurations & Sizes',
    'config.sub': 'Choose your perfect layout tailored to your family size and budget. Clear R-Zone plots available.',
    'config.carpet': 'Area:',
    'config.price': 'Price:',
    'config.ideal': 'Ideal For:',
    'config.avail': 'left',
    'config.btn': 'Get Cost Sheet',
    'config.type.0': '1000 Sq.ft Plot',
    'config.type.1': '1500 Sq.ft Plot',
    'config.type.2': '2000 Sq.ft Plot',
    'config.type.3': '3000+ Sq.ft Plot',
    'config.price.0': '₹18 Lakh onwards',
    'config.price.1': '₹27 Lakh onwards',
    'config.price.2': '₹36 Lakh onwards',
    'config.price.3': '₹54 Lakh onwards',
    'config.ideal.0': 'First home / investment entry',
    'config.ideal.1': 'Independent bungalow',
    'config.ideal.2': 'Premium villa plot',
    'config.ideal.3': 'Corner & road-facing premium',

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

    // Gallery
    'gallery.tag': 'Project Gallery',
    'gallery.title': 'A Closer Look at Anandi Park',
    'gallery.caption.0': 'Grand main entrance gate visual',
    'gallery.caption.1': 'Lush central landscaped garden',
    'gallery.caption.2': "Children's integrated play zone",
    'gallery.caption.3': '30ft well-planned internal asphalt road',
    'gallery.caption.4': 'Beautiful hillside scenic surroundings',
    'gallery.caption.5': 'Overall layout top view rendering',

    // Video Tour
    'tour.tag': 'Cinematic AI Interactive Tour',
    'tour.title': 'Experience Anandi Park In HD',
    'tour.sub': 'Take a cinematic virtual flight over your future residential plots. Turn on the AI voiceover to hear our exclusive inaugural layout features.',
    'tour.narrator': 'AI Voiceover Narrator',
    'tour.subtext': 'Select language to play the layout pitch presentation:',
    'tour.playing.hi': 'Playing Hindi (1.1x) campaign script...',
    'tour.playing.mr': 'Playing Marathi (1.1x) campaign script...',
    'tour.playing.idle': 'Select language to play the layout pitch presentation:',
    'tour.btn.hi': 'Play Hindi Voice (1.1x)',
    'tour.btn.mr': 'Play Marathi (1.1x)',
    'tour.btn.pause': 'Pause Auto-Flight',
    'tour.btn.resume': 'Resume Auto-Flight',
    'tour.slide.title.0': 'Top-Down Aerial Master Plan',
    'tour.slide.body.0': 'Perfect 84-plot geometric layout with sprawling green pockets.',
    'tour.slide.badge.0': 'Drone View',
    'tour.slide.title.1': 'Nestled Below Bakori Hills',
    'tour.slide.body.1': 'Breathtaking hillside views and refreshing morning breezes.',
    'tour.slide.badge.1': 'Imagination View',
    'tour.slide.title.2': 'Premium Villa Developments',
    'tour.slide.body.2': 'Build your dream bungalow on 1000 - 4510 sq.ft ready plots.',
    'tour.slide.badge.2': 'Infrastructure',

    // Location & Connectivity
    'loc.tag': 'Location',
    'loc.title': 'Strategic Location, Connected Living',
    'loc.btn': 'Open in Google Maps',
    'loc.conn.0': 'Wagholi Chowk',
    'loc.conn.1': 'Kharadi IT Hub',
    'loc.conn.2': 'Pune Airport',
    'loc.conn.3': 'Pune Railway Station',
    'loc.nearby.place.0': 'Wagholi Chowk',
    'loc.nearby.note.0': 'Shopping, restaurants & main bus depot',
    'loc.nearby.place.1': 'Kharadi IT Park',
    'loc.nearby.note.1': 'EON IT Park and World Trade Center',
    'loc.nearby.place.2': 'Upcoming Pune Ring Road',
    'loc.nearby.note.2': 'Rapid loop outer bypass corridor',
    'loc.nearby.place.3': 'Phoenix Marketcity',
    'loc.nearby.note.3': 'Viman Nagar premium shopping district',
    'loc.nearby.place.4': 'SBI & HDFC Partner Branches',
    'loc.nearby.note.4': 'Along with Bank of Maharashtra nearby',
    'loc.nearby.place.5': 'D-Mart & Local Wagholi Markets',
    'loc.nearby.note.5': 'Daily essential grocery shopping outlets',
    'loc.nearby.place.6': 'Lifeline Hospital & Clinics',
    'loc.nearby.note.6': 'Immediate 24/7 medical facilities',
    'loc.nearby.place.7': 'Lexicon Kids & Podar School',
    'loc.nearby.note.7': 'Highly reputed international institutes',

    // Testimonials
    'test.tag': 'Testimonials',
    'test.title': 'What Our Residents Say',
    'test.text.0': 'Perfect clean-titled investment. The layout is beautiful, and the Rich-Land team handled the entire bank loan and registration process within just two weeks.',
    'test.role.0': 'IT Manager, Kharadi',
    'test.text.1': 'We bought a 1500 sq.ft plot to build our independent house. The location is peaceful and serene, yet so close to Wagholi schools and clinics. Highly recommended!',
    'test.role.1': 'Resident, Wagholi',
    'test.text.2': 'Anandi Park is situated in Pune East\'s fastest appreciating corridor. Finding fully-gated R-Zone plots with full documentation and ready roads at this price is impossible anywhere else.',
    'test.role.2': 'Businessman, Pune',

    // FAQ
    'faq.tag': 'FAQ',
    'faq.title': 'Questions Buyers Ask Us',
    'faq.q.0': 'What is the title status and zoning?',
    'faq.a.0': 'The plots are 100% clear title, marketable, and have official collector-sanctioned R-Zone status. We provide complete paperwork including the 7/12 extract and search report.',
    'faq.q.1': 'Are bank loans available for this project?',
    'faq.a.1': 'Yes, the project is officially approved and certified. Loans are available from major nationalized and private banks including SBI, HDFC, ICICI, and Axis Bank.',
    'faq.q.2': 'Is the water and electricity infrastructure ready?',
    'faq.a.2': 'Yes, the infrastructure is fully developed. Complete underground electrical conduits, internal 30/40ft asphalt roads, drainage systems, and water connections are ready.',
    'faq.q.3': 'When can I register the plot in my name?',
    'faq.a.3': 'Registration can be done immediately. We have a dedicated legal desk that handles documentation, stamp duty, and registry registration within a few working days.',

    // Contact Form
    'contact.tag': 'Book a Visit',
    'contact.title': 'Schedule Your Free Site Visit Today',
    'contact.sub': 'Complimentary pickup and drop-off services available across Pune city limits. Fill out the form below and our team will coordinate with you.',
    'contact.hours': 'Open all days, 10 AM to 7 PM',
    'contact.center': 'Experience Centre & Site Address',
    'contact.name': 'Full Name',
    'contact.name.placeholder': 'Enter your full name',
    'contact.phone': 'Phone Number',
    'contact.phone.placeholder': '10-digit mobile number',
    'contact.email': 'Email Address',
    'contact.email.placeholder': 'you@email.com (optional)',
    'contact.config': 'Configuration of Interest',
    'contact.message': 'Message or Date',
    'contact.message.placeholder': 'Preferred visit date, budget, or any question...',
    'contact.submit': 'Book Free Site Visit',
    'contact.submit.another': 'Submit another enquiry',
    'contact.submitting': 'Registering...',
    'contact.thankyou': 'Thank you!',
    'contact.success': 'Your enquiry is registered successfully. Our team will contact you shortly for free pickup arrangement.',
    'contact.error.validation': 'Please enter your name and a valid 10-digit mobile number.',
    'contact.error.api': 'Could not submit right now due to technical reasons. Please call or WhatsApp us instead.',
    'contact.disclaimer': 'By submitting you agree to be contacted about this project.',

    // Blog
    'blog.title': 'Guides for smart plot buyers',
    'blog.sub': 'Everything you need to know before investing in a residential plot at Pune East.',
    'blog.readmore': 'Read more',
    'blog.readmins.suffix': 'min read',
    'blog.title.0': 'Why Wagholi is Pune East’s smartest plot investment in 2026',
    'blog.excerpt.0': 'From the Kharadi IT boom to the upcoming Ring Road, here is why land around Wagholi and Bakori is appreciating faster than any other Pune corridor.',
    'blog.tag.0': 'Investment',
    'blog.title.1': 'Plot vs Flat: which builds more wealth over 10 years?',
    'blog.excerpt.1': 'Land appreciates, buildings depreciate. A simple breakdown of why a residential plot at Anandi Park can outperform an apartment.',
    'blog.tag.1': 'Guide',
    'blog.title.2': 'Buying a plot in Pune? Your 7-point legal checklist',
    'blog.excerpt.2': 'Title, 7/12 extract, zone, boundaries and more — everything to verify before you book a residential plot.',
    'blog.tag.2': 'Legal',

    // Social
    'social.tag': 'Follow us',
    'social.title': '@anandipark on social',
    'social.caption.0': 'Site progress: internal 30/40ft asphalt roads complete.',
    'social.caption.1': 'Golden hour scenic views at Anandi Park layout.',
    'social.caption.2': 'Spacious corner plots are selling fast.',
    'social.caption.3': 'Happy family celebrates booking their dream villa plot.',
    'social.caption.4': 'Central landscaped garden beautification in progress.',
    'social.caption.5': 'Weekend site visit drive - contact us today.',

    // Footer
    'foot.getintouch': 'Get in touch',
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
