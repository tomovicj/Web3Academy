import { createFileRoute } from '@tanstack/react-router'

import SwapInterface from '@/components/SwapCard'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className='pt-20 px-4'>
      <SwapInterface />
    </div>
  )
}
