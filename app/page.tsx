'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface HealthLog {
  temperature: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  blood_sugar: number;
}

interface MedicationSchedule {
  id: string;
  medicine_name: string;
  time: string;
}

export default function Home() {
  const [todayHealth, setTodayHealth] = useState<HealthLog | null>(null);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<string>('');
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError('');
    try {
      const userId = '550e8400-e29b-41d4-a716-446655440001';
      const today = new Date().toISOString().split('T')[0];

      // 1. 오늘의 건강 수치 조회
      const { data: healthData } = await supabase
        .from('health_log')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (healthData) {
        setTodayHealth(healthData);
      }

      // 2. 복약 일정 조회
      const { data: medData } = await supabase
        .from('medication_schedule')
        .select('*')
        .eq('user_id', userId);

      setSchedules(medData || []);

      // 3. 날씨 정보 조회 (Open-Meteo)
      const weatherResponse = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=37.3858512&longitude=127.1093695&current=temperature_2m,precipitation,weather_code&timezone=Asia/Seoul'
      );
      const weatherData = await weatherResponse.json();
      const currentWeather = {
        temperature: weatherData.current.temperature_2m,
        precipitation: weatherData.current.precipitation,
        wind_speed: 5
      };
      setWeather(currentWeather);

      // 4. AI 운동 추천 호출
      if (healthData) {
        const recommendResponse = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            health: healthData,
            weather: currentWeather
          })
        });
        const recommendData = await recommendResponse.json();
        setRecommendation(recommendData.recommendation || '운동 추천 생성 중 오류가 발생했습니다');
      }
    } catch (err) {
      console.error('데이터 조회 실패:', err);
      setError('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          ⚠️ {error}
        </div>
      )}
    
    {/* 카드들 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 카드 1: 오늘의 건강 수치 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">📊 오늘의 건강 수치</h2>
          {todayHealth ? (
            <div className="space-y-2 text-sm">
              <p>🌡️ 체온: <span className="font-medium">{todayHealth.temperature}°C</span></p>
              <p>🩸 혈압: <span className="font-medium">{todayHealth.systolic_bp}/{todayHealth.diastolic_bp} mmHg</span></p>
              <p>💓 심박수: <span className="font-medium">{todayHealth.heart_rate} bpm</span></p>
              <p>🍬 혈당: <span className="font-medium">{todayHealth.blood_sugar} mg/dL</span></p>
            </div>
          ) : (
            <p className="text-gray-600">아직 기록이 없습니다</p>
          )}
          <Link href="/health" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            건강 수치 입력
          </Link>
        </div>

        {/* 카드 2: 복약 일정 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">💊 복약 일정</h2>
          {schedules.length === 0 ? (
            <p className="text-gray-600">복약 일정을 설정해주세요</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {schedules.map(schedule => (
                <li key={schedule.id} className="border-l-4 border-blue-500 pl-2 py-1">
                  <p className="font-medium">{schedule.medicine_name}</p>
                  <p className="text-gray-600">⏰ {schedule.time}</p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/medication" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            복약 관리
          </Link>
        </div>

        {/* 카드 3: 운동 추천 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">🏃 오늘의 운동 추천</h2>
          {loading ? (
            <p className="text-gray-600">로딩 중...</p>
          ) : recommendation ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
              {weather && (
                <p className="text-xs text-gray-500 mt-3">
                  📍 기온: {weather.temperature}°C | 강수확률: {weather.precipitation}%
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">건강 수치를 입력하면 AI가 맞춤형 운동을 추천합니다</p>
          )}
        </div>
      </div>
    </div>
  );
}