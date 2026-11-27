export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "What is SYNTV RADIO?",
    answer:
      "SYNTV RADIO is a free web-based directory and player for live online radio. It helps you find stations by name, country, language, and genre, then plays the station's own stream in your browser. SYNTV RADIO does not operate the radio stations and does not host their audio streams.",
  },
  {
    question: "Is SYNTV RADIO free to use?",
    answer:
      "Yes. Listening through SYNTV RADIO is free and does not require an account. Your mobile or internet provider may charge for data usage. If advertising is enabled in the future, ads will be clearly labelled and will not be disguised as playback controls.",
  },
  {
    question: "How do I listen to a station?",
    answer:
      "Use the search box or browse by country, genre, or the station directory. Select a station card or open its detail page, then press Play. The audio player stays available at the bottom of the page while you browse. Playback starts only after you press Play.",
  },
  {
    question: "Can I listen on a phone or tablet?",
    answer:
      "Yes. The interface is responsive and can be installed as a progressive web app from a compatible browser. Background playback and lock-screen controls depend on your browser, operating system, and whether the station's stream format is supported. Mobile data charges may apply.",
  },
  {
    question: "Can I save favorite stations?",
    answer:
      "Yes. Favorites, recently played stations, collections, volume, theme, language, and listening statistics are stored in your browser on your device. SYNTV RADIO does not require an account for these features. Clearing site data or using a different browser or device will remove or hide them.",
  },
  {
    question: "Why is a radio station unavailable?",
    answer:
      "Station streams are provided by independent third parties. A stream may be offline, temporarily overloaded, geo-restricted, moved to a new address, or encoded in a format your browser cannot play. Try the station's website or another station, and use our contact form to report a listing that needs attention.",
  },
  {
    question: "Does SYNTV RADIO own the radio streams?",
    answer:
      "No. SYNTV RADIO is a discovery directory. Station names, logos, programmes, music, and streams belong to their respective owners. SYNTV RADIO does not claim ownership of third-party station content and does not represent that it holds broadcasting or music licences for those streams.",
  },
  {
    question: "How are stations organized?",
    answer:
      "Station metadata is sourced through the Radio Browser community directory. You can browse by country, genre or tag, language, and station name, or use the interactive world map. Tags are community-maintained and can be broad or incomplete, so a station may appear under more than one style.",
  },
  {
    question: "Does SYNTV RADIO collect personal information?",
    answer:
      "You do not need an account, and we do not ask for your name, address, or precise location to listen. The site stores preferences locally in your browser and uses a random, tab-scoped session identifier to show anonymous live listener counts. Standard hosting logs and short-lived rate limiting may process technical data such as IP addresses. If you use the contact form, the details you submit are sent to the site operator so they can respond. Our Privacy Policy explains the details.",
  },
  {
    question: "How can a station owner report an issue?",
    answer:
      "Use the contact form and choose the station-owner or copyright topic. Include the station name, its SYNTV RADIO page URL or station ID, and a short description of the issue. If you are reporting copyright or content ownership, explain the material you own and the action you are requesting. We can review directory listings, but we do not control the station's independent stream.",
  },
  {
    question: "What do the live listener counts mean?",
    answer:
      "They show how many active playback sessions are currently registered on SYNTV RADIO for a station or across the site. They are not the station's global audience, its official ratings, or a count of every person listening on other platforms. Sessions expire automatically when playback stops or heartbeats stop.",
  },
  {
    question: "Are advertisements shown on SYNTV RADIO?",
    answer:
      "Advertising is not currently active. The site is prepared for Google AdSense, and any future ads will be labelled as advertisements, kept separate from player controls, and loaded only where the site owner has enabled them. Where consent is required, optional advertising storage will be off unless you allow it.",
  },
];
