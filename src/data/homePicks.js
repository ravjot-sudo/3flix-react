/**
 * Home-page picks, as ranked by TMDB — a snapshot taken 2026-09-11.
 *
 *   TOP_SIX      highest-rated films released 2008 onward, among those with
 *                15,000+ votes
 *   GENRE_DECKS  for eight genres, the top three films of 2000 onward with
 *                5,000+ votes — never repeating a film or a franchise already
 *                shown anywhere on the page
 *
 * The live site computes the same thing from TMDB on load (lib/tmdb.js,
 * homePicks); this copy is the fallback when there is no key or no network.
 * Images come from the TMDB image CDN, which needs no key.
 */
export const TOP_SIX = [
  {
    id: 155,
    title: "The Dark Knight",
    year: 2008,
    rating: 8.5,
    votes: 36661,
    poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop: "/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg"
  },
  {
    id: 496243,
    title: "Parasite",
    year: 2019,
    rating: 8.5,
    votes: 21273,
    poster: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdrop: "/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg"
  },
  {
    id: 157336,
    title: "Interstellar",
    year: 2014,
    rating: 8.5,
    votes: 41107,
    poster: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    backdrop: "/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg"
  },
  {
    id: 324857,
    title: "Spider-Man: Into the Spider-Verse",
    year: 2018,
    rating: 8.4,
    votes: 17830,
    poster: "/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
    backdrop: "/8mnXR9rey5uQ08rZAvzojKWbDQS.jpg"
  },
  {
    id: 244786,
    title: "Whiplash",
    year: 2014,
    rating: 8.4,
    votes: 17056,
    poster: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdrop: "/fRGxZuo7jJUWQsVg9PREb98Aclp.jpg"
  },
  {
    id: 27205,
    title: "Inception",
    year: 2010,
    rating: 8.4,
    votes: 40148,
    poster: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
    backdrop: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg"
  }
];

export const GENRE_DECKS = [
  {
    id: 28,
    name: "Action",
    total: 385,
    films: [
      {
        id: 122,
        title: "The Lord of the Rings: The Return of the King",
        year: 2003,
        rating: 8.5,
        votes: 27313,
        poster: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
        backdrop: "/ctiw6FZK4N36LmkjSklWEbuvlq9.jpg"
      },
      {
        id: 98,
        title: "Gladiator",
        year: 2000,
        rating: 8.2,
        votes: 21458,
        poster: "/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg",
        backdrop: "/Ar7QuJ7sJEiC0oP3I8fKBKIQD9u.jpg"
      },
      {
        id: 361743,
        title: "Top Gun: Maverick",
        year: 2022,
        rating: 8.2,
        votes: 11518,
        poster: "/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg",
        backdrop: "/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg"
      }
    ]
  },
  {
    id: 16,
    name: "Animation",
    total: 98,
    films: [
      {
        id: 129,
        title: "Spirited Away",
        year: 2001,
        rating: 8.5,
        votes: 18866,
        poster: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
        backdrop: "/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg"
      },
      {
        id: 372058,
        title: "Your Name.",
        year: 2016,
        rating: 8.5,
        votes: 12966,
        poster: "/vfJFJPepRKapMd5G2ro7klIRysq.jpg",
        backdrop: "/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg"
      },
      {
        id: 4935,
        title: "Howl's Moving Castle",
        year: 2004,
        rating: 8.4,
        votes: 11414,
        poster: "/13kOl2v0nD2OLbVSHnHk8GUFEhO.jpg",
        backdrop: "/nv5wwZou159v5OC61i4ElR7OqyY.jpg"
      }
    ]
  },
  {
    id: 35,
    name: "Comedy",
    total: 224,
    films: [
      {
        id: 77338,
        title: "The Intouchables",
        year: 2011,
        rating: 8.3,
        votes: 18789,
        poster: "/1QU7HKgsQbGpzsJbJK4pAVQV9F5.jpg",
        backdrop: "/q6OGlZ1KMEb14AC8KbPCxyNOal6.jpg"
      },
      {
        id: 490132,
        title: "Green Book",
        year: 2018,
        rating: 8.2,
        votes: 13215,
        poster: "/7BsvSuDQuoqhWmU2fL7W2GOcZHU.jpg",
        backdrop: "/5En0fmDagt3Pk8d7P3uTwfeQceg.jpg"
      },
      {
        id: 315162,
        title: "Puss in Boots: The Last Wish",
        year: 2022,
        rating: 8.2,
        votes: 9206,
        poster: "/kuf6dutpsT0vSVehic3EZIqkOBt.jpg",
        backdrop: "/jr8tSoJGj33XLgFBy6lmZhpGQNu.jpg"
      }
    ]
  },
  {
    id: 80,
    name: "Crime",
    total: 115,
    films: [
      {
        id: 598,
        title: "City of God",
        year: 2002,
        rating: 8.4,
        votes: 8425,
        poster: "/k7eYdWvhYQyRQoU2TB2A2Xu2TfD.jpg",
        backdrop: "/uvitbjFU4JqvMwIkMWHp69bmUzG.jpg"
      },
      {
        id: 1422,
        title: "The Departed",
        year: 2006,
        rating: 8.2,
        votes: 16612,
        poster: "/nT97ifVT2J1yMQmeq20Qblg61T.jpg",
        backdrop: "/6WRrGYalXXveItfpnipYdayFkQB.jpg"
      },
      {
        id: 475557,
        title: "Joker",
        year: 2019,
        rating: 8.1,
        votes: 28280,
        poster: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
        backdrop: "/rlay2M5QYvi6igbGcFjq8jxeusY.jpg"
      }
    ]
  },
  {
    id: 18,
    name: "Drama",
    total: 269,
    films: [
      {
        id: 423,
        title: "The Pianist",
        year: 2002,
        rating: 8.4,
        votes: 10423,
        poster: "/2hFvxCCWrTmCYwfy7yum0GKRi3Y.jpg",
        backdrop: "/c0fB9xk7D1aVb3Bg2rk2SVJcGn.jpg"
      },
      {
        id: 527641,
        title: "Five Feet Apart",
        year: 2019,
        rating: 8.2,
        votes: 5981,
        poster: "/kreTuJBkUjVWePRfhHZuYfhNE1T.jpg",
        backdrop: "/cYdHaKx6Ihj1BIvbxpCxIGXfZ02.jpg"
      },
      {
        id: 1124,
        title: "The Prestige",
        year: 2006,
        rating: 8.2,
        votes: 18093,
        poster: "/Ag2B2KHKQPukjH7WutmgnnSNurZ.jpg",
        backdrop: "/z3br1ub7spqGMkxgjgJSdM4DC21.jpg"
      }
    ]
  },
  {
    id: 27,
    name: "Horror",
    total: 83,
    films: [
      {
        id: 1339713,
        title: "Obsession",
        year: 2026,
        rating: 8.2,
        votes: 5415,
        poster: "/bRwnj8WEKBCvmfeUNOukJPwB43K.jpg",
        backdrop: "/rZfmzpixLKLR3Hg2u0WgC7XLFl8.jpg"
      },
      {
        id: 396535,
        title: "Train to Busan",
        year: 2016,
        rating: 7.7,
        votes: 8708,
        poster: "/vNVFt6dtcqnI7hqa6LFBUibuFiw.jpg",
        backdrop: "/brnfCYyz8EMbBrHgmh8sCwBi5i1.jpg"
      },
      {
        id: 44214,
        title: "Black Swan",
        year: 2010,
        rating: 7.7,
        votes: 15855,
        poster: "/viWheBd44bouiLCHgNMvahLThqx.jpg",
        backdrop: "/eDLp4uFdqP1gpy9oMrutwH6Q64I.jpg"
      }
    ]
  },
  {
    id: 878,
    name: "Science Fiction",
    total: 239,
    films: [
      {
        id: 687163,
        title: "Project Hail Mary",
        year: 2026,
        rating: 8.6,
        votes: 7649,
        poster: "/yihdXomYb5kTeSivtFndMy5iDmf.jpg",
        backdrop: "/8Tfys3mDZVp4tNoH2ktm06a0Tau.jpg"
      },
      {
        id: 1184918,
        title: "The Wild Robot",
        year: 2024,
        rating: 8.3,
        votes: 6562,
        poster: "/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg",
        backdrop: "/1pmXyN3sKeYoUhu5VBZiDU4BX21.jpg"
      },
      {
        id: 299536,
        title: "Avengers: Infinity War",
        year: 2018,
        rating: 8.2,
        votes: 32854,
        poster: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        backdrop: "/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg"
      }
    ]
  },
  {
    id: 53,
    name: "Thriller",
    total: 236,
    films: [
      {
        id: 670,
        title: "Oldboy",
        year: 2003,
        rating: 8.2,
        votes: 10176,
        poster: "/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg",
        backdrop: "/sdwjQEM869JFwMytTmvr6ggvaUl.jpg"
      },
      {
        id: 16869,
        title: "Inglourious Basterds",
        year: 2009,
        rating: 8.2,
        votes: 24726,
        poster: "/aupnPtagH9JVBuMrGEanf4iqXEQ.jpg",
        backdrop: "/hwNtEmmugU5Yd7hpfprNWI0DGIn.jpg"
      },
      {
        id: 11324,
        title: "Shutter Island",
        year: 2010,
        rating: 8.2,
        votes: 26394,
        poster: "/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg",
        backdrop: "/rbZvGN1A1QyZuoKzhCw8QPmf2q0.jpg"
      }
    ]
  }
];
