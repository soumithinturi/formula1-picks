
// Race 01 - Australia
import melbourneWhite from "@/assets/tracks/circuits/white/melbourne-2.svg";
import melbourneBlack from "@/assets/tracks/circuits/black/melbourne-2.svg";

// Race 02 - China
import shanghaiWhite from "@/assets/tracks/circuits/white/shanghai-1.svg";
import shanghaiBlack from "@/assets/tracks/circuits/black/shanghai-1.svg";

// Race 03 - Japan
import suzukaWhite from "@/assets/tracks/circuits/white/suzuka-2.svg";
import suzukaBlack from "@/assets/tracks/circuits/black/suzuka-2.svg";

// Race 04 - Bahrain
import bahrainWhite from "@/assets/tracks/circuits/white/bahrain-1.svg";
import bahrainBlack from "@/assets/tracks/circuits/black/bahrain-1.svg";

// Race 05 - Saudi Arabia
import jeddahWhite from "@/assets/tracks/circuits/white/jeddah-1.svg";
import jeddahBlack from "@/assets/tracks/circuits/black/jeddah-1.svg";

// Race 06 - Miami
import miamiWhite from "@/assets/tracks/circuits/white/miami-1.svg";
import miamiBlack from "@/assets/tracks/circuits/black/miami-1.svg";

// Race 07 - Monaco
import monacoWhite from "@/assets/tracks/circuits/white/monaco-5.svg";
import monacoBlack from "@/assets/tracks/circuits/black/monaco-5.svg";

// Race 08 - Canada
import montrealWhite from "@/assets/tracks/circuits/white/montreal-6.svg";
import montrealBlack from "@/assets/tracks/circuits/black/montreal-6.svg";

// Race 09 - Austria
import spielbergWhite from "@/assets/tracks/circuits/white/spielberg-3.svg";
import spielbergBlack from "@/assets/tracks/circuits/black/spielberg-3.svg";

// Race 10 - UK
import silverstoneWhite from "@/assets/tracks/circuits/white/silverstone-8.svg";
import silverstoneBlack from "@/assets/tracks/circuits/black/silverstone-8.svg";

// Race 11 - Hungary
import hungaroringWhite from "@/assets/tracks/circuits/white/hungaroring-3.svg";
import hungaroringBlack from "@/assets/tracks/circuits/black/hungaroring-3.svg";

// Race 12 - Belgium
import spaWhite from "@/assets/tracks/circuits/white/spa-francorchamps-4.svg";
import spaBlack from "@/assets/tracks/circuits/black/spa-francorchamps-4.svg";

// Race 13 - Netherlands
import zandvoortWhite from "@/assets/tracks/circuits/white/zandvoort-5.svg";
import zandvoortBlack from "@/assets/tracks/circuits/black/zandvoort-5.svg";

// Race 14 - Italy (Monza)
import monzaWhite from "@/assets/tracks/circuits/white/monza-6.svg";
import monzaBlack from "@/assets/tracks/circuits/black/monza-6.svg";

// Race 15 - Spain (Madrid)
import madridWhite from "@/assets/tracks/circuits/white/madring-1.svg";
import madridBlack from "@/assets/tracks/circuits/black/madring-1.svg";

// Race 16 - Azerbaijan
import bakuWhite from "@/assets/tracks/circuits/white/baku-1.svg";
import bakuBlack from "@/assets/tracks/circuits/black/baku-1.svg";

// Race 17 - Singapore
import singaporeWhite from "@/assets/tracks/circuits/white/marina-bay-4.svg";
import singaporeBlack from "@/assets/tracks/circuits/black/marina-bay-4.svg";

// Race 18 - USA (Austin)
import austinWhite from "@/assets/tracks/circuits/white/austin-1.svg";
import austinBlack from "@/assets/tracks/circuits/black/austin-1.svg";

// Race 19 - Mexico
import mexicoWhite from "@/assets/tracks/circuits/white/mexico-city-3.svg";
import mexicoBlack from "@/assets/tracks/circuits/black/mexico-city-3.svg";

// Race 20 - Brazil
import brazilWhite from "@/assets/tracks/circuits/white/interlagos-2.svg";
import brazilBlack from "@/assets/tracks/circuits/black/interlagos-2.svg";

// Race 21 - Las Vegas
import vegasWhite from "@/assets/tracks/circuits/white/las-vegas-1.svg";
import vegasBlack from "@/assets/tracks/circuits/black/las-vegas-1.svg";

// Race 22 - Qatar
import qatarWhite from "@/assets/tracks/circuits/white/lusail-1.svg";
import qatarBlack from "@/assets/tracks/circuits/black/lusail-1.svg";

// Race 23 - Abu Dhabi
import abudhabiWhite from "@/assets/tracks/circuits/white/yas-marina-2.svg";
import abudhabiBlack from "@/assets/tracks/circuits/black/yas-marina-2.svg";

export const races2026 = [
  {
    round: 1,
    name: "Australian Grand Prix",
    location: "Melbourne, Australia",
    date: "Mar 06 - Mar 08",
    circuitId: "melbourne",
    timezone: "Australia/Melbourne",
    trackMap: {
      white: melbourneWhite,
      black: melbourneBlack,
    },
    status: "Upcoming",
  },
  {
    round: 2,
    name: "Chinese Grand Prix",
    location: "Shanghai, China",
    date: "Mar 13 - Mar 15",
    circuitId: "shanghai",
    timezone: "Asia/Shanghai",
    trackMap: {
      white: shanghaiWhite,
      black: shanghaiBlack,
    },
    status: "Upcoming",
  },
  {
    round: 3,
    name: "Japanese Grand Prix",
    location: "Suzuka, Japan",
    date: "Mar 27 - Mar 29",
    circuitId: "suzuka",
    timezone: "Asia/Tokyo",
    trackMap: {
      white: suzukaWhite,
      black: suzukaBlack,
    },
    status: "Upcoming",
  },
  {
    round: 4,
    name: "Bahrain Grand Prix",
    location: "Sakhir, Bahrain",
    date: "Apr 10 - Apr 12",
    circuitId: "bahrain",
    timezone: "Asia/Bahrain",
    trackMap: {
      white: bahrainWhite,
      black: bahrainBlack,
    },
    status: "Upcoming",
  },
  {
    round: 5,
    name: "Saudi Arabian Grand Prix",
    location: "Jeddah, Saudi Arabia",
    date: "Apr 17 - Apr 19",
    circuitId: "jeddah",
    timezone: "Asia/Riyadh",
    trackMap: {
      white: jeddahWhite,
      black: jeddahBlack,
    },
    status: "Upcoming",
  },
  {
    round: 6,
    name: "Miami Grand Prix",
    location: "Miami, USA",
    date: "May 01 - May 03",
    circuitId: "miami",
    timezone: "America/New_York",
    trackMap: {
      white: miamiWhite,
      black: miamiBlack,
    },
    status: "Upcoming",
  },
  {
    round: 7,
    name: "Monaco Grand Prix",
    location: "Monte Carlo, Monaco",
    date: "May 22 - May 24", // Approximate slot swap with Canada/Europe leg
    circuitId: "monaco",
    timezone: "Europe/Monaco",
    trackMap: {
      white: monacoWhite,
      black: monacoBlack,
    },
    status: "Upcoming",
  },
  {
    round: 8,
    name: "Canadian Grand Prix",
    location: "Montreal, Canada",
    date: "Jun 05 - Jun 07",
    circuitId: "montreal",
    timezone: "America/Toronto",
    trackMap: {
      white: montrealWhite,
      black: montrealBlack,
    },
    status: "Upcoming",
  },
  {
    round: 9,
    name: "Austrian Grand Prix",
    location: "Spielberg, Austria",
    date: "Jun 26 - Jun 28", // Probable slot
    circuitId: "spielberg",
    timezone: "Europe/Vienna",
    trackMap: {
      white: spielbergWhite,
      black: spielbergBlack,
    },
    status: "Upcoming",
  },
  {
    round: 10,
    name: "British Grand Prix",
    location: "Silverstone, UK",
    date: "Jul 03 - Jul 05",
    circuitId: "silverstone",
    timezone: "Europe/London",
    trackMap: {
      white: silverstoneWhite,
      black: silverstoneBlack,
    },
    status: "Upcoming",
  },
  {
    round: 11,
    name: "Hungarian Grand Prix",
    location: "Budapest, Hungary",
    date: "Jul 17 - Jul 19",
    circuitId: "hungaroring",
    timezone: "Europe/Budapest",
    trackMap: {
      white: hungaroringWhite,
      black: hungaroringBlack,
    },
    status: "Upcoming",
  },
  {
    round: 12,
    name: "Belgian Grand Prix",
    location: "Spa-Francorchamps, Belgium",
    date: "Jul 24 - Jul 26",
    circuitId: "spa-francorchamps",
    timezone: "Europe/Brussels",
    trackMap: {
      white: spaWhite,
      black: spaBlack,
    },
    status: "Upcoming",
  },
  {
    round: 13,
    name: "Dutch Grand Prix",
    location: "Zandvoort, Netherlands",
    date: "Aug 21 - Aug 23",
    circuitId: "zandvoort",
    timezone: "Europe/Amsterdam",
    trackMap: {
      white: zandvoortWhite,
      black: zandvoortBlack,
    },
    status: "Upcoming",
  },
  {
    round: 14,
    name: "Italian Grand Prix",
    location: "Monza, Italy",
    date: "Sep 04 - Sep 06",
    circuitId: "monza",
    timezone: "Europe/Rome",
    trackMap: {
      white: monzaWhite,
      black: monzaBlack,
    },
    status: "Upcoming",
  },
  {
    round: 15,
    name: "Spanish Grand Prix",
    location: "Madrid, Spain",
    date: "Sep 11 - Sep 13",
    circuitId: "madring",
    timezone: "Europe/Madrid",
    trackMap: {
      white: madridWhite,
      black: madridBlack,
    },
    status: "Upcoming",
  },
  {
    round: 16,
    name: "Azerbaijan Grand Prix",
    location: "Baku, Azerbaijan",
    date: "Sep 25 - Sep 27",
    circuitId: "baku",
    timezone: "Asia/Baku",
    trackMap: {
      white: bakuWhite,
      black: bakuBlack,
    },
    status: "Upcoming",
  },
  {
    round: 17,
    name: "Singapore Grand Prix",
    location: "Marina Bay, Singapore",
    date: "Oct 02 - Oct 04",
    circuitId: "marina-bay",
    timezone: "Asia/Singapore",
    trackMap: {
      white: singaporeWhite,
      black: singaporeBlack,
    },
    status: "Upcoming",
  },
  {
    round: 18,
    name: "United States Grand Prix",
    location: "Austin, USA",
    date: "Oct 16 - Oct 18",
    circuitId: "austin",
    timezone: "America/Chicago",
    trackMap: {
      white: austinWhite,
      black: austinBlack,
    },
    status: "Upcoming",
  },
  {
    round: 19,
    name: "Mexico City Grand Prix",
    location: "Mexico City, Mexico",
    date: "Oct 30 - Nov 01",
    circuitId: "mexico-city",
    timezone: "America/Mexico_City",
    trackMap: {
      white: mexicoWhite,
      black: mexicoBlack,
    },
    status: "Upcoming",
  },
  {
    round: 20,
    name: "São Paulo Grand Prix",
    location: "São Paulo, Brazil",
    date: "Nov 13 - Nov 15",
    circuitId: "interlagos",
    timezone: "America/Sao_Paulo",
    trackMap: {
      white: brazilWhite,
      black: brazilBlack,
    },
    status: "Upcoming",
  },
  {
    round: 21,
    name: "Las Vegas Grand Prix",
    location: "Las Vegas, USA",
    date: "Nov 26 - Nov 28",
    circuitId: "las-vegas",
    timezone: "America/Los_Angeles",
    trackMap: {
      white: vegasWhite,
      black: vegasBlack,
    },
    status: "Upcoming",
  },
  {
    round: 22,
    name: "Qatar Grand Prix",
    location: "Lusail, Qatar",
    date: "Dec 04 - Dec 06", // Sequence end is tight
    circuitId: "lusail",
    timezone: "Asia/Qatar",
    trackMap: {
      white: qatarWhite,
      black: qatarBlack,
    },
    status: "Upcoming",
  },
  {
    round: 23,
    name: "Abu Dhabi Grand Prix",
    location: "Yas Island, Abu Dhabi",
    date: "Dec 11 - Dec 13",
    circuitId: "yas-marina",
    timezone: "Asia/Dubai",
    trackMap: {
      white: abudhabiWhite,
      black: abudhabiBlack,
    },
    status: "Upcoming",
  }
];
