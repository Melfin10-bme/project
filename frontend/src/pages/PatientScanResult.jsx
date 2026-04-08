import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

function PatientScanResult() {
  const { patientId, testId } = useParams();
  const [searchParams] = useSearchParams();
  const [patient, setPatient] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAppointment, setShowAppointment] = useState(false);
  const [appointmentSent, setAppointmentSent] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showTreatmentGuide, setShowTreatmentGuide] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [emergencyInfo, setEmergencyInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [treatmentGuide, setTreatmentGuide] = useState(null);
  const [sampleGuide, setSampleGuide] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [showFamily, setShowFamily] = useState(false);
  const [familyData, setFamilyData] = useState([]);
  const [showAgeAnalysis, setShowAgeAnalysis] = useState(false);
  const [showRetest, setShowRetest] = useState(false);
  const [retestDate, setRetestDate] = useState('');
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    notes: ''
  });

  const token = searchParams.get('token');

  // Translations
  const translations = {
    en: {
      patientId: 'Patient ID',
      name: 'Name',
      age: 'Age',
      gender: 'Gender',
      diseaseStatus: 'Disease Status',
      infected: 'INFECTED',
      notInfected: 'NOT INFECTED',
      latestTest: 'Latest test',
      noTests: 'No tests yet',
      testsTaken: 'Tests Taken',
      bookAppointment: 'Book Follow-up Appointment',
      confirm: 'Confirm Booking',
      share: 'Share',
      whatsapp: 'WhatsApp',
      downloadPdf: 'Download PDF',
      treatmentGuide: 'Treatment Guide',
      emergency: 'Emergency',
      sampleGuide: 'Sample Guide',
      statistics: 'Statistics',
      feedback: 'Feedback',
      setPin: 'Set PIN',
      verifyPin: 'Enter PIN',
      medicationReminders: 'Medication Reminders',
      positiveRate: 'Positive Rate',
      totalTests: 'Total Tests',
      timeline: 'Test Timeline',
      notes: 'My Notes',
      addNote: 'Add Note',
      voiceResult: 'Voice Result',
      playVoice: 'Play Result',
      family: 'Family',
      ageAnalysis: 'Age Analysis',
      retestReminder: 'Re-test Reminder',
      setReminder: 'Set Reminder',
      positive: 'Positive',
      ageGroup: 'Age Group'
    },
    si: {
      patientId: 'රෝගියාගේ ID',
      name: 'නම',
      age: 'වයස',
      gender: 'ස්ත්‍රී/පිරිමි භාවය',
      diseaseStatus: 'රෝග තත්ත්වය',
      infected: 'ආසාත්මිකයි',
      notInfected: 'ආසාත්මික නැත',
      latestTest: 'අවසන් පරීක්ෂණය',
      noTests: 'තවම පරීක්ෂණ නැත',
      testsTaken: 'පැවති පරීක්ෂණ',
      bookAppointment: 'හමුවීමක් වෙන් කරන්න',
      confirm: 'තහවුරු කරන්න',
      share: 'බෙදාගන්න',
      whatsapp: 'WhatsApp',
      downloadPdf: 'PDF බාගන්න',
      treatmentGuide: 'ප්‍රතිකාර මාර්ගය',
      emergency: 'හදිසි අවස්ථාව',
      sampleGuide: 'සාම්පල් රැගැනීමේ උපදෙස්',
      statistics: 'තුරුකෑම් දත්ත',
      feedback: 'ප්‍රතික්ෂේපය',
      setPin: 'PIN පිරිම්දන්න',
      verifyPin: 'PIN ඇතුළත් කරන්න',
      medicationReminders: 'ඖෂධ මතකයිරෝපන',
      positiveRate: "ආසාත්මික අනුපාතය",
      totalTests: 'පරීක්ෂණ ගණන',
      timeline: 'පරීක්ෂණ කාලසටහන',
      notes: 'මාගේ සටහන්',
      addNote: 'සටහනක් එකතු කරන්න',
      voiceResult: 'නාන්න ප්‍රතිඵලය',
      playVoice: 'ප්‍රතිඵලය අසන්න',
      family: 'පවුල',
      ageAnalysis: 'වයස් කාණ්ඩය විශ්ලක්ෂණය',
      retestReminder: 'නැවත පරීක්ෂණ මතකයිරෝපන',
      setReminder: 'මතකයිරෝපනය සකසන්න',
      positive: 'ආසාත්මික',
      ageGroup: 'වයස් කාණ්ඩය'
    },
    ta: {
      patientId: 'ரோக்டர் அடையாளம்',
      name: 'பெயர்',
      age: 'வயது',
      gender: 'பாலினம்',
      diseaseStatus: 'நோய் நிலை',
      infected: 'தொற்று உள்ளது',
      notInfected: 'தொற்று இல்லை',
      latestTest: 'சமீபத்திய சோதனை',
      noTests: 'சோதனைகள் இல்லை',
      testsTaken: 'சோதனைகள்',
      bookAppointment: 'சந்திப்பு முடக்க',
      confirm: 'உறுதிப்படுத்து',
      share: 'பகிர்',
      whatsapp: 'WhatsApp',
      downloadPdf: 'PDF பதிவிறக்கு',
      treatmentGuide: 'சிகிச்சை வழிகாட்டி',
      emergency: 'அவசரம்',
      sampleGuide: 'மாதிரி வழிகாட்டி',
      statistics: 'புள்ளிவிவரங்கள்',
      feedback: 'கருத்து',
      setPin: 'PIN அமைக்க',
      verifyPin: 'PIN உள்ளிடு',
      medicationReminders: 'மருந்து நினைவூட்டல்',
      positiveRate: 'நேர்மறை வீதம்',
      totalTests: 'மொத்த சோதனைகள்',
      timeline: 'சோதனை காலவரிசை',
      notes: 'என் குறிப்புகள்',
      addNote: 'குறிப்பு சேர்க்க',
      voiceResult: 'குரல் முடிவு',
      playVoice: 'முடிவைக் கேள்',
      family: 'குடும்பம்',
      ageAnalysis: 'வயது பகுப்பாய்வு',
      retestReminder: 'மீண்டும் சோதனை நினைவூட்டல்',
      setReminder: 'நினைவூட்டல் அமைக்க',
      positive: 'positive',
      ageGroup: 'வயது குழு'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/scan/patient/${patientId}${token ? `?token=${token}` : ''}`
        );
        if (!response.ok) {
          throw new Error('Unable to load patient data');
        }
        const data = await response.json();
        setPatient(data.patient);
        setTests(data.tests || []);
        setAppointmentForm(prev => ({
          ...prev,
          patientName: data.patient.name || '',
          phone: data.patient.phone || '',
          email: data.patient.email || ''
        }));

        // Check if PIN is set
        if (data.patient.privacyPin) {
          setPinMode(true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchData();
    }
  }, [patientId, token]);

  useEffect(() => {
    // Fetch additional data
    const fetchExtra = async () => {
      try {
        const [emgRes, statsRes, guideRes, sampleRes] = await Promise.all([
          fetch('/api/scan/emergency'),
          fetch('/api/scan/statistics'),
          fetch('/api/scan/treatment-guide'),
          fetch('/api/scan/guide')
        ]);
        if (emgRes.ok) setEmergencyInfo(await emgRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (guideRes.ok) setTreatmentGuide(await guideRes.json());
        if (sampleRes.ok) setSampleGuide(await sampleRes.json());
      } catch (err) {}
    };
    fetchExtra();
  }, []);

  const handlePinVerify = async () => {
    try {
      const res = await fetch('/api/scan/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, pin })
      });
      if (res.ok) {
        setPinError(false);
        setPinMode(false);
      } else {
        setPinError(true);
      }
    } catch {
      setPinError(true);
    }
  };

  const handleShare = async () => {
    const latestTest = tests.length > 0 ? tests[0] : null;
    const isPositive = latestTest?.prediction === 'Positive';
    const resultText = `H. pylori Test Result\nPatient: ${patient?.name}\nID: ${patient?.id}\nResult: ${isPositive ? 'INFECTED' : 'NOT INFECTED'}\nConfidence: ${latestTest?.confidence}%`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'H. pylori Test Result', text: resultText });
        return;
      } catch (err) {}
    }

    try {
      await navigator.clipboard.writeText(resultText);
      alert('Result copied to clipboard!');
    } catch (err) {
      alert(resultText);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`/api/scan/patient/${patientId}/report${token ? `?token=${token}` : ''}`);
      const data = await res.json();
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${data.content}`;
      link.download = data.filename;
      link.click();
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/scan/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...appointmentForm, patientId })
      });
      if (response.ok) {
        setAppointmentSent(true);
        setTimeout(() => {
          setShowAppointment(false);
          setAppointmentSent(false);
        }, 2000);
      }
    } catch (err) {
      alert('Failed to book appointment');
    }
  };

  const handleFeedback = async (rating) => {
    try {
      await fetch('/api/scan/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, rating, comment: '' })
      });
      setFeedbackSent(true);
      setTimeout(() => setShowFeedback(false), 2000);
    } catch (err) {}
  };

  const handleSetPin = async () => {
    try {
      await fetch('/api/scan/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, pin })
      });
      alert('PIN set successfully!');
      setPinMode(false);
    } catch (err) {
      alert('Failed to set PIN');
    }
  };

  const bgClass = darkMode ? 'bg-slate-900' : 'bg-gray-100';
  const cardClass = darkMode ? 'bg-slate-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textMuted = darkMode ? 'text-slate-400' : 'text-gray-500';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className={textClass}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className={`${cardClass} p-6 rounded-xl text-center`}>
          <div className="text-red-500 text-4xl mb-3">!</div>
          <h2 className={`text-lg font-bold ${textClass} mb-2`}>Error</h2>
          <p className={textMuted}>{error}</p>
        </div>
      </div>
    );
  }

  if (pinMode && !patient?.privacyPin) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className={`${cardClass} p-6 rounded-xl text-center w-full max-w-sm`}>
          <h2 className={`text-lg font-bold ${textClass} mb-4`}>Set PIN</h2>
          <p className={`${textMuted} mb-4`}>Create a PIN to protect your results</p>
          <input
            type="password"
            maxLength={4}
            placeholder="Enter 4-digit PIN"
            className={`w-full p-3 rounded-lg mb-4 ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button
            onClick={handleSetPin}
            className="w-full bg-teal-600 text-white py-3 rounded-lg"
          >
            Set PIN
          </button>
        </div>
      </div>
    );
  }

  if (pinMode && patient?.privacyPin) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className={`${cardClass} p-6 rounded-xl text-center w-full max-w-sm`}>
          <h2 className={`text-lg font-bold ${textClass} mb-4`}>Enter PIN</h2>
          <input
            type="password"
            maxLength={4}
            placeholder="Enter PIN"
            className={`w-full p-3 rounded-lg mb-4 ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          {pinError && <p className="text-red-500 mb-4">Invalid PIN</p>}
          <button
            onClick={handlePinVerify}
            className="w-full bg-teal-600 text-white py-3 rounded-lg"
          >
            Verify
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className={textClass}>No patient found</div>
      </div>
    );
  }

  const latestTest = tests.length > 0 ? tests[0] : null;
  const isPositive = latestTest?.prediction === 'Positive';
  const testTypes = [...new Set(tests.map(t => t.testType || 'Nanopaper'))];

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Header */}
      <header className="bg-teal-700 p-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold text-white">H. pylori Detection</h1>
          <div className="flex gap-2">
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)} className="text-white text-sm bg-teal-800 px-2 py-1 rounded">
                🌐 {language === 'en' ? 'English' : language === 'si' ? 'සිං' : 'தமிழ்'}
              </button>
              {showLangMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-slate-800 rounded-lg shadow-lg z-50">
                  <button onClick={() => { setLanguage('en'); setShowLangMenu(false); }} className="block w-full text-left px-3 py-2 text-white text-sm hover:bg-slate-700">English</button>
                  <button onClick={() => { setLanguage('si'); setShowLangMenu(false); }} className="block w-full text-left px-3 py-2 text-white text-sm hover:bg-slate-700">සිං</button>
                  <button onClick={() => { setLanguage('ta'); setShowLangMenu(false); }} className="block w-full text-left px-3 py-2 text-white text-sm hover:bg-slate-700">தமிழ்</button>
                </div>
              )}
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="text-white bg-teal-800 p-1 rounded">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* Patient Card */}
        <div className={`${cardClass} rounded-xl p-5 mb-4`}>
          <div className="text-center">
            <p className={`${textMuted} text-sm mb-1`}>{t.patientId}</p>
            <p className={`text-2xl font-mono font-bold ${textClass} mb-3`}>{patient.id}</p>
            <p className={`text-xl font-semibold ${textClass}`}>{patient.name}</p>
            <p className={`${textMuted} text-sm`}>{patient.age} yrs • {patient.gender}</p>
          </div>
        </div>

        {/* Share & Download */}
        <div className="flex gap-2 mb-4">
          <button onClick={handleShare} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-medium">
            {t.share}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`H. pylori Test - ${patient?.name}: ${isPositive ? 'INFECTED' : 'NOT INFECTED'}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center"
          >
            WhatsApp
          </a>
          <button onClick={handleDownloadPdf} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium">
            {t.downloadPdf}
          </button>
        </div>

        {/* Status */}
        {!testId && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <div className="text-center">
              <p className={`${textMuted} text-sm mb-2`}>{t.diseaseStatus}</p>
              {latestTest ? (
                <div>
                  <div
                    className="inline-block px-4 py-2 rounded-lg text-lg font-bold"
                    style={{ backgroundColor: isPositive ? '#DC2626' : '#059669', color: 'white' }}
                  >
                    {isPositive ? t.infected : t.notInfected}
                  </div>
                  <p className={`${textMuted} text-sm mt-2`}>{t.latestTest}: {latestTest.analyzedAt}</p>
                </div>
              ) : (
                <p className={textMuted}>{t.noTests}</p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setShowTreatmentGuide(!showTreatmentGuide)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            💊 {t.treatmentGuide}
          </button>
          <button onClick={() => setShowEmergency(!showEmergency)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            🚨 {t.emergency}
          </button>
          <button onClick={() => setShowGuide(!showGuide)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            📋 {t.sampleGuide}
          </button>
          <button onClick={() => setShowStats(!showStats)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            📊 {t.statistics}
          </button>
          <button onClick={() => { setShowTimeline(!showTimeline); fetch(`/api/scan/patient/${patientId}/timeline${token ? '?token='+token : ''}`).then(r=>r.json()).then(d=>setTimeline(d.timeline||[])); }} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            📅 {t.timeline}
          </button>
          <button onClick={() => { setShowNotes(!showNotes); fetch(`/api/scan/patient/${patientId}/notes${token ? '?token='+token : ''}`).then(r=>r.json()).then(d=>setNotes(d.notes||[])); }} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            📝 {t.notes}
          </button>
          <button onClick={() => { setShowVoice(!showVoice); fetch(`/api/scan/patient/${patientId}/voice${token ? '?token='+token : ''}`).then(r=>r.json()).then(d=>setVoiceText(d.text||'')); }} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            🔊 {t.voiceResult}
          </button>
          <button onClick={() => setShowFamily(!showFamily)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            👨‍👩‍👧 {t.family}
          </button>
          <button onClick={() => setShowAgeAnalysis(!showAgeAnalysis)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            📈 {t.ageAnalysis}
          </button>
          <button onClick={() => setShowRetest(!showRetest)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            ⏰ {t.retestReminder}
          </button>
          <button onClick={() => setPinMode(true)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            🔒 {t.setPin}
          </button>
          <button onClick={() => setShowFeedback(!showFeedback)} className={`${cardClass} py-3 rounded-xl ${textClass} text-sm`}>
            ⭐ {t.feedback}
          </button>
        </div>

        {/* Treatment Guide */}
        {showTreatmentGuide && treatmentGuide && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{treatmentGuide.title}</h3>
            {isPositive ? (
              <div className="space-y-2">
                {treatmentGuide.if_positive.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className={textMuted}>{item.day}</span>
                    <span className={textClass}>{item.medication}</span>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="list-disc list-inside text-sm space-y-1">
                {treatmentGuide.if_negative.map((item, i) => (
                  <li key={i} className={textClass}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Emergency Info */}
        {showEmergency && emergencyInfo && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.emergency}</h3>
            <p className={`text-sm ${textMuted}`}>Hotline: <span className="text-red-500 font-bold">{emergencyInfo.hotline}</span></p>
            <p className={`text-sm ${textMuted}`}>Contact: {emergencyInfo.emergency_contact}</p>
            <p className={`text-sm mt-2 ${textClass}`}>{isPositive ? emergencyInfo.treatment_info.positive : emergencyInfo.treatment_info.negative}</p>
          </div>
        )}

        {/* Sample Guide */}
        {showGuide && sampleGuide && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{sampleGuide.title}</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {sampleGuide.steps.map((step, i) => (
                <li key={i} className={textClass}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Statistics */}
        {showStats && stats && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.statistics}</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className={`text-2xl font-bold ${textClass}`}>{stats.total_tests}</p>
                <p className={`text-xs ${textMuted}`}>{t.totalTests}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.positive}</p>
                <p className={`text-xs ${textMuted}`}>Positive</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.positive_rate}%</p>
                <p className={`text-xs ${textMuted}`}>{t.positiveRate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Age Analysis */}
        {showAgeAnalysis && stats && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.ageAnalysis}</h3>
            <div className="space-y-2">
              {Object.keys(stats.age_groups || {}).map(age => (
                <div key={age} className="flex justify-between items-center">
                  <span className={textMuted}>{age}</span>
                  <div className="flex-1 mx-2 bg-slate-700 rounded h-2 ml-2 mr-2">
                    <div className="bg-teal-500 h-2 rounded" style={{width: `${(stats.age_positive?.[age]||0)/(stats.age_groups?.[age]||1)*100}%`}}></div>
                  </div>
                  <span className={textClass}>{stats.age_positive?.[age]||0}/{stats.age_groups?.[age]||0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {showTimeline && timeline.length > 0 && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.timeline}</h3>
            <div className="space-y-3 border-l-2 border-teal-500 pl-4">
              {timeline.map((item, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-6 w-3 h-3 rounded-full ${item.result === 'Positive' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <p className={textClass}>{item.date}</p>
                  <p className={`text-sm ${textMuted}`}>{item.type} - {item.result} ({item.confidence}%)</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {showNotes && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.notes}</h3>
            <div className="space-y-2 mb-3">
              {notes.map((note, i) => (
                <div key={i} className={`${darkMode ? 'bg-slate-700' : 'bg-gray-200'} p-2 rounded`}>
                  <p className={textClass}>{note.note}</p>
                  <p className={`text-xs ${textMuted}`}>{note.createdAt}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add note..." value={newNote} onChange={(e)=>setNewNote(e.target.value)} className={`flex-1 p-2 rounded ${darkMode?'bg-slate-700 text-white':'bg-gray-200'}`} />
              <button onClick={async()=>{await fetch('/api/scan/patient-note',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patientId,note:newNote})});setNewNote('');fetch(`/api/scan/patient/${patientId}/notes${token?'?token='+token:''}`).then(r=>r.json()).then(d=>setNotes(d.notes||[]));}} className="bg-teal-600 text-white px-3 rounded">+</button>
            </div>
          </div>
        )}

        {/* Voice Result */}
        {showVoice && voiceText && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.voiceResult}</h3>
            <p className={textClass}>{voiceText}</p>
            <button onClick={() => window.speechSynthesis.speak(new SpeechSynthesisUtterance(voiceText))} className={`mt-3 w-full bg-teal-600 text-white py-2 rounded ${textClass}`}>
              🔊 {t.playVoice}
            </button>
          </div>
        )}

        {/* Family */}
        {showFamily && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.family}</h3>
            <p className={`${textMuted} text-sm`}>Link family members to view their results</p>
          </div>
        )}

        {/* Re-test Reminder */}
        {showRetest && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.retestReminder}</h3>
            <input type="date" value={retestDate} onChange={(e)=>setRetestDate(e.target.value)} className={`w-full p-2 rounded mb-2 ${darkMode?'bg-slate-700 text-white':'bg-gray-200'}`} />
            <button onClick={async()=>{await fetch('/api/scan/retest-reminder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patientId,reminderDate:retestDate})});alert('Reminder set!');setShowRetest(false);}} className="w-full bg-teal-600 text-white py-2 rounded">{t.setReminder}</button>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            {feedbackSent ? (
              <p className="text-green-500 text-center">Thank you for your feedback!</p>
            ) : (
              <>
                <h3 className={`font-semibold ${textClass} mb-3`}>Rate your experience</h3>
                <div className="flex justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => handleFeedback(star)} className="text-3xl text-yellow-500">★</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Test Details */}
        {testId && latestTest && (
          <div
            className="rounded-xl p-5 mb-4"
            style={{ backgroundColor: isPositive ? '#450a0a' : '#052e16', border: `2px solid ${isPositive ? '#DC2626' : '#059669'}` }}
          >
            <div className="text-center mb-4">
              <div className="inline-block px-4 py-2 rounded-lg text-lg font-bold" style={{ backgroundColor: isPositive ? '#DC2626' : '#059669', color: 'white' }}>
                {isPositive ? t.infected : t.notInfected}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className={textMuted}>Test Type</span><span className={textClass}>{latestTest.testType || 'Nanopaper'}</span></div>
              <div className="flex justify-between"><span className={textMuted}>Confidence</span><span className={textClass}>{latestTest.confidence}%</span></div>
              <div className="flex justify-between"><span className={textMuted}>Date</span><span className={textClass}>{latestTest.analyzedAt}</span></div>
            </div>
          </div>
        )}

        {/* Test History */}
        {!testId && tests.length > 0 && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            <h3 className={`font-semibold ${textClass} mb-3`}>{t.testsTaken} ({tests.length})</h3>
            <div className="space-y-2">
              {tests.slice(0, 5).map(test => (
                <div key={test.id} className={`${darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-lg p-3`}>
                  <div className="flex justify-between">
                    <span className={textClass}>{test.prediction === 'Positive' ? 'Infected' : 'Not Infected'}</span>
                    <span className={textMuted}>{test.confidence}%</span>
                  </div>
                  <p className={`text-xs ${textMuted}`}>{test.analyzedAt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appointment */}
        <button onClick={() => setShowAppointment(!showAppointment)} className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'} ${textClass} py-3 rounded-xl mb-4`}>
          📅 {t.bookAppointment}
        </button>

        {showAppointment && (
          <div className={`${cardClass} rounded-xl p-5 mb-4`}>
            {appointmentSent ? (
              <p className="text-green-500 text-center">Appointment requested!</p>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-3">
                <input type="date" required className={`w-full p-3 rounded-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`} value={appointmentForm.date} onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})} />
                <input type="time" required className={`w-full p-3 rounded-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`} value={appointmentForm.time} onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})} />
                <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg">{t.confirm}</button>
              </form>
            )}
          </div>
        )}

        <div className="text-center mt-6">
          <p className={`${textMuted} text-xs`}>H. pylori Detection System</p>
        </div>
      </main>
    </div>
  );
}

export default PatientScanResult;