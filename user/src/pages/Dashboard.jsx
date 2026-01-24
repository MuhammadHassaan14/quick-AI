import React, {useEffect, useState} from 'react'
import { dummyCreationData } from '../assets/assets'
import { Sparkles, Gem } from 'lucide-react'
import { Protect, useAuth } from '@clerk/clerk-react'
import CreationItem from '../components/CreationItem'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Dashboard = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const {getToken} = useAuth()

  const getDashboardData = async () => {
    try {
      const token = await getToken()
      const {data} = await axios.get('/api/user/get-user-creations', {headers: {Authorization: `Bearer ${token}`}})
      if(data.success){
        setCreations(data.creations)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }
  useEffect(() => {
    getDashboardData()
  }, [])

  return (
    <div className='h-full overflow-y-scroll p-6'>
      <div className='flex justify-start gap-4 flex-wrap'>
        {/* Total Creations card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-500'>
            <p className='text-sm'>Total Creations</p>
            <h2 className='text-xl font-semibold'>{creations.length}</h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center'>
            <Sparkles className='w-5 text-white'></Sparkles>
          </div>            
        </div>
        {/* Active Plan */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Active Plan</p>
            <h2 className='text-xl font-semibold'><Protect plan='premium' fallback="Free">Premium</Protect></h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF61C6] to-[#9E53EE] text-white flex justify-center items-center'>
            <Gem className='w-5 text-white'/>
          </div>            
        </div>

      </div>
      {
        loading ? (
          <div className='flex-1 h-full flex items-center justify-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'>
            </div>
          </div>
        ) : 
        (
          <div className='space-y-3'>
            <p className='mt-6 mb-4'>Recent Creations</p>
            {
              creations.map((item) => <CreationItem item={item} key={item.id} />)
            }
          </div>
        )
      }
    </div>
  )
}

export default Dashboard
