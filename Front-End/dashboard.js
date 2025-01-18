import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  ArrowRight,
  History,
  LineChart,
  TrendingUp,
  Award,
  Target,
  Zap
} from 'lucide-react';
import Sidebar from './Sidebar';

/*







All Rights Reserved
                       TALENT TRACK AI







*/
const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [practiceData, setPracticeData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  // Grafiklerin yalnızca ilk yüklemede animasyon göstermesi için.
  const [animateCharts, setAnimateCharts] = useState(true);

  /**
   * Veri çekme işlemi
   * Sadece bir kez (component mount olduğunda) çağrılır.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // İki farklı endpoint'e aynı anda istek
        const [practicesResponse, userResponse] = await Promise.all([
          fetch('http://localhost:3000/api/practices?limit=6', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!practicesResponse.ok || !userResponse.ok) {
          throw new Error('Veri getirme hatası');
        }

        // Practices endpoint'inden duyguAnaliz ve bilgiAnaliz gibi ek parametreler geliyor
        const { practices, duyguAnaliz, bilgiAnaliz } = await practicesResponse.json();
        const userData = await userResponse.json();
        setUserData(userData);

        // Practice verilerini detaylandırıp diziye aktarıyoruz
        const detailedPractices = practices.map(practice => {
          const stressScores = practice.questions.map(q => q.analysisResults?.stress_score || 0);
          const matchScores = practice.questions.map(q => q.analysisResults?.match_bonus || 0);
          const knowledgeScores = practice.questions.map(q => q.bilgiAnalizi?.puan || 0);

          const averageStress = Math.min(
            100,
            Math.round(stressScores.reduce((a, b) => a + b, 0) / (stressScores.length || 1))
          );
          const averageMatch = Math.min(
            100,
            Math.round(matchScores.reduce((a, b) => a + b, 0) / (matchScores.length || 1))
          );
          const averageKnowledge = Math.min(
            100,
            Math.round(knowledgeScores.reduce((a, b) => a + b, 0) / (knowledgeScores.length || 1))
          );

          const generalScore = Math.min(
            100,
            Math.round(
              (averageStress + averageMatch) * (duyguAnaliz / 100) +
              averageKnowledge * (bilgiAnaliz / 100)
            )
          );

          return {
            id: practice._id,
            name: practice.pratikAdi || `Pratik ${practice.questions.length}`,
            stressScore: averageStress,
            matchScore: averageMatch,
            knowledgeScore: averageKnowledge,
            generalScore,
            questionCount: practice.questions.length,
            date: new Date(practice.createdAt).toLocaleDateString('tr-TR'),
            timestamp: new Date(practice.createdAt).getTime()
          };
        });

        setPracticeData(detailedPractices.reverse());
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError('Veri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

/*
 




    All Rights Reserved
                        TALENT TRACK AI





   */
  const LargeChart = ({ data, animate }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Genel Performans Analizi</h2>
          <p className="text-sm text-gray-500">Tüm değerlendirmelerin birleşik sonucu</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg transition-colors duration-200 ${activeTab === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setActiveTab('stress')}
            className={`px-3 py-1 rounded-lg transition-colors duration-200 ${activeTab === 'stress'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Stres
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-3 py-1 rounded-lg transition-colors duration-200 ${activeTab === 'knowledge'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Bilgi
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGeneral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorKnowledge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              domain={[0, 100]}
              tickCount={6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value, name) => [
                `${value} puan`,
                name === 'generalScore'
                  ? 'Genel'
                  : name === 'stressScore'
                    ? 'Stres'
                    : 'Bilgi'
              ]}
              labelFormatter={(label) => `${label} Pratiği`}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) =>
                value === 'generalScore'
                  ? 'Genel Performans'
                  : value === 'stressScore'
                    ? 'Stres Kontrolü'
                    : 'Bilgi Seviyesi'
              }
            />
            {/* "all" sekmesi seçili ise "generalScore" da görünsün */}
            {(activeTab === 'all' || activeTab === 'general') && (
              <Area
                type="monotone"
                dataKey="generalScore"
                stroke="#4F46E5"
                strokeWidth={2}
                fill="url(#colorGeneral)"
                dot={{ r: 4, fill: "#4F46E5" }}
                activeDot={{ r: 6, fill: "#4F46E5" }}
                isAnimationActive={animate}
                animationDuration={1000}
                animationBegin={0}
              />
            )}
            {/* "all" sekmesi veya "stress" sekmesi seçili ise */}
            {(activeTab === 'all' || activeTab === 'stress') && (
              <Area
                type="monotone"
                dataKey="stressScore"
                stroke="#9333EA"
                strokeWidth={2}
                fill="url(#colorStress)"
                dot={{ r: 4, fill: "#9333EA" }}
                activeDot={{ r: 6, fill: "#9333EA" }}
                isAnimationActive={animate}
                animationDuration={1000}
                animationBegin={0}
              />
            )}
            {/* "all" sekmesi veya "knowledge" sekmesi seçili ise */}
            {(activeTab === 'all' || activeTab === 'knowledge') && (
              <Area
                type="monotone"
                dataKey="knowledgeScore"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#colorKnowledge)"
                dot={{ r: 4, fill: "#059669" }}
                activeDot={{ r: 6, fill: "#059669" }}
                isAnimationActive={animate}
                animationDuration={1000}
                animationBegin={0}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Son Pratik</p>
            <LineChart className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-lg font-semibold text-indigo-700 mt-1">
            {data[data.length - 1]?.generalScore || 0} puan
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Ortalama</p>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-lg font-semibold text-indigo-700 mt-1">
            {data.length
              ? Math.round(data.reduce((acc, curr) => acc + curr.generalScore, 0) / data.length)
              : 0}{' '}
            puan
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">İlerleme</p>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-lg font-semibold text-indigo-700 mt-1">
            {data.length > 1
              ? `${data[data.length - 1].generalScore -
                data[data.length - 2].generalScore > 0 ? '+' : ''
              }${data[data.length - 1].generalScore - data[data.length - 2].generalScore} puan`
              : '0 puan'}
          </p>
        </div>
      </div>
    </div>
  );

 /*
 




    All Rights Reserved
                        TALENT TRACK AI





   */
  
};

export default AnalyticsDashboard;
