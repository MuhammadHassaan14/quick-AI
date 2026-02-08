import {useState} from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {assets} from '../assets/assets'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useUser, SignIn } from '@clerk/clerk-react'
const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const {user} = useUser();
  return user ? (
    <div className='flex flex-col items-start justify-start h-screen'>
      <nav className='w-full px-6 sm:px-10 min-h-[64px] flex items-center justify-between bg-white border-b border-gray-100 shadow-sm z-40'>
        <div className='flex items-center gap-4'>
          <img className='cursor-pointer w-28 sm:w-24 transition-transform hover:scale-105' src={assets.newlogo} alt='Logo' onClick={() => navigate('/')} />
          <div className="hidden sm:block h-6 w-[1px] bg-gray-200 mx-2"></div>
          <p className="hidden sm:block text-xs font-medium text-gray-400 uppercase tracking-wider">Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
             onClick={() => navigate('/')}
             className="hidden sm:block text-sm font-medium text-gray-500 hover:text-primary transition-colors cursor-pointer"
          >
            Back to Site
          </button>
          {
            sidebar ? (
              <X onClick={() => setSidebar(false)} className='w-6 h-6 text-gray-500 cursor-pointer sm:hidden hover:text-primary transition-colors'/>
            ) : (
              <Menu onClick={() => setSidebar(true)} className='w-6 h-6 text-gray-500 cursor-pointer sm:hidden hover:text-primary transition-colors'/>
            )
          }
        </div>
      </nav>
      <div className='relative flex flex-1 w-full overflow-hidden'>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar}/>
        <div className='flex-1 bg-[#F4F7FB]'>
          <Outlet />
        </div>
      </div>

    </div>
  ) : (
    <div className='flex items-center justify-center h-screen'>
      <SignIn />
    </div>
  )
}

export default Layout
