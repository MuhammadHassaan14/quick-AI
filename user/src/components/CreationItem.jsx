import {useState} from 'react'
import Markdown from 'react-markdown'
const CreationItem = ({item}) => {
  
  const [expanded, setExpanded] = useState(false);
    return (
    <div onClick={()=> setExpanded(!expanded)} className='p-4 w-full max-w-5xl text-sm bg-white border border-gray-200 rounded-lg cursor-pointer overflow-hidden transition-all hover:shadow-sm'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div className='flex-1 min-w-0'>
                <h2 className='font-medium text-slate-800 break-words'>{item.prompt}</h2>
                <p className='text-xs text-gray-500 mt-1 capitalize'>{item.type.replace('-', ' ')} • {new Date(item.created_at).toLocaleDateString()}</p>
            </div>
            <button className='bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0'>
              {item.type.replace('-', ' ')}
            </button>
        </div>
        {
            expanded && (
                <div className='mt-4 pt-4 border-t border-gray-50'>
                    {item.type === 'image' ? (
                        <div className='flex flex-col items-start gap-3'>
                            <img src={item.content} alt="generated" className='rounded-lg w-full max-w-lg h-auto shadow-sm border border-gray-100'/>
                        </div>    
                    ) : (
                        <div className='text-slate-700 leading-relaxed overflow-x-auto'>
                            <div className='reset-tw'>
                                <Markdown>
                                {item.content}
                                </Markdown>
                            </div>
                        </div>    
                    )}
                </div>    
            )
        }
    </div>
  )
}

export default CreationItem
