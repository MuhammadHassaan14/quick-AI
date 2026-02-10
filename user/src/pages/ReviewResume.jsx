import {useState} from 'react'
import { Sparkles, FileText } from 'lucide-react'
import axios from 'axios'
import { useAuth, useUser } from '@clerk/clerk-react';
import Markdown from 'react-markdown'
import toast from 'react-hot-toast'
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ReviewResume = () => {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const {getToken, isLoaded, isSignedIn} = useAuth()
  const { user } = useUser()

  const usage = user?.publicMetadata?.usage || {};
  const resumeUsage = usage.resume || 0;
  const plan = user?.publicMetadata?.plan || 'free';
  const isLimitReached = plan !== 'premium' && resumeUsage >= 1;

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!isLoaded) return
    if (!isSignedIn) {
      toast.error("Please sign in first")
      return
    }
    if (isLimitReached) {
      toast.error("Free limit reached. Please upgrade to premium.")
      return
    }
    try {
      setLoading(true)
      toast.loading("Analyzing resume... This may take 20-30 seconds", {id: 'analyzing'})
      const formData = new FormData()
      formData.append('resume', input)
      const token = await getToken()
      console.log("Uploading resume:", input.name)
      const {data} = await axios.post('/api/ai/resume-review', formData, {headers: {Authorization: `Bearer ${token}`,'Content-Type': 'multipart/form-data'}, timeout: 30000})
      toast.dismiss('analyzing')
      if(data.success){
        setContent(data.content)
        toast.success("Resume analyzed successfully!")
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.dismiss('analyzing')
      toast.error(error.message)
    }
      setLoading(false)
    }
  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      {/* left col */}
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#00AD83]'/>
          <h1 className='text-xl font-semibold'>Resume Review</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Upload Resume</p>
        <input onChange={(e)=>setInput(e.target.files[0])} type='file' accept='application/pdf' className='w-full p-2 mx-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600' required/>
        <p className='mt-1 text-xs font-light text-gray-500'>Supports PDF resume only.</p>
        <button disabled={loading || isLimitReached} className={`w-full flex justify-center items-center gap-2 text-white px-4 py-2 mt-6 text-sm rounded-lg transition-all ${isLimitReached ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-[#00DA83] to-[#009B83] cursor-pointer hover:shadow-lg'}`}>
          {
            loading ? <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span> : <FileText className='w-5'></FileText>
          }
          {isLimitReached ? 'Free Limit Reached' : 'Review Resume'}
        </button>
      </form>
      {/* right col */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>
        <div className='flex items-center gap-3'>
          <FileText className='w-5 h-5 text-[#00DA83]'/>
          <h1 className='text-xl font-semibold' >Analysis Results</h1>
        </div>
        {
          !content ? (
            <div className='flex-1 flex justify-center items-center'>
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
              <FileText className='w-9 h-9' />
              <p>Upload a resume and click "Review Resume" to get started</p> 
              </div>
            </div>
          ) : (
            <div className='mt-3 h-full overflow-y-scroll text-sm text-slate-600'>
              <div className='reset-tw'>
                <Markdown>{content}</Markdown>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default ReviewResume
