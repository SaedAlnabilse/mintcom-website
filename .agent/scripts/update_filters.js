const fs = require('fs');
const path = 'src/pages/dashboard/ReportsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '{/* Unified Filter Dashboard */}';
const endMarker = '{/* Content */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found');
    console.log('Content length:', content.length);
    console.log('Index Unified:', startIndex);
    console.log('Index Content:', endIndex);
    process.exit(1);
}

// Keep startMarker, replace up to endMarker
const newContent = `
        {/* Modern Floating Glass Bar Filter */}
        <div className="sticky top-6 z-50 bg-white/80 dark:bg-[#0B1120]/90 backdrop-blur-xl rounded-full border border-gray-200/50 dark:border-white/10 shadow-xl shadow-gray-200/20 dark:shadow-black/20 p-1.5 flex flex-col lg:flex-row items-center gap-2 lg:gap-4 mx-auto max-w-fit transition-all duration-300 hover:bg-white/95 dark:hover:bg-[#0B1120]/95 hover:shadow-2xl">

          {/* Active Status & Quick Select */}
          <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-white/5 rounded-full p-1 pl-2">
            <div className="flex items-center gap-1.5 pr-2 border-r border-gray-200 dark:border-white/10 mr-1">
               <div className={\`w-2 h-2 rounded-full \${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-paymint-green shadow-[0_0_8px_rgba(16,185,129,0.5)]'}\`} />
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {isLoading ? 'SYNCING' : 'LIVE'}
               </span>
            </div>
            {['today', 'yesterday', 'this_week', 'this_month'].map((range) => (
              <button
                key={range}
                onClick={() => setQuickDate(range)}
                className={\`relative px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wide transition-all duration-300 \${selectedDateRange === range
                  ? 'text-white dark:text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }\`}
              >
                {selectedDateRange === range && (
                  <motion.div
                    layoutId="active-glass-pill"
                    className="absolute inset-0 bg-gray-900 dark:bg-white rounded-full -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {range.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="hidden lg:block w-px h-6 bg-gray-200 dark:bg-white/10" />

          {/* Date & Time Controls - Minimalist Text Inputs */}
          <div className="flex items-center gap-4 flex-1 justify-center lg:justify-start">
             <div className="flex items-center gap-2 group cursor-pointer">
                <Filter size={12} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
                <div className="flex items-center gap-1 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 px-2 py-0.5 rounded-lg transition-colors">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setSelectedDateRange('custom'); setSelectedShiftId(null); }}
                    className="bg-transparent p-0 text-[10px] font-bold text-gray-900 dark:text-white border-none focus:ring-0 w-[85px] dark:[color-scheme:dark] cursor-pointer outline-none"
                  />
                  <span className="text-gray-300 dark:text-gray-600 font-light">/</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setSelectedDateRange('custom'); setSelectedShiftId(null); }}
                    className="bg-transparent p-0 text-[10px] font-bold text-gray-900 dark:text-white border-none focus:ring-0 w-[85px] dark:[color-scheme:dark] text-right cursor-pointer outline-none"
                  />
                </div>
             </div>

             <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />

             <div className="flex items-center gap-2 group cursor-pointer">
                <Clock size={12} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
                <div className="flex items-center gap-1 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 px-2 py-0.5 rounded-lg transition-colors">
                  <input
                      type="time"
                      value={startTime}
                      onChange={(e) => { setStartTime(e.target.value); setSelectedShiftId(null); }}
                      className="bg-transparent p-0 text-[10px] font-bold text-gray-900 dark:text-white border-none focus:ring-0 w-[55px] dark:[color-scheme:dark] cursor-pointer outline-none"
                    />
                    <span className="text-gray-300 dark:text-gray-600 font-light">-</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => { setEndTime(e.target.value); setSelectedShiftId(null); }}
                      className="bg-transparent p-0 text-[10px] font-bold text-gray-900 dark:text-white border-none focus:ring-0 w-[55px] dark:[color-scheme:dark] text-right cursor-pointer outline-none"
                    />
                </div>
             </div>
          </div>

          {/* User & Shift Actions */}
          <div className="flex items-center gap-2">
             <div className="relative group">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 rounded-full px-3 py-1.5 cursor-pointer transition-all">
                   <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-black">
                      {selectedEmployeeId ? employees.find(e => e.value === selectedEmployeeId)?.label.charAt(0) : <User size={10} />}
                   </div>
                   <div className="flex flex-col relative">
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Staff</span>
                       <select 
                          className="bg-transparent border-none text-[10px] font-bold text-gray-900 dark:text-white p-0 h-auto focus:ring-0 cursor-pointer w-[60px] outline-none appearance-none"
                          value={selectedEmployeeId || ''}
                          onChange={(e) => {
                            setSelectedEmployeeId(e.target.value || null);
                            setSelectedShiftId(null);
                          }}
                        >
                          <option value="">All Staff</option>
                          {employees.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                   </div>
                </div>
             </div>

              <div className={\`relative group transition-opacity duration-300 \${!selectedEmployeeId ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}\`}>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 rounded-full px-3 py-1.5 cursor-pointer transition-all">
                   <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[10px] font-black">
                      <Clock size={10} />
                   </div>
                   <div className="flex flex-col relative">
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Shift</span>
                       <select 
                          className="bg-transparent border-none text-[10px] font-bold text-gray-900 dark:text-white p-0 h-auto focus:ring-0 cursor-pointer w-[70px] outline-none appearance-none"
                          value={selectedShiftId || ''}
                          onChange={(e) => setSelectedShiftId(e.target.value || null)}
                        >
                          <option value="">Specific Shift</option>
                          {employeeShifts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                   </div>
                </div>
             </div>
          </div>
        </div>
        <div className="h-6" /> {/* Spacer */}
      
`;

const updatedContent = content.substring(0, startIndex) + newContent + content.substring(endIndex);
fs.writeFileSync(path, updatedContent);
console.log('Successfully updated ReportsPage.tsx');
