import './App.css'
import { BananaIcon } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-dot-grid pt-10">
      <div className="mx-auto w-fit">
        <div className="flex items-center justify-center gap-1 text-fluid-4xl tracking-tight leading-tight">
          <BananaIcon className="w-[1em] h-[1em] text-yellow-500" />
          <h1 className="font-bold">FuelStack</h1>
        </div>

        <div className="flex justify-between gap-2 items-baseline text-black">
          <p className="text-fluid-base max-w-[clamp(15ch,25vw,25ch)] text-balance leading-none">
            Plan your meals in an instant @ <span className='font-umich'>M</span>
          </p>
          <p className="text-fluid-base">Learn More</p>
        </div>
      </div>
    </div>
  )
}

export default App
