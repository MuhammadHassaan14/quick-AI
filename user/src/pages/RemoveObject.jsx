import {useState} from 'react'
import { Sparkles, Scissors, Download } from 'lucide-react'
import axios from 'axios'
import { useAuth, useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast'
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {
    const [input, setInput] = useState('')
    const [object, setObject] = useState('')
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState('')
    const {getToken, isLoaded, isSignedIn} = useAuth()
    const { user } = useUser()

    const usage = user?.publicMetadata?.usage || {};
    const imageEditUsage = usage.image_edit || 0;
    const plan = user?.publicMetadata?.plan || 'free';
    const isLimitReached = plan !== 'premium' && imageEditUsage >= 2;

    const downloadImage = async () => {
      try {
        const response = await fetch(content);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hypernova-object-removed-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        toast.error("Failed to download image");
      }
    };

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
        if(object.split(' ').length > 1){
          return toast('Please enter only one object name')
        }
        toast.loading("Removing Object... This may take 30-60 seconds", {id: 'processing'})
        const formData = new FormData()
        formData.append('image', input)
        formData.append('object', object)
        const token = await getToken()
        console.log("Sending request with image:", input.name)
        const {data} = await axios.post('/api/ai/remove-image-object', formData, {headers: {Authorization: `Bearer ${token}`}, timeout: 60000})
        toast.dismiss('processing')
        if(data.success){
          setContent(data.content)
          toast.success("Image generated successfully!")
        }else{
          toast.error(data.message)
        }
      } catch (error) {
        toast.dismiss('processing')
        toast.error(error.message)
      }
      setLoading(false)
    }
  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      {/* left col */}
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>

        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#4A7AFF]'/>
          <h1 className='text-xl font-semibold'>Object Removal</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload Image</p>
        <input onChange={(e)=>setInput(e.target.files[0])} type='file' accept='image/*' className='w-full p-2 mx-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600' required/>
        <p className='mt-6 text-sm font-medium'>Describe object name to remove</p>
        <textarea onChange={(e)=>setObject(e.target.value)} value={object} rows={4} className='w-full p-2 mx-3 mt-2 outline-none text-sm rounded-md border border-gray-300' placeholder='e.g. a watch, a spoon etc. (Only a single object)' required/>
        <button disabled={loading || isLimitReached} className={`w-full flex justify-center items-center gap-2 text-white px-4 py-2 mt-6 text-sm rounded-lg transition-all ${isLimitReached ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-[#417DF6] to-[#8E37EB] cursor-pointer hover:shadow-lg'}`}>
          {
            loading ? <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span> : <Scissors className='w-5'></Scissors>
          }
          {isLimitReached ? 'Free Limit Reached' : 'Remove Object'}
        </button>
      </form>
      {/* right col */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Scissors className='w-5 h-5 text-[#4A7AFF]'/>
            <h1 className='text-xl font-semibold' >Processed Image</h1>
          </div>
          {content && (
            <button 
              onClick={downloadImage}
              className='flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4A7AFF] transition-colors cursor-pointer group'
            >
              <Download className='w-4 h-4 group-hover:translate-y-0.5 transition-transform'/>
              Download
            </button>
          )}
        </div>
        {
          !content ? (
            <div className='flex-1 flex justify-center items-center'>
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
              <Scissors className='w-9 h-9' />
              <p>Upload an image and click "Remove Object" to get started</p> 
              </div>
            </div>
          ) : (
            <div className='mt-4 relative group'>
              <img src={content} alt='processed' className='w-full rounded-lg shadow-sm border border-gray-100'/>
              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg pointer-events-none'></div>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default RemoveObject
