/**
 * Original editorial guides for SYNTV RADIO. Kept as plain data so both the
 * guides index and each article route can be server-rendered and indexed.
 */

export interface GuideSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  updated: string;
  minutes: number;
  sections: GuideSection[];
}

export const guides: Guide[] = [
  {
    slug: "how-internet-radio-streaming-works",
    title: "How Internet Radio Streaming and Bitrates Work",
    eyebrow: "Streaming basics",
    description:
      "What happens when you press play, what kbps really means, why codecs matter, and how to estimate the bandwidth a live radio stream uses.",
    updated: "November 27, 2026",
    minutes: 6,
    sections: [
      {
        id: "what-a-stream-is",
        title: "What a stream actually is",
        paragraphs: [
          "A live internet radio stream is a continuous flow of encoded audio delivered over HTTP. Unlike a downloaded song, it has no fixed end: your browser requests a small buffer, decodes it, and asks for the next chunk while you listen. The station's server controls what is broadcast; your browser only renders it.",
          "That distinction explains most of the behavior you see in a web player. A stream can sound perfect one minute and stall the next if the station's encoder, network, or CDN has a problem. The player is a window into someone else's broadcast, not the broadcaster itself.",
        ],
        bullets: [
          "The broadcaster encodes audio into a codec and publishes a public stream URL.",
          "Your browser opens that URL, buffers a short segment, and decodes it locally.",
          "Metadata such as bitrate and codec is reported by the directory, not measured by the player.",
        ],
      },
      {
        id: "bitrate",
        title: "Bitrate, in plain terms",
        paragraphs: [
          "Bitrate is the amount of data used per second of audio, usually written in kbps (kilobits per second). A higher number generally leaves more room for detail, but it is not a quality score on its own. The encoder settings and the source audio matter too.",
          "For a rough bandwidth estimate, divide the bitrate by eight to get kilobytes per second, then multiply by 3,600 for an hour. A 128 kbps stream uses about 57.6 MB per hour; 64 kbps is about 28.8 MB; 320 kbps is roughly 144 MB. Add a little overhead for HTTP headers and reconnects.",
          "If you are on a capped mobile plan, a 64–96 kbps talk or music stream can last much longer than a 192 kbps one. On a stable broadband connection, the difference between 128 and 192 kbps is often less noticeable than the station's own master recording.",
        ],
      },
      {
        id: "codecs",
        title: "Codecs and browser support",
        paragraphs: [
          "A codec is the method used to compress and decompress the audio. MP3 (often listed as MPEG or MP3) is the most widely supported. AAC is common and efficient, especially on Apple devices and in HLS streams. Ogg Vorbis and Opus are open formats that work well in many browsers but not everywhere.",
          "When a listing shows a codec and bitrate, treat them as useful hints. If a stream fails only in one browser, the codec or container format is a likely cause. Trying another browser is a legitimate troubleshooting step, not a workaround for a broken listing.",
        ],
      },
      {
        id: "buffering",
        title: "Why live streams buffer or drop",
        paragraphs: [
          "Buffering gives the player a small safety margin against network jitter. A live stream that repeatedly stalls can be suffering from a slow uplink at the station, an overloaded server, a moving stream URL, or a network path that cannot keep up with the chosen bitrate.",
          "A short reconnect is normal for live audio. A stream that never starts, or that fails after every reconnect, is more likely offline, geo-restricted, or encoded in a format your browser cannot decode. Lower-bitrate streams are often more reliable on congested networks.",
        ],
      },
      {
        id: "reading-metadata",
        title: "Reading the metadata on a listing",
        paragraphs: [
          "Country, language, tags, codec, bitrate, and online status are directory fields contributed by the community or discovered by periodic checks. They help you choose a station, but they are not guarantees. A station marked online may still be unplayable in your region, and a missing bitrate field does not mean the stream is silent.",
          "Use the metadata as a starting point. If a field is wrong, a correction request to the directory or to SYNTV RADIO is more useful than simply skipping the station.",
        ],
      },
    ],
  },
  {
    slug: "exploring-global-music-genres-online",
    title: "Exploring Global Music Genres Online",
    eyebrow: "Discovery",
    description:
      "A practical way to explore world radio by genre and language, understand community tags, and find music beyond the same few charts.",
    updated: "November 27, 2026",
    minutes: 5,
    sections: [
      {
        id: "maps-not-boxes",
        title: "Genres are maps, not boxes",
        paragraphs: [
          "A genre tag is a shortcut for a family of sounds, not a rule. Radio stations often mix formats across a day: news in the morning, local music at lunch, and dance or jazz in the evening. Two stations with the same tag may sound quite different.",
          "The tags in a public radio directory are contributed by many people. That makes them broad and occasionally inconsistent, but it also means they reflect how real listeners describe stations rather than a single editor's taxonomy.",
        ],
      },
      {
        id: "language-is-not-genre",
        title: "Language is not genre",
        paragraphs: [
          "A station broadcasting in Spanish might play reggaeton, classical music, news, or regional folk. A language page tells you what you will hear spoken; a genre page tells you roughly what will be played. Combining the two is often the fastest way to find something specific.",
          "On SYNTV RADIO you can open a country page, pick a genre chip, and then use search to narrow by station name or city. Moving between those views is usually more productive than typing a long, precise query.",
        ],
      },
      {
        id: "regional-scenes",
        title: "Regional scenes worth exploring",
        paragraphs: [
          "Once you move beyond the most familiar charts, a few useful entry points stand out. Afrobeats and highlife open a door to West African pop and its older guitar-band roots. Bossa nova and samba lead into Brazilian jazz and percussion-led styles. Flamenco, fado, and Celtic folk each carry strong regional identity and are often played on public and community stations.",
          "K-pop and J-pop are polished pop industries with dedicated radio ecosystems, while reggaeton, cumbia, and salsa reveal how Latin American and Caribbean scenes overlap. None of these labels is a complete description; they are starting points for a listening session.",
        ],
      },
      {
        id: "tags-without-getting-lost",
        title: "Using tags without getting lost",
        paragraphs: [
          "Very broad labels such as 'music', 'radio', or 'entertainment' can produce huge, unfocused lists. They are useful only when you want a wide browse. Prefer a format tag plus a place when you know what you want.",
          "Also expect duplicates and spelling variants in community data. Hyphens, accented letters, and concatenated words may describe the same style. Clean, normalized labels make a directory easier to scan, but they cannot invent precision that the source data does not have.",
        ],
      },
      {
        id: "listening-route",
        title: "A simple route for a new listener",
        paragraphs: [
          "Pick a country you are curious about, skim the genre chips on its page, and play three short samples rather than committing to one station. Save the ones you like as favorites, then build a collection by mood or by region.",
          "After a week, your recently played list will show what you actually return to. That is usually a better map of your taste than any genre label you started with.",
        ],
      },
    ],
  },
  {
    slug: "troubleshooting-live-audio-streams",
    title: "Troubleshooting Live Audio Streams in Your Browser",
    eyebrow: "Technical help",
    description:
      "Why a live radio stream may not play, how autoplay rules and codecs affect playback, and what information to include when reporting a problem.",
    updated: "November 27, 2026",
    minutes: 6,
    sections: [
      {
        id: "simple-checks",
        title: "Start with the simplest checks",
        paragraphs: [
          "Before blaming the station, confirm that your connection works and that audio works elsewhere. Check that the site's volume control is not muted, that your system output is not on a different device, and that another station plays in the same browser.",
          "If only one station fails, the problem is probably its stream. If every station fails, look at your browser, network, or device settings first.",
        ],
      },
      {
        id: "autoplay",
        title: "Autoplay and user gestures",
        paragraphs: [
          "Modern browsers block audio that starts without a user action. A click or tap on a play button satisfies that rule; a page that tries to start audio on load usually will not. If you use keyboard shortcuts, make sure the page has focus before pressing them.",
          "Background playback and lock-screen controls depend on the browser and operating system. A browser may pause a stream when the tab is idle, even though the site requested continuous playback.",
        ],
      },
      {
        id: "codecs-and-https",
        title: "Codecs and HTTPS",
        paragraphs: [
          "Some streams use codecs a particular browser cannot decode. If a station fails in one browser but works in another, the codec or container format is the likely reason. A player can only decode formats the browser supports.",
          "A secure page should not load an insecure audio stream. Browsers block mixed-content requests, so an old http:// stream URL may work on the station's own page but fail on an https:// directory. Streams that moved to a new address often show up as offline until the directory is updated.",
        ],
      },
      {
        id: "geo-and-stale-urls",
        title: "Geo-restrictions and stale URLs",
        paragraphs: [
          "Live broadcasts may be limited to certain countries because of licensing or technical policy. A listing can be accurate and still be unplayable from your location. VPNs and corporate networks can make the problem look different from one device to another.",
          "Directory records also go stale. A station may change its stream host without telling the community directory. When that happens, the listing remains until someone reports the new URL or the upstream check marks it broken.",
        ],
      },
      {
        id: "fallbacks",
        title: "Fallback URLs and retries",
        paragraphs: [
          "A well-built player tries more than one address. SYNTV RADIO first attempts the resolved stream URL, then the original URL if the resolved one fails. It also retries after a short interruption and shows a clear message when a stream is unavailable, rather than leaving you staring at a silent control.",
          "A single retry is normal. Several failed retries usually mean the station is offline or incompatible, so moving to another listing is faster than repeatedly pressing play.",
        ],
      },
      {
        id: "what-to-report",
        title: "What to report",
        paragraphs: [
          "A useful report is short and specific. Include the station name and its SYNTV RADIO URL or station ID, the browser and version, your device, the approximate time, and the exact message you saw. Say whether the problem affects every station or only one.",
          "Do not include passwords, payment data, or private network details. Use the contact form and choose technical support, or choose station-owner if you represent the broadcaster.",
        ],
      },
    ],
  },
  {
    slug: "build-personal-world-radio-collection",
    title: "How to Build Your Personal World Radio Collection",
    eyebrow: "Your library",
    description:
      "Use favorites, collections, and recently played to turn a large radio directory into a small library that fits your listening habits.",
    updated: "November 27, 2026",
    minutes: 5,
    sections: [
      {
        id: "why-a-collection",
        title: "Why build a collection at all",
        paragraphs: [
          "A global directory is exciting but tiring: thousands of stations and no obvious starting point. A personal collection solves that by keeping the few streams you actually return to one click away. It turns discovery into a habit instead of a research project.",
          "You do not need an account. SYNTV RADIO keeps favorites, collections, and recently played in your browser's local storage, so the library is yours and is not tied to a cloud profile.",
        ],
      },
      {
        id: "three-tools",
        title: "Favorites, collections, and recently played",
        paragraphs: [
          "Favorites are a quick shortlist: one tap to add, one tap to remove. Collections are for projects, such as 'morning news', 'focus music', or 'stations from Japan'. Recently played is automatic and shows up to 15 stations you started, which is handy when you forget the name of something good.",
          "Use all three differently. Favorite anything you might replay, organize only the best favorites into collections, and treat recently played as a temporary trail rather than a permanent archive.",
        ],
      },
      {
        id: "organizing-system",
        title: "A simple organizing system",
        paragraphs: [
          "Start with three collections and resist adding more until each has at least five stations. A place-based collection (for example, 'Brazil') is useful for travel memories. A format-based collection ('Jazz after midnight') matches a mood. A utility collection ('News and weather') is practical.",
          "When you add a station, give the collection a name that explains why you saved it, not just what it contains. Future you will remember the reason faster than the list.",
        ],
      },
      {
        id: "backup",
        title: "Keep a backup",
        paragraphs: [
          "Local storage survives browser restarts, but it can be cleared when you reset a browser, use a cleaning tool, or switch devices. If a collection matters to you, export its JSON from the Collections page and keep a copy somewhere safe. You can import it again later.",
          "Because the data is local, clearing site data for syntv.online also clears favorites, volume, theme, consent choices, listening stats, and collections. That is a privacy feature, but it means your backup is the only copy.",
        ],
      },
      {
        id: "privacy",
        title: "Privacy and devices",
        paragraphs: [
          "A local library is private in a practical sense: the site does not need to know who you are to remember what you like. It is also device-specific. A phone and a laptop will have separate libraries unless you export and import them.",
          "If you share a computer, the other person can see your saved stations. There is no login wall to hide them, so treat the collection as a visible bookmark list rather than a secret.",
        ],
      },
    ],
  },
  {
    slug: "understanding-radio-metadata",
    title: "Understanding Radio Metadata: Counts, Tags, and Stream Health",
    eyebrow: "Behind the directory",
    description:
      "What the station directory really tells us, why click counts and live listener numbers differ, and how to report inaccurate metadata.",
    updated: "November 27, 2026",
    minutes: 5,
    sections: [
      {
        id: "what-directory-provides",
        title: "What the directory provides",
        paragraphs: [
          "A station record usually contains a name, a stream address, a homepage, a country code, languages, tags, and technical fields such as codec and bitrate. These values are submitted by contributors or discovered by periodic automated checks. They are public directory data, not a review of the station.",
          "SYNTV RADIO normalizes country names and tag labels for display, but it cannot verify every detail. Two stations may share a tag because a contributor used the same word, not because they sound alike.",
        ],
      },
      {
        id: "clicks-vs-listeners",
        title: "Click counts are not listeners",
        paragraphs: [
          "Directory click counts record clicks in the upstream directory over time. They are a popularity hint for browsing, not a live audience measurement. They can include bots, repeated clicks, and clicks from people who never listened.",
          "The listener counter on SYNTV RADIO is different: it reflects active playback sessions on this site, estimated from short-lived heartbeats with random, tab-scoped identifiers. It is not a station's global audience or an official rating. Neither number should be presented as an audience figure.",
        ],
      },
      {
        id: "health-fields",
        title: "Online flags, codec, and bitrate",
        paragraphs: [
          "An 'online' flag means a directory check could reach the stream recently. It does not promise that your browser can decode the stream or that it is available in your country. Codec and bitrate describe the encoding reported to the directory, not the quality of the programme itself.",
          "Stream health changes constantly. A station can go offline during maintenance or change its URL without updating the directory. A short outage is normal; repeated failures across days are worth reporting.",
        ],
      },
      {
        id: "why-records-change",
        title: "Why listings change",
        paragraphs: [
          "Stations rename themselves, move hosts, add languages, or stop broadcasting. Contributors correct tags and merge duplicates. As a result, the same station can appear different in two snapshots taken weeks apart.",
          "This is why directory pages show a dated sample and avoid invented ratings or permanent claims. A listing is a pointer to a live service that can change at any time.",
        ],
      },
      {
        id: "reporting",
        title: "How to report bad data",
        paragraphs: [
          "If a field is wrong, send the station name, its SYNTV RADIO URL or station ID, the exact field, and a public source that confirms the correction. Rights holders should use the DMCA and stream-removal process described in the Terms of Use. Technical failures should include browser and timing details.",
          "Accurate reports help every listener: they keep country and genre pages useful and reduce the number of dead links in the directory.",
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
