import { useAuth } from '../../context/AuthContext';
import { FiCalendar, FiClock, FiSun, FiMoon, FiSunrise } from 'react-icons/fi';

const shiftInfo = {
  Morning: { time: '6:00 AM – 2:00 PM', icon: FiSunrise, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  Evening: { time: '2:00 PM – 10:00 PM', icon: FiSun, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  Night:   { time: '10:00 PM – 6:00 AM', icon: FiMoon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKS = ['This Week', 'Next Week', 'Week 3', 'Week 4'];

export default function Schedule() {
  const { user } = useAuth();
  const shift = user?.shift || 'Morning';
  const info = shiftInfo[shift];

  // Generate week schedule (demo: Mon-Sat work, Sun off)
  const weekDays = DAYS.map((day, i) => ({
    day, date: new Date(Date.now() + (i - new Date().getDay() + 1) * 86400000),
    isOff: day === 'Sun', shift: day === 'Sun' ? null : shift
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Shift Schedule</h1>
        <p className="text-slate-400 mt-1">Your weekly work schedule at Stone India</p>
      </div>

      {/* Current Shift Info */}
      <div className="card border-yellow-500/20">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${info.bg} flex items-center justify-center`}>
            <info.icon className={`w-7 h-7 ${info.color}`} />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">{shift} Shift</h2>
            <p className={`text-lg font-semibold ${info.color}`}>{info.time}</p>
            <p className="text-slate-500 text-sm">{user?.department} • {user?.designation}</p>
          </div>
          <div className="ml-auto text-right hidden md:block">
            <div className="text-slate-400 text-sm">Employee ID</div>
            <div className="text-white font-mono font-bold">{user?.employeeId}</div>
          </div>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <FiCalendar className="text-yellow-400" /> This Week
          </h2>
          <span className="text-slate-400 text-sm">
            {weekDays[0].date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d, i) => {
            const isToday = d.date.toDateString() === new Date().toDateString();
            return (
              <div key={d.day} className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                isToday ? 'bg-yellow-500/20 border-yellow-500/50' :
                d.isOff ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-800/50 border-slate-700/50'
              }`}>
                <span className={`text-xs font-semibold mb-1 ${isToday ? 'text-yellow-400' : 'text-slate-500'}`}>{d.day}</span>
                <span className={`text-sm font-bold mb-2 ${isToday ? 'text-white' : 'text-slate-300'}`}>
                  {d.date.getDate()}
                </span>
                {d.isOff ? (
                  <span className="text-[10px] text-slate-600 font-medium">OFF</span>
                ) : (
                  <div className={`w-6 h-6 rounded-full ${info.bg} flex items-center justify-center`}>
                    <info.icon className={`w-3 h-3 ${info.color}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400" />{shift} Shift</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-600" />Day Off</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500/50 border-2 border-yellow-400" />Today</div>
        </div>
      </div>

      {/* Monthly overview placeholder */}
      <div className="card">
        <h2 className="text-white font-semibold mb-4">Monthly Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Working Days', value: '26', color: 'text-brand-400' },
            { label: 'Days Off', value: '5', color: 'text-slate-400' },
            { label: 'Shift Type', value: shift, color: 'text-yellow-400' },
            { label: 'Department', value: user?.department || 'QC', color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 rounded-xl p-4 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
