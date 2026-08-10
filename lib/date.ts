const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 뷰어(브라우저)의 로컬 타임존과 무관하게 항상 한국 표준시(KST) 기준 시각을 반환
function nowKST(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

// "YYYY-MM-DD" (KST 기준 오늘 날짜)
export function getTodayKST(): string {
  return nowKST().toISOString().split('T')[0];
}

// "HH:MM" (KST 기준 현재 시각)
export function getNowHM_KST(): string {
  return nowKST().toISOString().slice(11, 16);
}

// "HH:MM:SS" (KST 기준 현재 시각)
export function getNowTimeKST(): string {
  return nowKST().toISOString().slice(11, 19);
}

// KST 기준 오늘로부터 daysAgo일 전 날짜, "YYYY-MM-DD"
export function getDateBeforeKST(daysAgo: number): string {
  const d = nowKST();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// KST 기준 오늘로부터 yearsAgo년 전 날짜, "YYYY-MM-DD"
export function getYearBeforeKST(yearsAgo: number): string {
  const d = nowKST();
  d.setUTCFullYear(d.getUTCFullYear() - yearsAgo);
  return d.toISOString().split('T')[0];
}
