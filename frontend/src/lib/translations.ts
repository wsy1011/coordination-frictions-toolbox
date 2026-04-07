"use client";

import type { Locale } from "@/lib/locale";

const corridorMap: Record<string, string> = {
  苏南: "Southern Jiangsu group",
  苏中: "Central Jiangsu group",
  苏北: "Northern Jiangsu group",
  沿江口门: "gateway group",
  京杭运河: "Grand Canal group",
  其他: "Other group",
};

const routeMap: Record<string, string> = {
  丹金溧漕河: "Danjin-Licao Canal",
  京杭运河苏北段: "Grand Canal, Northern Jiangsu section",
  京杭运河苏南段: "Grand Canal, Southern Jiangsu section",
  "京杭运河西航线/徐洪河联络": "Grand Canal western route / Xuhong River link",
  划子河: "Huazi River",
  刘大线: "Liuda Line",
  古泊河: "Gubo River",
  周山河: "Zhoushan River",
  "小中河（按数据集口径）": "Xiaozhong River (dataset label)",
  建口线: "Jiankou Line",
  徐洪河: "Xuhong River",
  德胜河: "Desheng River",
  成子河: "Chengzi River",
  新沂河: "Xinyi River",
  杨林塘: "Yanglintang",
  柳巷河: "Liuxiang River",
  汇吕线: "Huilv Line",
  淮河: "Huai River",
  滨海港区疏港航道: "Binhai port access channel",
  申张线: "Shenzhang Line",
  盐宝线: "Yanbao Line",
  盐河: "Yan River",
  盐邵线: "Yanshao Line",
  秦淮新河: "New Qinhuai River",
  秦淮河: "Qinhuai River",
  芒稻河: "Mangdao River",
  芜申线: "Wushen Line",
  连申线: "Lianshen Line",
  通扬线: "Tongyang Line",
  锡溧漕河: "Xili-Cao Canal",
  锡澄运河: "Xicheng Canal",
  高东线: "Gaodong Line",
  "高邮湖/高邮段": "Gaoyou Lake / Gaoyou section",
};

const lockMap: Record<string, string> = {
  秦淮河: "Qinhuai River",
  下坝: "Xiaba",
  杨家湾: "Yangjiawan",
  玉带: "Yudai",
  洪蓝: "Honglan",
  谏壁: "Jianbi",
  魏村: "Weicun",
  丹金: "Danjin",
  前黄: "Qianhuang",
  江阴: "Jiangyin",
  张家港: "Zhangjiagang",
  虞山: "Yushan",
  杨林: "Yanglin",
  南通: "Nantong",
  九圩港: "Jiuweigang",
  海安: "Haian",
  吕四: "Lvsi",
  焦港: "Jiaogang",
  宝应: "Baoying",
  运西: "Yunxi",
  运东: "Yundong",
  芒稻: "Mangdao",
  樊川: "Fanchuan",
  盐邵: "Yanshao",
  口岸: "Kou'an",
  周山河: "Zhoushan River",
  阜宁: "Funing",
  刘庄: "Liuzhuang",
  滨海: "Binhai",
  杨庄: "Yangzhuang",
  朱码: "Zhuma",
  高良涧: "Gaoliangjian",
  大柳巷: "Daliuxiang",
  古泊河: "Gubo River",
  成子河: "Chengzi River",
  沙集: "Shaji",
  刘集: "Liuji",
  蔺家坝: "Linjiaba",
  盐灌: "Yanguan",
  新沂河: "Xinyi River",
  云善: "Yunshan",
  善南: "Shannan",
  施桥: "Shiqiao",
  邵伯: "Shaobo",
  淮安: "Huai'an",
  淮阴: "Huaiyin",
  泗阳: "Siyang",
  刘老涧: "Liulaojian",
  宿迁: "Suqian",
  皂河: "Zaohe",
  刘山: "Liushan",
  解台: "Jietai",
};

function translate(value: string, locale: Locale, dictionary: Record<string, string>) {
  if (locale === "zh") {
    return value;
  }
  return dictionary[value] ?? value;
}

export function displayCorridor(value: string, locale: Locale) {
  return translate(value, locale, corridorMap);
}

export function displayRoute(value: string, locale: Locale) {
  return translate(value, locale, routeMap);
}

export function displayLockName(value: string, locale: Locale) {
  return translate(value, locale, lockMap);
}
