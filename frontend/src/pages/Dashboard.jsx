import { useEffect, useState } from 'react'
import { getStatus } from '../lib/api'

export default function Dashboard() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    getStatus()
      .then(d => setStatus(d.status))
      .catch(() => setStatus('API unreachable'))
  }, [])

  return <p className="p-6 text-lg font-semibold">API status: {status}</p>
}