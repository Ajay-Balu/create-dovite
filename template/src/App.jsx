import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import domoLogo from './assets/DOMO.svg'
import './App.css'
import { Button } from './components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='pt-[10%] bg-[#242424] h-[100vh]'>
      <div className='flex justify-center gap-2'>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a  href="#" target="_blank">
          <img src={domoLogo} className='logo domo' alt="DOMO logo" />
        </a>
      </div>
      <h1 className='text-3xl font-medium text-white'>Vite + React + DOMO</h1>
      <div className="card">
        <Button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
        <p className='mt-2'>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div >
  )
}

export default App
