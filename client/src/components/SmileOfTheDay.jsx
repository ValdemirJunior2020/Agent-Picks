// client/src/components/SmileOfTheDay.jsx
import { useMemo, useState } from 'react'
import { Heart, Sparkles, X, Smile, Lightbulb, PhoneCall } from 'lucide-react'

const smileItems = [
  {
    type: 'Gentle Joke',
    icon: '😊',
    title: 'Barbara’s Smile of the Day',
    text: 'Why did the calendar go to church? Because its days were numbered.',
    footer: 'A soft laugh for a busy QA day.',
  },
  {
    type: 'Gentle Joke',
    icon: '😄',
    title: 'Barbara’s Smile of the Day',
    text: 'Why did Noah do well in customer service? Because he knew how to keep things afloat.',
    footer: 'Clean, old-school, and safe.',
  },
  {
    type: 'Gentle Joke',
    icon: '😂',
    title: 'Barbara’s Smile of the Day',
    text: 'Why did the Bible study group bring a ladder? Because they wanted to go deeper and higher.',
    footer: 'A little smile for the meeting.',
  },
  {
    type: 'Gentle Joke',
    icon: '🌽',
    title: 'Barbara’s Smile of the Day',
    text: 'Why did the call center agent bring corn to work? Because they wanted to handle every kernel of the issue.',
    footer: 'Very corny, but friendly.',
  },
  {
    type: 'Gentle Joke',
    icon: '☎️',
    title: 'Barbara’s Smile of the Day',
    text: 'Why did the phone go to Sunday school? Because it wanted to learn how to answer the call.',
    footer: 'A small smile with a little faith.',
  },
  {
    type: 'Gentle Joke',
    icon: '📞',
    title: 'Barbara’s Smile of the Day',
    text: 'Why was the headset so calm? Because it had great connection.',
    footer: 'Good connection matters.',
  },
  {
    type: 'Did You Know?',
    icon: '📖',
    title: 'Barbara’s Did You Know?',
    text: 'Did you know? Proverbs 15:1 says, “A soft answer turns away wrath.” That is also great coaching wisdom.',
    footer: 'Gentleness before correction.',
  },
  {
    type: 'Did You Know?',
    icon: '🌿',
    title: 'Barbara’s Did You Know?',
    text: 'Did you know? Encouragement can change the tone of a difficult conversation before correction is even given.',
    footer: 'Leadership with grace.',
  },
  {
    type: 'Call Center Curiosity',
    icon: '🎧',
    title: 'Call Center Did You Know?',
    text: 'Did you know? A caller often decides how they feel about the service in the first few seconds of the call. Tone matters immediately.',
    footer: 'First impressions count.',
  },
  {
    type: 'Call Center Curiosity',
    icon: '📞',
    title: 'Call Center Did You Know?',
    text: 'Did you know? Silence on a call feels longer to the guest than it does to the agent. That is why small updates help the guest feel cared for.',
    footer: 'Keep the guest informed.',
  },
  {
    type: 'Call Center Curiosity',
    icon: '📝',
    title: 'Call Center Did You Know?',
    text: 'Did you know? Clear notes can protect the guest, the agent, and the company. Good documentation is part of good service.',
    footer: 'Notes matter.',
  },
  {
    type: 'Call Center Curiosity',
    icon: '💡',
    title: 'Call Center Did You Know?',
    text: 'Did you know? The best agents do not just answer questions. They guide the guest step by step so the guest feels safe.',
    footer: 'Ownership means guidance.',
  },
  {
    type: 'Encouragement',
    icon: '🕊️',
    title: 'Barbara’s Encouragement',
    text: 'Today’s reminder: God can use small acts of kindness to bring peace into a difficult conversation.',
    footer: 'Keep leading with grace.',
  },
  {
    type: 'Encouragement',
    icon: '🌼',
    title: 'Barbara’s Encouragement',
    text: 'A good leader corrects with truth, but also restores with love.',
    footer: 'A reminder for coaching conversations.',
  },
  {
    type: 'Encouragement',
    icon: '✝️',
    title: 'Barbara’s Encouragement',
    text: 'One gentle word can calm a stormy conversation. That is true in QA, leadership, and life.',
    footer: 'Small words, big impact.',
  },
]

function getTodayIndex() {
  const today = new Date()
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate()

  return seed % smileItems.length
}

function getRandomIndex(currentIndex) {
  if (smileItems.length <= 1) return 0

  let nextIndex = Math.floor(Math.random() * smileItems.length)

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * smileItems.length)
  }

  return nextIndex
}

function getTypeIcon(type) {
  if (type === 'Gentle Joke') return Smile
  if (type === 'Call Center Curiosity') return PhoneCall
  return Lightbulb
}

export default function SmileOfTheDay() {
  const startingIndex = useMemo(() => getTodayIndex(), [])
  const [selectedIndex, setSelectedIndex] = useState(startingIndex)
  const [isOpen, setIsOpen] = useState(false)

  const item = smileItems[selectedIndex]
  const TypeIcon = getTypeIcon(item.type)

  const handleNewSmile = () => {
    setSelectedIndex((current) => getRandomIndex(current))
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group w-full rounded-[1.5rem] border border-amber-300 bg-amber-50/90 p-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-500 hover:bg-amber-100/95 hover:shadow-lg dark:border-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-950/70"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-rose-700 text-2xl text-white shadow transition group-hover:scale-105">
            {item.icon}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-900 dark:bg-stone-900/80 dark:text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                {item.type}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-900 dark:bg-rose-950 dark:text-rose-100">
                <Heart className="h-3.5 w-3.5" />
                Faith-friendly
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                Click to open
              </span>
            </div>

            <h3 className="mt-2 font-serif text-xl font-black text-stone-900 dark:text-stone-50">
              {item.title}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-stone-700 dark:text-stone-200">
              {item.text}
            </p>

            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
              {item.footer}
            </p>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-stone-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-300 bg-stone-50 shadow-2xl dark:border-amber-800 dark:bg-stone-950">
            <div className="bg-gradient-to-r from-amber-800 via-rose-800 to-emerald-800 p-6 text-white">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                aria-label="Close smile of the day popup"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl shadow-inner">
                  {item.icon}
                </div>

                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-amber-100">
                    <TypeIcon className="h-4 w-4" />
                    {item.type}
                  </p>

                  <h2 className="font-serif text-3xl font-black">
                    {item.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 dark:border-stone-700 dark:bg-stone-900">
                <p className="text-lg font-bold leading-8 text-stone-900 dark:text-stone-100">
                  {item.text}
                </p>

                <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-200">
                  {item.footer}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                A little smile before the work begins. QA can be serious, but encouragement helps the room breathe.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleNewSmile}
                  className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow transition hover:bg-emerald-800"
                >
                  Show Another One
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-amber-300 bg-white px-5 py-3 text-sm font-black text-amber-900 shadow transition hover:bg-amber-50 dark:border-stone-700 dark:bg-stone-900 dark:text-amber-100 dark:hover:bg-stone-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}