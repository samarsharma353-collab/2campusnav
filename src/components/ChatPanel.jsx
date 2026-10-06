import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Clock, Navigation, ArrowRight, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { parseIntent } from '../lib/nlpParser';
import { searchLocations, allLocations } from '../lib/fuzzySearch';
import { dijkstra } from '../lib/dijkstra';
import { generateDirections, getNearbyLocations } from '../lib/directions';
import graph from '../data/graph.json';

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center px-4 py-3 bg-blue-50 dark:bg-gray-700/50 rounded-2xl rounded-tl-sm w-fit">
      {[0, 150, 300].map(d => (
        <div key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
  );
}

// ─── FROM → TO route banner ───────────────────────────────────────────────────
function RouteBanner({ from, to, distance, walkingMinutes }) {
  return (
    <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-3 shadow-md mt-2">
      <div className="flex items-center gap-2 text-white">
        {/* FROM */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">You are at</div>
          <div className="font-bold text-sm leading-tight truncate flex items-center gap-1">
            <span className="text-lg">📍</span>
            {from?.name || 'Main Gate'}
          </div>
          {from?.building && (
            <div className="text-[10px] opacity-75 truncate">{from.building}</div>
          )}
        </div>

        {/* Arrow + distance */}
        <div className="flex flex-col items-center flex-shrink-0 px-1">
          <ArrowRight className="w-5 h-5 text-white opacity-90" />
          <div className="text-[10px] text-white/80 font-medium whitespace-nowrap">
            {distance ? `${distance}m` : ''}
          </div>
        </div>

        {/* TO */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Destination</div>
          <div className="font-bold text-sm leading-tight truncate flex items-center gap-1">
            <span className="text-lg">🎯</span>
            {to?.name}
          </div>
          {to?.building && (
            <div className="text-[10px] opacity-75 truncate">{to.building}, Floor {to.floor}</div>
          )}
        </div>
      </div>

      {/* Walking time bar */}
      {walkingMinutes > 0 && (
        <div className="mt-2.5 flex items-center justify-between bg-white/20 rounded-xl px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-white text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            ~{walkingMinutes} min walk
          </div>
          <div className="flex items-center gap-1.5 text-white text-xs">
            <MapPin className="w-3.5 h-3.5" />
            {distance}m total
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step type styles ─────────────────────────────────────────────────────────
const STEP_STYLE = {
  start:  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500', text: 'text-emerald-800 dark:text-emerald-200' },
  walk:   { bg: 'bg-gray-50 dark:bg-gray-800/60',        border: 'border-gray-200 dark:border-gray-700',       dot: 'bg-blue-400',   text: 'text-gray-700 dark:text-gray-300' },
  turn:   { bg: 'bg-blue-50 dark:bg-blue-900/30',        border: 'border-blue-200 dark:border-blue-700',       dot: 'bg-blue-600',   text: 'text-blue-800 dark:text-blue-200' },
  floor:  { bg: 'bg-purple-50 dark:bg-purple-900/30',    border: 'border-purple-200 dark:border-purple-700',   dot: 'bg-purple-500', text: 'text-purple-800 dark:text-purple-200' },
  arrive: { bg: 'bg-blue-100 dark:bg-blue-900/50',       border: 'border-blue-400 dark:border-blue-600',       dot: 'bg-blue-600',   text: 'text-blue-800 dark:text-blue-200' },
};

// ─── Direction steps panel ────────────────────────────────────────────────────
function DirectionsPanel({ steps, from, to, distance, walkingMinutes }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
      {/* Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        <div className="flex items-center gap-2 text-white text-sm font-semibold">
          <Navigation className="w-4 h-4" />
          Step-by-step directions
          <span className="text-blue-200 font-normal text-xs">({steps.length} steps)</span>
        </div>
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-white" />
          : <ChevronUp   className="w-4 h-4 text-white" />
        }
      </button>

      {!collapsed && (
        <div className="p-3 space-y-2">
          {/* Route banner */}
          <RouteBanner from={from} to={to} distance={distance} walkingMinutes={walkingMinutes} />

          {/* Steps */}
          <div className="relative mt-3">
            {/* Vertical connector line */}
            <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700 z-0" />

            <div className="space-y-2">
              {steps.map((step, i) => {
                const style = STEP_STYLE[step.type] || STEP_STYLE.walk;
                const isFirst = i === 0;
                const isLast  = i === steps.length - 1;
                return (
                  <div key={i} className={`relative flex gap-3 pl-1 ${isFirst || isLast ? 'z-10' : ''}`}>
                    {/* Step number / dot */}
                    <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 32 }}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10
                                       border-2 border-white dark:border-gray-800 shadow
                                       ${isFirst ? 'bg-emerald-500' : isLast ? 'bg-blue-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
                        {isFirst
                          ? <span className="text-white text-xs">GO</span>
                          : isLast
                            ? <span className="text-white text-xs">✓</span>
                            : <span className="text-gray-600 dark:text-gray-300 text-xs">{i}</span>
                        }
                      </div>
                    </div>

                    {/* Step content */}
                    <div className={`flex-1 rounded-xl border px-3 py-2 ${style.bg} ${style.border}`}>
                      <div className={`text-sm font-semibold leading-snug ${style.text} flex items-start gap-1.5`}>
                        <span className="text-base flex-shrink-0">{step.icon}</span>
                        <span>{step.text}</span>
                      </div>
                      {step.detail && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 pl-6">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{walkingMinutes} min at normal walking pace
            </div>
            <div>{distance}m total distance</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Location info card ───────────────────────────────────────────────────────
function LocationCard({ loc }) {
  return (
    <div className="mt-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl bg-blue-50 dark:bg-blue-900/30 flex-shrink-0">
          {loc.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{loc.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{loc.building} · Floor {loc.floor}</div>
          {loc.openingHours && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> {loc.openingHours}
            </div>
          )}
        </div>
      </div>
      {loc.description && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-700 pt-2">
          {loc.description}
        </p>
      )}
    </div>
  );
}

// ─── Chat message ─────────────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-2.5 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm
                      ${isBot ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      <div className={`max-w-[88%] ${!isBot ? 'items-end flex flex-col' : ''}`}>
        {/* Message bubble */}
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line
          ${isBot
            ? 'bg-blue-50 dark:bg-gray-700/70 text-gray-800 dark:text-gray-200 rounded-tl-sm'
            : 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
          }`}>
          {msg.content}
        </div>

        {/* Directions panel */}
        {msg.dirResult && msg.dirResult.steps.length > 0 && (
          <DirectionsPanel
            steps={msg.dirResult.steps}
            from={msg.fromLoc}
            to={msg.toLoc}
            distance={msg.dirResult.distance}
            walkingMinutes={msg.dirResult.walkingMinutes}
          />
        )}

        {/* Location card (without directions) */}
        {msg.locationCard && !msg.dirResult && (
          <LocationCard loc={msg.locationCard} />
        )}

        {/* Suggestion pills */}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.suggestions.map((s, i) => (
              <button key={i}
                onClick={() => s.onClick?.()}
                className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors font-medium">
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ─── Quick query chips ────────────────────────────────────────────────────────
const QUICK_QUERIES = [
  { label: '🔬 Physics Lab',     query: 'Where is the physics lab?' },
  { label: '🍽️ Canteen',         query: 'How to reach canteen?' },
  { label: '📚 Library',          query: 'Find the library' },
  { label: '👨‍💼 HOD CSE',         query: 'HOD CSE office' },
  { label: '🏥 Medical Center',  query: 'medical center' },
  { label: '⚽ Sports Ground',   query: 'sports ground' },
];

// ─── Main ChatPanel ───────────────────────────────────────────────────────────
export default function ChatPanel({ startPoint, onNavigate, accessibleOnly }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '👋 Hi! Ask me where any lab, classroom, hostel, or facility is — I\'ll show you the route on the map with step-by-step directions!\n\nTry: "Where is the physics lab?" or "How to get to HOD CSE?"',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), timestamp: Date.now(), ...msg }]);
  };

  const processQuery = async (query) => {
    addMessage({ role: 'user', content: query });
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 500));

    const intent = parseIntent(query);

    if (intent.type === 'navigate') {
      const { source, destination, alternatives, confidence } = intent;
      const startId = source?.id || startPoint?.id || 'main_gate';
      const endId   = destination.id;

      // Find start location object
      const { allLocations } = await import('../lib/fuzzySearch');
      const startLoc = allLocations.find(l => l.id === startId) || startPoint;

      if (startId === endId) {
        addMessage({
          role: 'assistant',
          content: `You're already at ${destination.name}! 🎯`,
          locationCard: destination,
        });
        setIsTyping(false);
        return;
      }

      const pathResult = dijkstra(graph, startId, endId, accessibleOnly);
      const dirResult  = pathResult ? generateDirections(pathResult, graph) : null;

      let content = '';
      if (confidence === 'low') {
        content = `I think you're looking for **${destination.name}**:\n`;
      } else {
        content = `Found **${destination.name}** — ${destination.building}, Floor ${destination.floor}.`;
      }
      if (!pathResult) {
        content += '\n\n⚠️ No walkable path found (may need special access).';
      }

      const msg = {
        role: 'assistant',
        content,
        fromLoc: startLoc,
        toLoc: destination,
        dirResult,
        locationCard: !dirResult ? destination : null,
      };

      if (alternatives?.length > 0) {
        msg.suggestions = alternatives.map(alt => ({
          label: `Did you mean: ${alt.name}?`,
          onClick: () => processQuery(`Where is ${alt.name}?`),
        }));
      }

      addMessage(msg);
      onNavigate?.(destination, pathResult?.path || [], startLoc);

    } else if (intent.type === 'nearby') {
      const { location } = intent;
      const nearby = getNearbyLocations(location.id, graph, 2);
      addMessage({
        role: 'assistant',
        content: `Facilities near **${location.name}**:`,
        suggestions: nearby.slice(0, 6).map(loc => ({
          label: `${loc.icon} ${loc.name}`,
          onClick: () => processQuery(`How to get to ${loc.name} from ${location.name}?`),
        })),
      });

    } else {
      const results = searchLocations(query, 3);
      if (results.length > 0) {
        addMessage({
          role: 'assistant',
          content: `I'm not sure I understood that. Did you mean one of these?`,
          suggestions: results.map(r => ({
            label: `${r.icon} ${r.name}`,
            onClick: () => processQuery(`Where is ${r.name}?`),
          })),
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `😕 I couldn't find that location. Try: labs, blocks (A/B/C/D), library, canteen, hostel, medical center, or sports ground.`,
        });
      }
    }

    setIsTyping(false);
  };

  const handleSend = () => {
    const q = input.trim();
    if (!q || isTyping) return;
    setInput('');
    processQuery(q);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips (only when fresh) */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">Try asking:</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUERIES.map((q, i) => (
              <button key={i} onClick={() => processQuery(q.query)}
                className="text-xs px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                           rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask anything… e.g. Where is the physics lab?"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                       placeholder-gray-400 max-h-24 overflow-y-auto"
          />
          <button onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white rounded-xl transition-colors flex-shrink-0 shadow-sm">
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
