import type { Locale } from "@/lib/locale";
import type { Point } from "@/lib/places";
import { ROUTES, type ServicePicture, type ShuttleRoute } from "@/lib/routes";
import type { WalkApp } from "@/lib/walk-links";

/**
 * Visible copy for the one campus-bus page.
 * Simplified strings match the page as it shipped. Traditional is the same
 * wording in traditional characters. English is a plain translation.
 * Route and place names stay the catalog Chinese unless this file only
 * changes the script. Nothing here invents an English route or place name.
 */

const ROUTE_HANT: Record<string, string> = {
  本部线: "本部線",
  新联线: "新聯線",
  "新联线（S）": "新聯線（S）",
  逸夫线: "逸夫線",
  环回线: "環回線",
  西部线: "西部線",
  晚间线: "晚間線",
  假日线: "假日線",
  转堂上行: "轉堂上行",
  转堂下行: "轉堂下行",
};

const PLACE_HANT: Record<string, string> = {
  大学站: "大學站",
  大学站广场: "大學站廣場",
  康本园: "康本園",
  崇基教学楼: "崇基教學樓",
  善衡书院: "善衡書院",
  大学体育中心: "大學體育中心",
  邵逸夫堂: "邵逸夫堂",
  科学馆: "科學館",
  大学行政楼: "大學行政樓",
  冯景禧楼: "馮景禧樓",
  新亚书院: "新亞書院",
  新亚坊: "新亞坊",
  "联合书院（上行）": "聯合書院（上行）",
  "联合书院（下行）": "聯合書院（下行）",
  十五苑: "十五苑",
  联合苑: "聯合苑",
  陈震夏宿舍: "陳震夏宿舍",
  "逸夫书院（上行）": "逸夫書院（上行）",
  "逸夫书院（下行）": "逸夫書院（下行）",
  "三、四苑（上行）": "三、四苑（上行）",
  "三、四苑（下行）": "三、四苑（下行）",
  "环回东站（上行）": "環回東站（上行）",
  "环回东站（下行）": "環回東站（下行）",
  研究生宿舍一座: "研究生宿舍一座",
  "敬文书院（上行）": "敬文書院（上行）",
  "敬文书院（下行）": "敬文書院（下行）",
  "39区（上行）": "39區（上行）",
  "39区（下行）": "39區（下行）",
  环回北站: "環回北站",
  联合书院: "聯合書院",
  大学图书馆: "大學圖書館",
  逸夫书院: "逸夫書院",
  晨兴书院: "晨興書院",
  和声书院: "和聲書院",
  伍宜孙书院: "伍宜孫書院",
  敬文书院: "敬文書院",
};

const HOLIDAY_HANT: Record<string, string> = {
  元旦: "元旦",
  农历年初一: "農曆年初一",
  农历年初二: "農曆年初二",
  农历年初三: "農曆年初三",
  农历年初四: "農曆年初四",
  耶稣受难节: "耶穌受難節",
  耶稣受难节翌日: "耶穌受難節翌日",
  清明节翌日: "清明節翌日",
  复活节星期一翌日: "復活節星期一翌日",
  劳动节: "勞動節",
  佛诞翌日: "佛誕翌日",
  端午节: "端午節",
  香港特别行政区成立纪念日: "香港特別行政區成立紀念日",
  中秋节翌日: "中秋節翌日",
  国庆日: "國慶日",
  重阳节翌日: "重陽節翌日",
  圣诞节: "聖誕節",
  圣诞节后首个工作日: "聖誕節後首個工作日",
  清明节: "清明節",
  复活节星期一: "復活節星期一",
  佛诞: "佛誕",
  重阳节: "重陽節",
};

const HOLIDAY_EN: Record<string, string> = {
  元旦: "New Year's Day",
  农历年初一: "Lunar New Year's Day",
  农历年初二: "the second day of Lunar New Year",
  农历年初三: "the third day of Lunar New Year",
  农历年初四: "the fourth day of Lunar New Year",
  耶稣受难节: "Good Friday",
  耶稣受难节翌日: "the day following Good Friday",
  清明节翌日: "the day following Ching Ming Festival",
  复活节星期一翌日: "the day following Easter Monday",
  劳动节: "Labour Day",
  佛诞翌日: "the day following the Buddha's Birthday",
  端午节: "Tuen Ng Festival",
  香港特别行政区成立纪念日: "Hong Kong Special Administrative Region Establishment Day",
  中秋节翌日: "the day following the Chinese Mid-Autumn Festival",
  国庆日: "National Day",
  重阳节翌日: "the day following Chung Yeung Festival",
  圣诞节: "Christmas Day",
  圣诞节后首个工作日: "the first weekday after Christmas Day",
  清明节: "Ching Ming Festival",
  复活节星期一: "Easter Monday",
  佛诞: "the Buddha's Birthday",
  重阳节: "Chung Yeung Festival",
};

const WEEKDAY_EN: Record<string, string> = {
  星期日: "Sunday",
  星期一: "Monday",
  星期二: "Tuesday",
  星期三: "Wednesday",
  星期四: "Thursday",
  星期五: "Friday",
  星期六: "Saturday",
};

const REMARK_HANT: Record<string, string> = {
  "邵逸夫堂只有每小时 45 分那班停靠。": "邵逸夫堂只有每小時 45 分那班停靠。",
  "研究生宿舍一座只有每小时整点的班次停靠。": "研究生宿舍一座只有每小時整點的班次停靠。",
  "39区（上行）只有每小时整点的班次停靠。": "39區（上行）只有每小時整點的班次停靠。",
};

const REMARK_EN: Record<string, string> = {
  "邵逸夫堂只有每小时 45 分那班停靠。": "Only the bus at 45 minutes past each hour stops at 邵逸夫堂.",
  "研究生宿舍一座只有每小时整点的班次停靠。": "Only the bus on the hour stops at 研究生宿舍一座.",
  "39区（上行）只有每小时整点的班次停靠。": "Only the bus on the hour stops at 39区（上行）.",
};

const NOTE_HANT: Record<string, string> = {
  "每小时 45 分的班次加停邵逸夫堂，15 分的班次不停。": "每小時 45 分的班次加停邵逸夫堂，15 分的班次不停。",
  "比 2 号线多停研究生宿舍一座，去程和回程各一站。": "比 2 號線多停研究生宿舍一座，去程和回程各一站。",
  "星期一至六（公众假期除外），终点是大学站。星期日和公众假期改走假日线 H。":
    "星期一至六（公眾假期除外），終點是大學站。星期日和公眾假期改走假日線 H。",
  "星期六同样走晚间线。到了这个时段才建议，没有单独开关。整点班次加停研究生宿舍一座。":
    "星期六同樣走晚間線。到了這個時段才建議，沒有單獨開關。整點班次加停研究生宿舍一座。",
  "只开星期日和公众假期，星期六不走这条线。全天用这一条，包含傍晚，不另开晚间线。整点班次加停研究生宿舍一座和 39区（上行）。":
    "只開星期日和公眾假期，星期六不走這條線。全天用這一條，包含傍晚，不另開晚間線。整點班次加停研究生宿舍一座和 39區（上行）。",
  "转堂校巴。只在这个时段内建议。": "轉堂校巴。只在這個時段內建議。",
};

const NOTE_EN: Record<string, string> = {
  "每小时 45 分的班次加停邵逸夫堂，15 分的班次不停。":
    "The :45 departure also stops at 邵逸夫堂. The :15 departure does not.",
  "比 2 号线多停研究生宿舍一座，去程和回程各一站。":
    "Compared with route 2, it also stops at 研究生宿舍一座, once each way.",
  "星期一至六（公众假期除外），终点是大学站。星期日和公众假期改走假日线 H。":
    "Monday to Saturday (except public holidays), the end of the line is 大学站. Sundays and public holidays use 假日线 H.",
  "星期六同样走晚间线。到了这个时段才建议，没有单独开关。整点班次加停研究生宿舍一座。":
    "Saturday uses 晚间线 as well. It is suggested only in this window, with no separate switch. The bus on the hour also stops at 研究生宿舍一座.",
  "只开星期日和公众假期，星期六不走这条线。全天用这一条，包含傍晚，不另开晚间线。整点班次加停研究生宿舍一座和 39区（上行）。":
    "Runs only on Sundays and public holidays, not on Saturday. This one route covers the whole day, including the evening, with no separate 晚间线. The bus on the hour also stops at 研究生宿舍一座 and 39区（上行）.",
  "转堂校巴。只在这个时段内建议。": "Meet-class bus. Suggested only inside this window.",
};

const APP_LABEL: Record<Locale, Record<WalkApp["id"], string>> = {
  "zh-Hans": {
    apple: "苹果地图",
    amap: "高德地图",
    tencent: "腾讯地图",
    baidu: "百度地图",
    google: "谷歌地图（有时无法正常使用）",
  },
  "zh-Hant": {
    apple: "蘋果地圖",
    amap: "高德地圖",
    tencent: "騰訊地圖",
    baidu: "百度地圖",
    google: "谷歌地圖（有時無法正常使用）",
  },
  en: {
    apple: "Apple Maps",
    amap: "Amap",
    tencent: "Tencent Maps",
    baidu: "Baidu Maps",
    google: "Google Maps (sometimes does not work)",
  },
};

/** Catalog names stay Chinese. Pins keep the stored label, including in English. */
export function placeLabel(point: Pick<Point, "name" | "kind">, locale: Locale): string {
  if (point.kind === "pin" || locale !== "zh-Hant") return point.name;
  return PLACE_HANT[point.name] ?? point.name;
}

/** English keeps the Chinese route name when the data has no English name. */
export function routeLabel(name: string, locale: Locale): string {
  if (locale !== "zh-Hant") return name;
  return ROUTE_HANT[name] ?? name;
}

export function remarkText(remark: string, locale: Locale): string {
  if (locale === "zh-Hans") return remark;
  const table = locale === "zh-Hant" ? REMARK_HANT : REMARK_EN;
  return table[remark] ?? remark;
}

export function noteText(note: string, locale: Locale): string {
  if (locale === "zh-Hans") return note;
  const table = locale === "zh-Hant" ? NOTE_HANT : NOTE_EN;
  return table[note] ?? note;
}

function weekdayText(weekday: string, locale: Locale): string {
  if (locale === "en") return WEEKDAY_EN[weekday] ?? weekday;
  return weekday;
}

function holidayText(name: string, locale: Locale): string {
  if (locale === "zh-Hans") return name;
  if (locale === "zh-Hant") return HOLIDAY_HANT[name] ?? name;
  return HOLIDAY_EN[name] ?? name;
}

function windowDays(route: ShuttleRoute, locale: Locale): string {
  if (route.days === "holiday") {
    if (locale === "en") return "Sundays and Hong Kong public holidays";
    if (locale === "zh-Hant") return "星期日及香港公眾假期";
    return "星期日及香港公众假期";
  }
  if (route.special) {
    if (locale === "en") return "Monday to Friday teaching days";
    if (locale === "zh-Hant") return "星期一至五教學日";
    return "星期一至五教学日";
  }
  if (route.evening) {
    if (locale === "en") return "Monday to Saturday evenings (except public holidays)";
    if (locale === "zh-Hant") return "星期一至六晚間（公眾假期除外）";
    return "星期一至六晚间（公众假期除外）";
  }
  if (locale === "en") return "Monday to Saturday (except public holidays)";
  if (locale === "zh-Hant") return "星期一至六（公眾假期除外）";
  return "星期一至六（公众假期除外）";
}

export function windowText(route: ShuttleRoute, locale: Locale): string {
  if (locale === "zh-Hans") return route.windowLabel;
  const days = windowDays(route, locale);
  const list = route.minutes.map((minute) => String(minute).padStart(2, "0")).join(locale === "en" ? ", " : "、");
  if (locale === "en") return `${days} ${route.first}–${route.last}, at ${list} each hour`;
  return `${days} ${route.first}–${route.last}，每小時 ${list} 分`;
}

export function routeWhenText(route: ShuttleRoute, locale: Locale): string {
  if (route.days === "holiday") {
    if (locale === "en") return "Sundays and public holidays";
    if (locale === "zh-Hant") return "星期日及公眾假期";
    return "星期日及公众假期";
  }
  if (route.special) {
    if (locale === "en") return "Monday to Friday teaching days, limited hours";
    if (locale === "zh-Hant") return "星期一至五教學日，限時";
    return "星期一至五教学日，限时";
  }
  if (route.evening) {
    if (locale === "en") return "Monday to Saturday evenings (except public holidays)";
    if (locale === "zh-Hant") return "星期一至六晚間（公眾假期除外）";
    return "星期一至六晚间（公众假期除外）";
  }
  if (locale === "en") return "Monday to Saturday (except public holidays)";
  if (locale === "zh-Hant") return "星期一至六（公眾假期除外）";
  return "星期一至六（公众假期除外）";
}

export function timetableFor(routeId: string, fallback: string, locale: Locale): string {
  const route = ROUTES.find((item) => item.id === routeId);
  return route ? windowText(route, locale) : fallback;
}

export function pictureText(picture: ServicePicture, locale: Locale): { summary: string; short: string } {
  if (locale === "zh-Hans") return { summary: picture.summary, short: picture.short };
  const { info, period, timeLabel } = picture;
  const weekday = weekdayText(info.weekday, locale);
  const holiday = info.name ? holidayText(info.name, locale) : "";
  if (locale === "zh-Hant") {
    const when = `香港時間 ${timeLabel}，${weekday}`;
    if (info.kind === "public") {
      return {
        summary: `${when}，公眾假期（${holiday}）。全天按假日線 H，08:20–23:20，不分開晚間線。`,
        short: "當前是公眾假期，按假日線 H。",
      };
    }
    if (info.kind === "saturday" && period === "evening") {
      return {
        summary: `${when}。星期六晚間按晚間線 N，19:00–23:30。轉堂校巴星期六不開。`,
        short: "當前是星期六晚間，按晚間線 N。",
      };
    }
    if (info.kind === "saturday" && period === "day") {
      return {
        summary: `${when}。星期六按星期一至六的路線，不是假日線。白天走 1、2、2S、3、4、8；19:00 起改晚間線 N。轉堂校巴星期六不開。`,
        short: "當前是星期六，按星期一至六的路線。",
      };
    }
    if (info.kind === "saturday") {
      return {
        summary: `${when}。星期六現在不在日間班次或晚間線 N（19:00–23:30）裡面。`,
        short: "當前是星期六，不在開行時段裡。",
      };
    }
    if (info.kind === "sunday") {
      return {
        summary: `${when}。星期日按假日線 H，08:20–23:20，不分開晚間線。`,
        short: "當前是星期日，按假日線 H。",
      };
    }
    if (period === "evening") {
      return {
        summary: `${when}，上課日晚間。按晚間線 N 的時刻表 19:00–23:30，不是單獨開關。`,
        short: "當前是上課日晚間，按晚間線 N。",
      };
    }
    if (period === "day") {
      return {
        summary: `${when}，上課日白天。按 1、2、2S、3、4、8 線各自的開行時段；19:00 起改晚間線 N。轉堂校巴只在教學日時段內建議。`,
        short: "當前是上課日白天。",
      };
    }
    return {
      summary: `${when}，上課日。現在不在日間班次或晚間線 N（19:00–23:30）裡面。`,
      short: "當前不在校巴開行時段裡。",
    };
  }

  const when = `Hong Kong time ${timeLabel}, ${weekday}`;
  if (info.kind === "public") {
    return {
      summary: `${when}. Public holiday (${holiday}). 假日线 H runs all day, 08:20–23:20, with no separate evening line.`,
      short: "It is a public holiday. 假日线 H is running.",
    };
  }
  if (info.kind === "saturday" && period === "evening") {
    return {
      summary: `${when}. Saturday evening follows 晚间线 N, 19:00–23:30. Meet-class buses do not run on Saturday.`,
      short: "It is Saturday evening. 晚间线 N is running.",
    };
  }
  if (info.kind === "saturday" && period === "day") {
    return {
      summary: `${when}. Saturday follows the Monday–Saturday routes, not the holiday line. Daytime routes are 1, 2, 2S, 3, 4, and 8; from 19:00 it switches to 晚间线 N. Meet-class buses do not run on Saturday.`,
      short: "It is Saturday. Monday–Saturday routes are running.",
    };
  }
  if (info.kind === "saturday") {
    return {
      summary: `${when}. Saturday is outside the daytime departures and 晚间线 N (19:00–23:30).`,
      short: "It is Saturday, outside running hours.",
    };
  }
  if (info.kind === "sunday") {
    return {
      summary: `${when}. Sunday follows 假日线 H, 08:20–23:20, with no separate evening line.`,
      short: "It is Sunday. 假日线 H is running.",
    };
  }
  if (period === "evening") {
    return {
      summary: `${when}, a teaching-day evening. Follow 晚间线 N, 19:00–23:30. It is not a separate switch.`,
      short: "It is a teaching-day evening. 晚间线 N is running.",
    };
  }
  if (period === "day") {
    return {
      summary: `${when}, a teaching-day daytime. Routes 1, 2, 2S, 3, 4, and 8 run in their own windows; from 19:00 it switches to 晚间线 N. Meet-class buses are suggested only inside teaching-day windows.`,
      short: "It is a teaching-day daytime.",
    };
  }
  return {
    summary: `${when}, a teaching day. It is outside the daytime departures and 晚间线 N (19:00–23:30).`,
    short: "Outside shuttle running hours.",
  };
}

function waitPhrase(wait: number, locale: Locale): string {
  if (wait <= 0) {
    if (locale === "en") return "this bus has just left or is about to leave";
    if (locale === "zh-Hant") return "現在這班剛開出或即將開出";
    return "现在这班刚开出或即将开出";
  }
  if (locale === "en") return `about ${wait} minutes to wait`;
  if (locale === "zh-Hant") return `大約還要等 ${wait} 分鐘`;
  return `大约还要等 ${wait} 分钟`;
}

function distancePhrase(meters: number, locale: Locale): string {
  if (meters < 10) {
    if (locale === "en") return "under 10 metres";
    return "不到 10 米";
  }
  const rounded = Math.max(10, Math.round(meters / 10) * 10);
  if (locale === "en") return `about ${rounded} metres`;
  if (locale === "zh-Hant") return `約 ${rounded} 米`;
  return `约 ${rounded} 米`;
}

export function messages(locale: Locale) {
  const en = locale === "en";
  const hant = locale === "zh-Hant";
  const term = en ? "First term, 2026–27" : hant ? "2026–27 學年第一學期" : "2026–27 学年第一学期";
  return {
    title: en ? "CUHK Shuttle Bus" : "中大穿梭校巴",
    intro: en
      ? `${term}. The timetable is static, not live. Follow the Transport Office. Teaching days, evenings, and holidays follow Hong Kong time. Choose a start and an end to see which route to take, where to board, and where to alight.`
      : hant
        ? `${term}。班次是靜態時刻表，非實時，以交通處為準。按香港時間區分上課日、晚間和假日。選出起點和終點，看該乘哪一路、在哪一站上、在哪一站下。`
        : `${term}。班次是静态时刻表，非实时，以交通处为准。按香港时间区分上课日、晚间和假日。选出起点和终点，看该乘哪一路、在哪一站上、在哪一站下。`,
    mapKey: en
      ? "Grey dots are bus stops · green is the start · red is the end · OpenStreetMap"
      : hant
        ? "灰點是校巴站 · 綠點起點 · 紅點終點 · OpenStreetMap"
        : "灰点是校巴站 · 绿点起点 · 红点终点 · OpenStreetMap",
    endsTitle: en ? "Start and end" : hant ? "起點和終點" : "起点和终点",
    modeStart: en
      ? "A tap on the map or a place is saved as the start."
      : hant
        ? "現在點地圖或地點，會記成起點。"
        : "现在点地图或地点，会记成起点。",
    modeEnd: en
      ? "A tap on the map or a place is saved as the end."
      : hant
        ? "現在點地圖或地點，會記成終點。"
        : "现在点地图或地点，会记成终点。",
    endsAria: en ? "Start or end" : hant ? "起點或終點" : "起点或终点",
    setStart: en ? "Set start" : hant ? "設定起點" : "设置起点",
    setEnd: en ? "Set end" : hant ? "設定終點" : "设置终点",
    placePlaceholder: en ? "Enter a place name" : hant ? "輸入地點名稱" : "输入地点名称",
    placeAria: en ? "Place name" : hant ? "地點名稱" : "地点名称",
    lookup: en ? "Look up" : "定位",
    looking: en ? "Looking up…" : "正在查找…",
    useHere: en ? "Use current location" : hant ? "使用目前位置" : "使用当前位置",
    locating: en ? "Locating…" : "正在定位…",
    start: en ? "Start" : hant ? "起點" : "起点",
    end: en ? "End" : hant ? "終點" : "终点",
    unset: en ? "Not chosen" : hant ? "還沒選" : "还没选",
    clear: en ? "Clear" : "清除",
    clockLoading: en
      ? "Reading Hong Kong time. Teaching days, evenings, and holidays follow this clock. There is no manual switch."
      : hant
        ? "正在讀取香港時間。上課日、晚間和假日都按這個時間決定，不用手動切換。"
        : "正在读取香港时间。上课日、晚间和假日都按这个时间决定，不用手动切换。",
    stops: en ? "Bus stops" : hant ? "校巴站點" : "校巴站点",
    routes: en ? "Listed routes" : hant ? "收錄的路線" : "收录的路线",
    routesLead: en
      ? "Compiled from the Transport Office shuttle and meet-class pages (October 2026). The paid minibus is not included. The shuttle is for CUHK students and staff."
      : hant
        ? "整理自交通處穿梭校巴和轉堂校巴頁面（2026 年 10 月）。收費小巴不在這裡。校巴是中大學生和教職員專車。"
        : "整理自交通处穿梭校巴和转堂校巴页面（2026 年 10 月）。收费小巴不在这里。校巴是中大学生和教职员专车。",
    routesFoot: en
      ? "Monday to Saturday (except public holidays), evenings follow route N, 19:00–23:30, with no separate switch. Sundays and Hong Kong public holidays use 假日线 H. Meet-class routes 5, 6A, 6B, and 7 are suggested only in Monday–Friday windows, and not on Saturday. Walking times are estimates by campus zone. Source:"
      : hant
        ? "星期一至六（公眾假期除外）的晚間按 N 線 19:00–23:30，沒有單獨開關。星期日和香港公眾假期走假日線 H。轉堂校巴 5、6A、6B、7 只在星期一至五的時段裡建議，星期六不開。步行時間按校園分區估算。出處："
        : "星期一至六（公众假期除外）的晚间按 N 线 19:00–23:30，没有单独开关。星期日和香港公众假期走假日线 H。转堂校巴 5、6A、6B、7 只在星期一至五的时段里建议，星期六不开。步行时间按校园分区估算。出处：",
    office: en ? "CUHK Transport Office" : hant ? "香港中文大學交通處" : "香港中文大学交通处",
    notReadyTitle: en ? "Not chosen yet" : hant ? "還沒選好" : "还没选好",
    notReadyLead: en
      ? "Choose a start and an end. Tap the map, or pick a place above."
      : hant
        ? "先選定起點和終點。可以點地圖，也可以從上面的地點裡選。"
        : "先选定起点和终点。可以点地图，也可以从上面的地点里选。",
    notReadyBody: en
      ? "After both are set, this shows which route to take, or to walk. To walk, choose a map first, then open it."
      : hant
        ? "選好兩處之後，這裡會告訴你乘哪一路，或者直接走路。要步行時先選一個地圖再打開。"
        : "选好两处之后，这里会告诉你乘哪一路，或者直接走路。要步行时先选一个地图再打开。",
    matchingTitle: en ? "Checking the timetable" : hant ? "正在對時刻表" : "正在对时刻表",
    matchingLead: en
      ? "Checking Hong Kong time for when the next bus leaves."
      : hant
        ? "按香港時間看下一班大概幾點開出。"
        : "按香港时间看下一班大概几点开出。",
    sameTitle: en ? "Start and end are the same place" : hant ? "起點和終點是同一個地方" : "起点和终点是同一个地方",
    sameLead: en ? "No bus is needed. Choose a different end." : hant ? "不用乘車。換一個終點再看。" : "不用乘车。换一个终点再看。",
    walkTitle: en ? "Walk there" : hant ? "走過去就好" : "走过去就好",
    walkLead(start: string, end: string, minutes: number, meters: number) {
      if (en) {
        return `From ${start} to ${end} is about ${minutes} minutes, about ${meters} metres in a straight line, no more than 500 metres. No shuttle fits this trip better.`;
      }
      if (hant) {
        return `從${start}到${end}大約 ${minutes} 分鐘，直線大約 ${meters} 米，不超過 500 米。這段路沒有更合適的校巴。`;
      }
      return `从${start}到${end}大约 ${minutes} 分钟，直线大约 ${meters} 米，不超过 500 米。这段路没有更合适的校巴。`;
    },
    suggestMeet(id: string) {
      if (en) return `Take meet-class bus ${id}`;
      if (hant) return `建議乘轉堂校巴 ${id}`;
      return `建议乘转堂校巴 ${id}`;
    },
    suggestLine(id: string) {
      if (en) return `Take route ${id}`;
      if (hant) return `建議乘 ${id} 號線`;
      return `建议乘 ${id} 号线`;
    },
    busLead(name: string, timetable: string, total: number, direct: number) {
      if (en) {
        return `${name}. ${timetable}. About ${total} minutes in all, including the walk to the stop and the wait. Walking the whole way is about ${direct} minutes.`;
      }
      if (hant) {
        return `${name}。${timetable}。全程大約 ${total} 分鐘，含走到車站和等車。直接走大約 ${direct} 分鐘。`;
      }
      return `${name}。${timetable}。全程大约 ${total} 分钟，含走到车站和等车。直接走大约 ${direct} 分钟。`;
    },
    closedTitle: en ? "No suitable bus is running now" : hant ? "現在等不到合適的班次" : "现在等不到合适的班次",
    closedEnded(id: string) {
      if (en) return `Route ${id} has finished for today, or the bus you need has not reached its stop yet.`;
      if (hant) return `${id} 號線今天的班次已經過了末班，或還沒到你要坐的那一班。`;
      return `${id} 号线今天的班次已经过了末班，或还没到你要坐的那一班。`;
    },
    closedWait(id: string, depart: string, wait: number) {
      if (en) return `The next route ${id} bus is ${depart}, and the wait is ${wait} minutes, which is too long.`;
      if (hant) return `${id} 號線下一班是 ${depart}，還要等 ${wait} 分鐘，太久了。`;
      return `${id} 号线下一班是 ${depart}，还要等 ${wait} 分钟，太久了。`;
    },
    closedThen(minutes: number) {
      if (en) return ` Walk for about ${minutes} minutes instead.`;
      if (hant) return `先步行大約 ${minutes} 分鐘。`;
      return `先步行大约 ${minutes} 分钟。`;
    },
    noneTitle: en ? "No shuttle goes this way" : hant ? "沒有順路的校巴" : "没有顺路的校巴",
    noneLead(start: string, end: string, minutes: number) {
      if (en) return `The shuttle only runs in fixed directions. Nothing runs from ${start} to ${end}. Walking takes about ${minutes} minutes.`;
      if (hant) return `穿梭校巴只沿固定方向開，${start}到${end}沒有順路班次。步行大約 ${minutes} 分鐘。`;
      return `穿梭校巴只沿固定方向开，${start}到${end}没有顺路班次。步行大约 ${minutes} 分钟。`;
    },
    fasterTitle: en ? "Walking is faster" : "步行更快",
    fasterBody(start: string, end: string, direct: number, saved: number) {
      if (en) return `Walking from ${start} to ${end} takes about ${direct} minutes, ${saved} minutes less than this bus.`;
      if (hant) return `從${start}走到${end}大約 ${direct} 分鐘，比這路校巴少 ${saved} 分鐘。`;
      return `从${start}走到${end}大约 ${direct} 分钟，比这路校巴少 ${saved} 分钟。`;
    },
    shortNote(meters: number) {
      if (en) return `A walk is enough. The straight line is about ${meters} metres, no more than 500 metres.`;
      if (hant) return `走過去就好。直線大約 ${meters} 米，不超過 500 米。`;
      return `走过去就好。直线大约 ${meters} 米，不超过 500 米。`;
    },
    board: en ? "Board" : hant ? "上車" : "上车",
    walkIn(minutes: number) {
      if (en) return `About ${minutes} minutes to the stop`;
      if (hant) return `走到車站約 ${minutes} 分鐘`;
      return `走到车站约 ${minutes} 分钟`;
    },
    alight: en ? "Alight" : hant ? "下車" : "下车",
    walkOut(minutes: number) {
      if (en) return `About ${minutes} minutes after you get off`;
      if (hant) return `下車後再走約 ${minutes} 分鐘`;
      return `下车后再走约 ${minutes} 分钟`;
    },
    ride(ride: number, hops: number, depart: string | null, wait: number) {
      const waitText = waitPhrase(wait, locale);
      if (en) {
        const trip = `The ride is about ${ride} minutes, about ${hops} stops along the way.`;
        return depart ? `${trip} Next bus ${depart}, ${waitText}.` : `${trip} No later bus today.`;
      }
      if (hant) {
        const trip = `車程約 ${ride} 分鐘，中途大約 ${hops} 站。`;
        return depart ? `${trip} 下一班 ${depart}，${waitText}。` : `${trip} 今天沒有更晚的班次。`;
      }
      const trip = `车程约 ${ride} 分钟，中途大约 ${hops} 站。`;
      return depart ? `${trip} 下一班 ${depart}，${waitText}。` : `${trip} 今天没有更晚的班次。`;
    },
    meetOnly: en
      ? "The meet-class bus runs only in the window above."
      : hant
        ? "轉堂校巴只在上面這個時段內開。"
        : "转堂校巴只在上面这个时段内开。",
    nearBoard(board: string, meters: number, stop: string) {
      const dist = distancePhrase(meters, locale);
      if (en) return `Within ${dist} of the boarding stop “${board}” there is also “${stop}”. Check the stop name before you board.`;
      if (hant) return `上車站「${board}」附近${dist}還有「${stop}」。請核對站名再上車。`;
      return `上车站「${board}」附近${dist}还有「${stop}」。请核对站名再上车。`;
    },
    nearAlight(alight: string, meters: number, stop: string) {
      const dist = distancePhrase(meters, locale);
      if (en) return `Within ${dist} of the alighting stop “${alight}” there is also “${stop}”. Check the stop name before you get off.`;
      if (hant) return `下車站「${alight}」附近${dist}還有「${stop}」。請核對站名再下車。`;
      return `下车站「${alight}」附近${dist}还有「${stop}」。请核对站名再下车。`;
    },
    pairClose(board: string, alight: string, meters: number) {
      const dist = distancePhrase(meters, locale);
      if (en) return `Boarding “${board}” and alighting “${alight}” are ${dist} apart. The two stops are close.`;
      if (hant) return `上車的「${board}」和下車的「${alight}」相距${dist}，兩站很近。`;
      return `上车的「${board}」和下车的「${alight}」相距${dist}，两站很近。`;
    },
    walkToBoard: en ? "Walk to the boarding stop" : hant ? "步行到上車站" : "步行到上车站",
    walkFromAlight: en ? "Walk from the alighting stop to the end" : hant ? "從下車站步行到終點" : "从下车站步行到终点",
    walkDirect: en ? "Choose a map to walk" : hant ? "選擇地圖步行" : "选择地图步行",
    alreadyHere: en ? "Already here" : hant ? "已經在這裡" : "已经在这里",
    walkHint: en
      ? "If a map cannot open the route, try another one."
      : hant
        ? "如果某個地圖打不開路線，可以嘗試切換導航。"
        : "目前有bug。如果某个地图打不开路线，可以尝试切换导航。",
    fineFallback: en ? "Timetable follows Hong Kong time." : hant ? "按香港時間對時刻表。" : "按香港时间对时刻表。",
    fineLive: en ? "Not live. Follow the Transport Office." : hant ? "非實時，以交通處為準。" : "非实时，以交通处为准。",
    fineWalk: en ? "Walking times are zone estimates." : hant ? "步行時間是分區估計。" : "步行时间是分区估计。",
    missStart: en
      ? "That place was not found. The start is unchanged."
      : hant
        ? "沒有找到這個地點，起點沒改。"
        : "没有找到这个地点，起点没改。",
    missEnd: en
      ? "That place was not found. The end is unchanged."
      : hant
        ? "沒有找到這個地點，終點沒改。"
        : "没有找到这个地点，终点没改。",
    emptyQuery: en ? "Enter a place first." : hant ? "請先輸入地點。" : "请先输入地点。",
    manyPlaces: en ? "Several places matched. Tap one to use it." : hant ? "找到多個地點，點一個用上。" : "找到多个地点，点一个用上。",
    noPosition: en
      ? "Location was not available. The start is unchanged."
      : hant
        ? "沒有拿到位置，起點沒改。"
        : "没有拿到位置，起点没改。",
    noPermission: en
      ? "Location permission was denied. The start is unchanged."
      : hant
        ? "沒有定位權限，起點沒改。"
        : "没有定位权限，起点没改。",
    locationTimeout: en ? "Location timed out. The start is unchanged." : hant ? "定位逾時，起點沒改。" : "定位超时，起点没改。",
    nearbyTitle: en ? "Three nearest bus stops" : hant ? "最近三個校巴站" : "最近三个校巴站",
    nearbyLine(meters: number, minutes: number) {
      const dist = distancePhrase(meters, locale);
      if (en) return `Straight line ${dist}, about ${minutes} minutes on foot`;
      if (hant) return `直線${dist}，步行約 ${minutes} 分鐘`;
      return `直线${dist}，步行约 ${minutes} 分钟`;
    },
    routeStops: en ? "Stops in order" : hant ? "沿線站點" : "沿线站点",
    routeFirst: en ? "First" : "首班",
    routeLast: en ? "Last" : "末班",
    routeMinutes(list: string) {
      if (en) return `Each hour at ${list}`;
      if (hant) return `每小時 ${list} 分`;
      return `每小时 ${list} 分`;
    },
    author: en ? "By Dvgfcvggh" : "作者 Dvgfcvggh",
    routeOptions: en ? "Routes" : hant ? "路線" : "路线",
    optionMinutes(total: number) {
      if (en) return `${total} min`;
      if (hant) return `${total} 分鐘`;
      return `${total} 分钟`;
    },
    installAdd: en ? "Add to Home Screen" : hant ? "加入主畫面" : "添加到主屏幕",
    installLater: en ? "Not now" : hant ? "以後再說" : "以后再说",
    iosGuide: en
      ? "On iPhone, open this page in Safari, tap Share, then Add to Home Screen."
      : hant
        ? "iPhone 請用 Safari 打開，點分享，再選「加入主畫面」。"
        : "iPhone 请用 Safari 打开，点分享，再选「添加到主屏幕」。",
    app(id: WalkApp["id"]) {
      return APP_LABEL[locale][id];
    },
    fine(picture: ServicePicture | null) {
      const short = picture ? pictureText(picture, locale).short : this.fineFallback;
      if (en) return `${short} ${this.fineLive} ${this.fineWalk}`;
      return `${short}${this.fineLive}${this.fineWalk}`;
    },
  };
}
