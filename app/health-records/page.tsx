'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HealthData {
  date: string;
  temperature: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  blood_sugar: number;
}

interface Stats {
  avg: number;
  min: number;
  max: number;
}

export default function HealthRecords() {
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [range, setRange] = useState('7');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['systolic_bp', 'heart_rate', 'blood_sugar']);

  useEffect(() => {
    loadHealthRecords();
  }, [range]);

  const loadHealthRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const userId = '550e8400-e29b-41d4-a716-446655440001';
      const today = new Date();
      const startDate = new Date(today);

      if (range === '7') startDate.setDate(today.getDate() - 7);
      else if (range === '30') startDate.setDate(today.getDate() - 30);
      else if (range === '365') startDate.setFullYear(today.getFullYear() - 1);

      const { data: healthData } = await supabase
        .from('health_log')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setData(healthData || []);
    } catch (err) {
      console.error('건강 기록 조회 실패:', err);
      setError('건강 기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const calculateStats = (metric: string): Stats | null => {
    if (data.length === 0) return null;

    const values = data
      .map(d => d[metric as keyof HealthData] as number)
      .filter(v => v !== undefined);

    if (values.length === 0) return null;

    const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    const min = Math.round(Math.min(...values) * 10) / 10;
    const max = Math.round(Math.max(...values) * 10) / 10;

    return { avg, min, max };
  };

  const getMetricColor = (metric: string) => {
    const colors: { [key: string]: string } = {
      temperature: '#FF6B6B',
      systolic_bp: '#4ECDC4',
      diastolic_bp: '#45B7D1',
      heart_rate: '#FFA07A',
      blood_sugar: '#FFD93D'
    };
    return colors[metric] || '#999';
  };

  const getMetricLabel = (metric: string) => {
    const labels: { [key: string]: string } = {
      temperature: '체온 (°C)',
      systolic_bp: '수축기 혈압',
      diastolic_bp: '이완기 혈압',
      heart_rate: '심박수 (bpm)',
      blood_sugar: '혈당 (mg/dL)'
    };
    return labels[metric] || metric;
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">📈 건강 추세</h1>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* 네비게이션 */}
      <Link href="/" className="mb-4 inline-block bg-gray-500 text-white px-4 py-2 md:py-3 rounded hover:bg-gray-600">
        ← 대시보드
      </Link>

      {/* 기간 선택 */}
      <div className="bg-white p-4 md:p-6 rounded shadow mb-6">
        <h2 className="font-bold mb-3">기간 선택</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRange('7')}
            className={`px-4 py-2 md:py-3 rounded ${range === '7' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            7일
          </button>
          <button
            onClick={() => setRange('30')}
            className={`px-4 py-2 md:py-3 rounded ${range === '30' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            30일
          </button>
          <button
            onClick={() => setRange('365')}
            className={`px-4 py-2 md:py-3 rounded ${range === '365' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            1년
          </button>
        </div>
      </div>

      {/* 항목 선택 */}
      <div className="bg-white p-4 md:p-6 rounded shadow mb-6">
        <h2 className="font-bold mb-3">표시할 항목</h2>
        <div className="grid grid-cols-2 gap-2">
          {['temperature', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'blood_sugar'].map(metric => (
            <label key={metric} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric)}
                onChange={() => toggleMetric(metric)}
                className="w-4 h-4"
              />
              <span className="text-sm">{getMetricLabel(metric)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 그래프 */}
      <div className="bg-white p-4 md:p-6 rounded shadow mb-6">
        {loading ? (
          <p className="text-gray-600">로딩 중...</p>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.includes('temperature') && (
                <Line type="monotone" dataKey="temperature" stroke={getMetricColor('temperature')} name="체온" />
              )}
              {selectedMetrics.includes('systolic_bp') && (
                <Line type="monotone" dataKey="systolic_bp" stroke={getMetricColor('systolic_bp')} name="수축기 혈압" />
              )}
              {selectedMetrics.includes('diastolic_bp') && (
                <Line type="monotone" dataKey="diastolic_bp" stroke={getMetricColor('diastolic_bp')} name="이완기 혈압" />
              )}
              {selectedMetrics.includes('heart_rate') && (
                <Line type="monotone" dataKey="heart_rate" stroke={getMetricColor('heart_rate')} name="심박수" />
              )}
              {selectedMetrics.includes('blood_sugar') && (
                <Line type="monotone" dataKey="blood_sugar" stroke={getMetricColor('blood_sugar')} name="혈당" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-600">기록된 데이터가 없습니다</p>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedMetrics.map(metric => {
          const stats = calculateStats(metric);
          if (!stats) return null;

          return (
            <div key={metric} className="bg-white p-4 md:p-6 rounded shadow">
              <h3 className="font-bold mb-3" style={{ color: getMetricColor(metric) }}>
                {getMetricLabel(metric)}
              </h3>
              <div className="space-y-2 text-sm">
                <p>평균: <span className="font-medium">{stats.avg}</span></p>
                <p>최저: <span className="font-medium">{stats.min}</span></p>
                <p>최고: <span className="font-medium">{stats.max}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
