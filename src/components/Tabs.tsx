import React, { useState } from 'react'

type Tab = {
  id: string
  label: string
  content: React.ReactNode
}

type TabsProps = {
  tabs: Tab[]
  defaultTab?: string
}

export default function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeContent = tabs.find((t) => t.id === activeTab)?.content

  return (
    <div>
      <div className="flex border-b border-[#1f2937] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeContent}</div>
    </div>
  )
}
