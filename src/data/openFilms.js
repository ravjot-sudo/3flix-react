/**
 * OPEN MOVIES — films released under Creative Commons licences by Blender.
 *
 * Unlike the classics these are modern (2006–2021), and unlike the new
 * releases they are free to stream by licence, so they play right here.
 * Video streams from the Internet Archive's copies; artwork is TMDB's;
 * subtitles are the productions' own, converted to WebVTT in /public/subtitles.
 *
 * Each licence requires credit, so every film carries its licence and studio,
 * and the player shows them.
 */
export const OPEN_FILMS = [
  {
    id: "elephants-dream",
    title: "Elephants Dream",
    year: 2006,
    director: "Bassam Kurdali",
    genres: [
      "Animation",
      "Sci-Fi"
    ],
    runtime: 11,
    rating: 5.8,
    hue: 127,
    featured: false,
    synopsis: "Elephants Dream is the story of two strange characters exploring a capricious and seemingly infinite machine. The elder, Proog, acts as a tour-guide and protector, happily showing off the sights and dangers of the machine to his initially curious but increasingly skeptical protege Emo. As their journey unfolds we discover signs that the machine is not all Proog thinks it is, and his guiding takes on a more desperate aspect.  Elephants Dream is a story about communication and fiction, made purposefully open-ended as the world’s first 3D animated “Open movie”. The film itself is released under the Creative Commons license, along with the entirety of the production files used to make it (roughly 7 Gigabytes of data). The software used to make the movie is the free/open source animation suite Blender along with other open source software, thus allowing the movie to be remade, remixed and re-purposed with only a computer and the data on the DVD or download.",
    video: "https://archive.org/download/ElephantsDream/ed_1024.mp4",
    tmdb: {
      id: 9761,
      poster: "/9zROtU9TkpZQrOuEaMAp68FOWLK.jpg",
      backdrop: "/9bJDwuhza19HQcYA99FeslLYmUm.jpg"
    },
    imdbId: "tt0807840",
    license: {
      name: "CC BY 3.0",
      url: "http://creativecommons.org/licenses/by/3.0/us/"
    },
    studio: "Blender Foundation",
    subtitles: []
  },
  {
    id: "big-buck-bunny",
    title: "Big Buck Bunny",
    year: 2008,
    director: "Sacha Goedegebure",
    genres: [
      "Animation",
      "Comedy",
      "Family"
    ],
    runtime: 8,
    rating: 6.5,
    hue: 326,
    featured: false,
    synopsis: "Follow a day of the life of Big Buck Bunny when he meets three bullying rodents: Frank, Rinky, and Gamera. The rodents amuse themselves by harassing helpless creatures by throwing fruits, nuts and rocks at them. After the deaths of two of Bunny's favorite butterflies, and an offensive attack on Bunny himself, Bunny sets aside his gentle nature and orchestrates a complex plan for revenge.",
    video: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
    tmdb: {
      id: 10378,
      poster: "/i9jJzvoXET4D9pOkoEwncSdNNER.jpg",
      backdrop: "/xtdybjRRZ15mCrPOvEld305myys.jpg"
    },
    imdbId: "tt1254207",
    license: {
      name: "CC BY 3.0",
      url: "http://creativecommons.org/licenses/by/3.0/"
    },
    studio: "Blender Foundation",
    subtitles: []
  },
  {
    id: "sintel",
    title: "Sintel",
    year: 2010,
    director: "Colin Levy",
    genres: [
      "Animation",
      "Fantasy"
    ],
    runtime: 14,
    rating: 7.3,
    hue: 95,
    featured: false,
    synopsis: "A wandering warrior finds an unlikely friend in the form of a young dragon. The two develop a close bond, until one day the dragon is snatched away. She then sets out on a relentless quest to reclaim her friend, finding in the end that her quest exacts a far greater price than she had ever imagined.",
    video: "https://archive.org/download/Sintel/sintel-2048-surround.mp4",
    tmdb: {
      id: 45745,
      poster: "/2hwMOwcyyYWlHBldhonipg09kRm.jpg",
      backdrop: "/msqeiEyIRpPAtrCeRGFNZQ9tkJL.jpg"
    },
    imdbId: "tt1727587",
    license: {
      name: "CC BY 3.0",
      url: "http://creativecommons.org/licenses/by/3.0/"
    },
    studio: "Blender Foundation",
    subtitles: [
      {
        lang: "fr",
        label: "Français",
        src: "/subtitles/sintel-fr.vtt"
      },
      {
        lang: "ja",
        label: "日本語",
        src: "/subtitles/sintel-ja.vtt"
      },
      {
        lang: "ko",
        label: "한국어",
        src: "/subtitles/sintel-ko.vtt"
      },
      {
        lang: "ru",
        label: "Русский",
        src: "/subtitles/sintel-ru.vtt"
      }
    ]
  },
  {
    id: "tears-of-steel",
    title: "Tears of Steel",
    year: 2012,
    director: "Ian Hubert",
    genres: [
      "Sci-Fi",
      "Animation"
    ],
    runtime: 12,
    rating: 5.7,
    hue: 147,
    featured: false,
    synopsis: "The film’s premise is about a group of warriors and scientists, who gathered at the “Oude Kerk” in Amsterdam to stage a crucial event from the past, in a desperate attempt to rescue the world from destructive robots.",
    video: "https://archive.org/download/Tears-of-Steel/tears_of_steel_1080p.mp4",
    tmdb: {
      id: 133701,
      poster: "/8qy3jRmaHR7f8VZh3iXCqCWfFsH.jpg",
      backdrop: "/fOy6SL5Zs2PFcNXwqEPIDPrLB1q.jpg"
    },
    imdbId: "tt5129250",
    license: {
      name: "CC BY 3.0",
      url: "http://creativecommons.org/licenses/by/3.0/"
    },
    studio: "Blender Foundation",
    subtitles: [
      {
        lang: "en",
        label: "English",
        src: "/subtitles/tears-of-steel-en.vtt"
      }
    ]
  },
  {
    id: "cosmos-laundromat",
    title: "Cosmos Laundromat",
    year: 2015,
    director: "Mathieu Auvray",
    genres: [
      "Animation",
      "Fantasy"
    ],
    runtime: 12,
    rating: 6.3,
    hue: 84,
    featured: false,
    synopsis: "On a desolate island, a suicidal sheep named Franck meets his fate…in the form of a quirky salesman named Victor, who offers him the gift of a lifetime. The gift is many lifetimes, actually, in many different worlds – each lasting just a few minutes. In the sequel to the pilot, Franck will find a new reason to live…in the form of a bewitching female adventurer named Tara, who awakens his long-lost lust for life. But can Franck keep up with her?",
    video: "https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20(1080p).mp4",
    tmdb: {
      id: 358332,
      poster: "/5ZXi0oitpEgAdoJglFTc5SZF9nt.jpg",
      backdrop: "/f2wABsgj2lIR2dkDEfBZX8p4Iyk.jpg"
    },
    imdbId: "tt4957236",
    license: {
      name: "CC BY 4.0",
      url: "http://creativecommons.org/licenses/by/4.0/"
    },
    studio: "Blender Foundation",
    subtitles: [
      {
        lang: "en",
        label: "English",
        src: "/subtitles/cosmos-laundromat-en.vtt"
      },
      {
        lang: "es",
        label: "Español",
        src: "/subtitles/cosmos-laundromat-es.vtt"
      },
      {
        lang: "fr",
        label: "Français",
        src: "/subtitles/cosmos-laundromat-fr.vtt"
      },
      {
        lang: "it",
        label: "Italiano",
        src: "/subtitles/cosmos-laundromat-it.vtt"
      }
    ]
  },
  {
    id: "spring",
    title: "Spring",
    year: 2019,
    director: "Andreas Goralczyk",
    genres: [
      "Fantasy",
      "Animation",
      "Adventure"
    ],
    runtime: 8,
    rating: 7.7,
    hue: 256,
    featured: false,
    synopsis: "The story of a shepherd girl and her dog who face ancient spirits in order to continue the cycle of life.",
    video: "https://archive.org/download/springopenmovie/springopenmovie.ia.mp4",
    tmdb: {
      id: 593048,
      poster: "/g5dSJtpoXYCSVx70srSAc3wqNFc.jpg",
      backdrop: "/lL04DVOu1b64Xoj1EuWHZdtcfaZ.jpg"
    },
    imdbId: "tt9249278",
    license: {
      name: "CC BY 4.0",
      url: "https://creativecommons.org/licenses/by/4.0/"
    },
    studio: "Blender Studio",
    subtitles: []
  },
  {
    id: "sprite-fright",
    title: "Sprite Fright",
    year: 2021,
    director: "Matthew Luhn",
    genres: [
      "Animation",
      "Horror",
      "Comedy"
    ],
    runtime: 11,
    rating: 7.8,
    hue: 127,
    featured: false,
    synopsis: "Set in 80’s-Britain, when a group of rowdy teenagers trek into an isolated forest, they discover peaceful mushroom creatures that turn out to be an unexpected force of nature.",
    video: "https://archive.org/download/sprite-fright/Sprite%20Fright%20-%20Open%20Movie%20by%20Blender%20Studio-804p.mp4",
    tmdb: {
      id: 891761,
      poster: "/AjWJQOogG4Irpff6K49tzrUTb1s.jpg",
      backdrop: "/aCMT1okuiKFnyKHdCOez66rJKyT.jpg"
    },
    imdbId: "tt15804252",
    license: {
      name: "CC BY 4.0",
      url: "https://creativecommons.org/licenses/by/4.0/"
    },
    studio: "Blender Studio",
    subtitles: []
  }
];
