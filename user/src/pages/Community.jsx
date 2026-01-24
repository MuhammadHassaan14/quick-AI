import React, {useEffect, useState} from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { Heart } from 'lucide-react'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {
  const [creations, setCreations] = useState([])
  const {user} = useUser()
  const [loading, setLoading] = useState(true)
  const {getToken} = useAuth()

  const fetchCreations = async () => {
    try {
      const token = await getToken()
      const {data} = await axios.get('/api/user/get-published-creations', {headers: {Authorization: `Bearer ${token}`}})
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
  const toggleLike = async (creationId) => {
    try {
      const token = await getToken()
      const {data} = await axios.post('/api/user/toggle-like-creations', 
        {id: creationId},
        {headers: {Authorization: `Bearer ${token}`}}
      )
      if(data.success){
        fetchCreations()//refresh creations after like/unlike
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error(error.response?.data?.message || error.message)
    }
  }
  useEffect(() => {
    if(user){
      fetchCreations()
    }
  }, [user])
  if(loading){
    return (
      <div className='flex-1 h-full flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    )
  }
  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <h1 className='text-2xl font-semibold text-gray-800'>Community Creations</h1>
      {creations.length === 0 ? (
        <div className='bg-white h-full w-full rounded-xl flex items-center justify-center'>
          <p className='text-gray-500'>No published creations yet</p>
        </div>
      ) : (
        <div className='bg-white h-full w-full rounded-xl overflow-y-scroll p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {creations.map((creation) => (
            <div key={creation.id} className='relative group'>
              <img 
                src={creation.content} 
                alt={creation.prompt || 'AI Creation'} 
                className='w-full h-64 object-cover rounded-lg'
              />
              <div className='absolute inset-0 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg transition-all'>
                <p className='text-sm hidden group-hover:block line-clamp-2'>
                  {creation.prompt}
                </p>
                <div 
                  className='flex gap-1 items-center cursor-pointer'
                  onClick={() => toggleLike(creation.id)}
                >
                  <p>{creation.likes?.length || 0}</p>
                  <Heart 
                    className={`min-w-5 h-5 hover:scale-110 transition-transform ${
                      creation.likes?.includes(user?.id) 
                        ? 'fill-red-500 text-red-600' 
                        : 'text-white'
                    }`}
                  />
                </div>
              </div>
            </div>      
          ))}
        </div>
      )}
    </div>
  )
}

export default Community
